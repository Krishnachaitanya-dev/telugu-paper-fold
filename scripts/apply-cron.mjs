import pg from 'pg';

const client = new pg.Client({
  connectionString: process.env.DB_URL,
  ssl: { rejectUnauthorized: false },
});

const steps = [
  ['enable pg_cron extension', `create extension if not exists pg_cron;`],
  ['schedule rate-limit prune (every 10 min)',
    `select cron.schedule('prune-rate-limits', '*/10 * * * *',
       $$ select public.prune_rate_limit_counters() $$);`],
];

const run = async () => {
  await client.connect();
  for (const [label, sql] of steps) {
    process.stdout.write(`  • ${label} ... `);
    try {
      await client.query(sql);
      console.log('OK');
    } catch (e) {
      console.log(`SKIPPED (${e.message})`);
    }
  }
};

run().catch((e) => console.error(e.message)).finally(() => client.end());
