-- Migration 0002: Server-side rate limiting
-- Goal: enforce rate limits in the database, not just the client. The client
-- limiter (lib/security/rateLimiter.ts) is bypassable; this is authoritative.
-- Approach: a sliding-window counter table + a check function + BEFORE INSERT
-- triggers on the abusable tables.

-- ─── Counter store ──────────────────────────────────────────────────────────
create table if not exists public.rate_limit_counters (
  bucket_key  text        not null,
  window_start timestamptz not null,
  hits        integer     not null default 0,
  primary key (bucket_key, window_start)
);

-- Drop stale windows cheaply on read paths.
create index if not exists rate_limit_counters_window_idx
  on public.rate_limit_counters (window_start);

-- ─── Check + increment (atomic) ─────────────────────────────────────────────
-- Returns true if the action is allowed, false if the limit is exceeded.
-- window_seconds defines the fixed window; max_hits the cap within it.
create or replace function public.check_rate_limit(
  p_key           text,
  p_max_hits      integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window timestamptz;
  v_hits   integer;
begin
  -- Fixed window bucket aligned to p_window_seconds.
  v_window := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.rate_limit_counters (bucket_key, window_start, hits)
  values (p_key, v_window, 1)
  on conflict (bucket_key, window_start)
    do update set hits = public.rate_limit_counters.hits + 1
  returning hits into v_hits;

  return v_hits <= p_max_hits;
end;
$$;

-- ─── Enforce on dm_messages ─────────────────────────────────────────────────
-- 20 messages / 60s per sender (matches the client limiter, now authoritative).
create or replace function public.enforce_dm_message_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.check_rate_limit(
       'dm:' || coalesce(auth.uid()::text, new.sender_id::text),
       20, 60
     ) then
    raise exception 'rate_limit_exceeded: too many messages, slow down'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_dm_message_rate_limit on public.dm_messages;
create trigger trg_dm_message_rate_limit
  before insert on public.dm_messages
  for each row execute function public.enforce_dm_message_rate_limit();

-- ─── Enforce on reporter_follows ────────────────────────────────────────────
-- 20 follow actions / 60s per follower.
create or replace function public.enforce_follow_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.check_rate_limit(
       'follow:' || coalesce(auth.uid()::text, new.follower_id::text),
       20, 60
     ) then
    raise exception 'rate_limit_exceeded: too many follow actions'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_follow_rate_limit on public.reporter_follows;
create trigger trg_follow_rate_limit
  before insert on public.reporter_follows
  for each row execute function public.enforce_follow_rate_limit();

-- ─── Housekeeping: prune old counter windows ────────────────────────────────
-- Call from pg_cron (see README) e.g. every 10 min.
create or replace function public.prune_rate_limit_counters()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.rate_limit_counters
  where window_start < now() - interval '1 hour';
$$;
