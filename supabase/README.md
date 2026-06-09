# Supabase Backend — Migrations & Functions

Backend hardening that closes the server-side gaps in the system-design review:
authoritative rate limiting, idempotency, transactional outbox, and RLS.

## STATUS (applied 2026-06-05 to gahfunvvsrrnfuiwwplx)

| Item | State |
|------|-------|
| Migrations 0001–0004 | ✅ APPLIED + verified (13/13 checks) |
| pg_cron prune job | ✅ scheduled (every 10 min) |
| RLS smoke test | ✅ public read 200, anon chat blocked |
| Edge function `outbox-worker` | ⏳ PENDING — deploy from owning account (403 from current CLI account) |
| outbox-drain cron | ⏳ PENDING — enable after function is deployed |

Applied directly via `scripts/apply-migrations.mjs` (not the CLI migration-history
table, which is managed separately on this project). Migrations are idempotent,
so folding them into the official history later via `migration repair` is safe.

### Remaining steps (owning account only)
```bash
# 1. deploy the outbox drainer
supabase functions deploy outbox-worker --project-ref gahfunvvsrrnfuiwwplx
# 2. then schedule the drain (SQL, see below) — calls the function every 30s
```

## Migrations (apply in order)

| File | Purpose |
|------|---------|
| `0001_idempotency_keys.sql` | `client_tag` + unique indexes — retries/double-taps can't duplicate rows |
| `0002_server_rate_limiting.sql` | `check_rate_limit()` + BEFORE INSERT triggers — server-enforced limits |
| `0003_message_outbox.sql` | Transactional outbox + `claim_outbox_batch()` — no lost side-effects |
| `0004_rls_policies.sql` | Row Level Security on every table |

| `0006_news_ingest_pipeline.sql` | RSS source table + news indexes for server-side ingest |

All migrations are **re-runnable** (`IF NOT EXISTS` / `DROP POLICY IF EXISTS`).

## How to apply

### Option A — Supabase CLI (recommended)
```bash
# one-time
supabase link --project-ref gahfunvvsrrnfuiwwplx
# apply all
supabase db push
```

### Option B — SQL editor (dashboard)
Paste each file's contents into the SQL editor in order 0001 through 0006 and run.

> WARNING: These run against **production data**. Take a backup first
> (`supabase db dump -f backup.sql`). Triggers change write behavior immediately.

## Schedule the housekeeping + worker

`pg_cron` (enable the extension first under Database → Extensions):

```sql
-- prune old rate-limit windows every 10 min
select cron.schedule('prune-rate-limits', '*/10 * * * *',
  $$ select public.prune_rate_limit_counters() $$);

-- drain outbox every 30s via the Edge Function
select cron.schedule('outbox-drain', '30 seconds',
  $$ select net.http_post(
       url := 'https://gahfunvvsrrnfuiwwplx.functions.supabase.co/outbox-worker',
       headers := '{"Content-Type":"application/json"}'::jsonb
     ) $$);
```

Deploy the worker:
```bash
supabase functions deploy outbox-worker
```

## Client wiring (already in the app)

- `src/core/resilience/idempotency.ts` → `idempotencyKey()` generates the `client_tag`
- `src/features/chat/api/chatMessageService.ts` → sends `client_tag` on insert
- The DB unique index makes a replayed insert a no-op (`ON CONFLICT DO NOTHING`)
- When a trigger raises `rate_limit_exceeded` (errcode P0001), the client maps it
  to `RateLimitError` via `fromSupabaseError`

## News ingest preprocessing

News should be fetched and summarized before it reaches the app. The client reads
`news_updates.description` directly; it no longer calls Gemini or ships a Gemini
key in the bundle.

Deploy and configure:
```bash
supabase functions deploy ingest-news --project-ref gahfunvvsrrnfuiwwplx
supabase secrets set GEMINI_API_KEY=YOUR_GEMINI_KEY INGEST_CRON_SECRET=YOUR_RANDOM_SECRET --project-ref gahfunvvsrrnfuiwwplx
```

`ingest-news` reads active rows from `rss_sources`, summarizes source text to 80
words or less with Gemini, inserts fresh rows into `news_updates`, and purges
articles older than 24 hours. If `GEMINI_API_KEY` is missing, it falls back to a
local 80-word truncation so ingest still works.

## What each gap closes (system-design review)

| Gap (was) | Now |
|-----------|-----|
| Client-only rate limiting (bypassable) | DB triggers — authoritative |
| Idempotency client-session only | Unique index — server-enforced across sessions/devices |
| No outbox (lost notifications on crash) | Transactional enqueue + skip-locked worker |
| RLS unverified | Explicit owner-scoped policies on every table |
