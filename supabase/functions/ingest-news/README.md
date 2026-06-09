# ingest-news

Fetches active RSS sources, summarizes article descriptions to 80 words or less
with Gemini, and stores the preprocessed summary in `news_updates.description`.
The Expo app only reads from Supabase and does not call Gemini.

## Secrets

```bash
supabase functions deploy ingest-news --project-ref gahfunvvsrrnfuiwwplx
supabase secrets set GEMINI_API_KEY=YOUR_GEMINI_KEY INGEST_CRON_SECRET=YOUR_RANDOM_SECRET --project-ref gahfunvvsrrnfuiwwplx
```

Optional:

```bash
supabase secrets set GEMINI_MODEL=gemini-2.5-flash --project-ref gahfunvvsrrnfuiwwplx
```

## Manual Run

```bash
curl -X POST "https://gahfunvvsrrnfuiwwplx.supabase.co/functions/v1/ingest-news" \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: YOUR_RANDOM_SECRET" \
  -d '{"dryRun":true,"limitPerFeed":3}'
```

## Cron

Enable `pg_cron` and `pg_net`, then replace `YOUR_RANDOM_SECRET` before running:

```sql
select cron.schedule(
  'ingest-news-every-15min',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://gahfunvvsrrnfuiwwplx.supabase.co/functions/v1/ingest-news',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', 'YOUR_RANDOM_SECRET'
    ),
    body := '{}'::jsonb
  );
  $$
);
```
