// Direct SQL applier — runs supabase/migrations/*.sql in order over a single
// connection. Used because the remote project's migration history is managed
// elsewhere; our migrations are idempotent (IF NOT EXISTS / DROP ... IF EXISTS),
// safe to apply directly. Connection string comes from DB_URL env (never a file).
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const DB_URL = process.env.DB_URL;
if (!DB_URL) {
  console.error('DB_URL env var required');
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, '..', 'supabase', 'migrations');

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

const client = new pg.Client({
  connectionString: DB_URL,
  ssl: { rejectUnauthorized: false },
});

const splitSqlStatements = (sql) =>
  sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((stmt) => stmt.trim())
    .filter(Boolean)
    .map((stmt) => `${stmt};`);

const run = async () => {
  await client.connect();
  console.log(`Connected. Applying ${files.length} migration file(s):\n`);
  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), 'utf8');
    const noTransaction = sql.trimStart().startsWith('-- no-transaction');
    process.stdout.write(`  • ${file} ... `);
    try {
      if (noTransaction) {
        for (const statement of splitSqlStatements(sql)) {
          await client.query(statement);
        }
      } else {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
      }
      console.log('OK');
    } catch (e) {
      if (!noTransaction) {
        await client.query('ROLLBACK').catch(() => {});
      }
      console.log(noTransaction ? 'FAILED' : 'FAILED (rolled back)');
      console.error(`\n    ${e.message}\n`);
      throw e;
    }
  }
  console.log('\nAll migrations applied.');
};

run()
  .catch((e) => {
    console.error('Migration run failed:', e.message);
    process.exitCode = 1;
  })
  .finally(() => client.end());
