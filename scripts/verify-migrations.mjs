import pg from 'pg';

const client = new pg.Client({
  connectionString: process.env.DB_URL,
  ssl: { rejectUnauthorized: false },
});

const checks = [
  ['client_tag column on dm_messages',
    `select 1 from information_schema.columns where table_name='dm_messages' and column_name='client_tag'`],
  ['dm_messages_client_tag_uniq index',
    `select 1 from pg_indexes where indexname='dm_messages_client_tag_uniq'`],
  ['reporter_follows_pair_uniq index',
    `select 1 from pg_indexes where indexname='reporter_follows_pair_uniq'`],
  ['check_rate_limit function',
    `select 1 from pg_proc where proname='check_rate_limit'`],
  ['dm_message rate-limit trigger',
    `select 1 from pg_trigger where tgname='trg_dm_message_rate_limit'`],
  ['follow rate-limit trigger',
    `select 1 from pg_trigger where tgname='trg_follow_rate_limit'`],
  ['message_outbox table',
    `select 1 from information_schema.tables where table_name='message_outbox'`],
  ['enqueue trigger on dm_messages',
    `select 1 from pg_trigger where tgname='trg_enqueue_dm_message'`],
  ['claim_outbox_batch function',
    `select 1 from pg_proc where proname='claim_outbox_batch'`],
  ['RLS enabled on dm_messages',
    `select 1 from pg_class where relname='dm_messages' and relrowsecurity=true`],
  ['RLS enabled on news_updates',
    `select 1 from pg_class where relname='news_updates' and relrowsecurity=true`],
  ['policy: public read news',
    `select 1 from pg_policies where tablename='news_updates' and policyname='public read news'`],
  ['policy: send as self into own conversation',
    `select 1 from pg_policies where tablename='dm_messages' and policyname='send as self into own conversation'`],
];

const run = async () => {
  await client.connect();
  let pass = 0, fail = 0;
  for (const [label, sql] of checks) {
    const { rowCount } = await client.query(sql);
    const ok = rowCount > 0;
    console.log(`  ${ok ? '✓' : '✗'} ${label}`);
    ok ? pass++ : fail++;
  }
  console.log(`\n${pass}/${checks.length} checks passed${fail ? ` — ${fail} FAILED` : ''}`);
  if (fail) process.exitCode = 1;
};

run().catch((e) => { console.error(e.message); process.exitCode = 1; }).finally(() => client.end());
