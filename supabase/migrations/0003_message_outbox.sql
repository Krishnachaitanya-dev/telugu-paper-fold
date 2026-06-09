-- Migration 0003: Transactional outbox
-- Goal: reliable side-effects (push notifications, fan-out) for chat messages.
-- The message insert and its outbox event commit in the SAME transaction via a
-- trigger, so an event is never lost if the app crashes after insert. A worker
-- (Edge Function on cron) drains the outbox and marks rows processed.

create table if not exists public.message_outbox (
  id            bigint generated always as identity primary key,
  aggregate_id  uuid        not null,        -- conversation_id
  event_type    text        not null,        -- 'dm_message_created'
  payload       jsonb       not null,
  status        text        not null default 'pending',  -- pending | processing | done | failed
  attempts      integer     not null default 0,
  created_at    timestamptz not null default now(),
  processed_at  timestamptz
);

-- Worker claims pending rows ordered by id; index supports that scan.
create index if not exists message_outbox_pending_idx
  on public.message_outbox (status, id)
  where status = 'pending';

-- ─── Enqueue on message insert (same transaction) ───────────────────────────
create or replace function public.enqueue_dm_message_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.message_outbox (aggregate_id, event_type, payload)
  values (
    new.conversation_id,
    'dm_message_created',
    jsonb_build_object(
      'message_id',      new.id,
      'conversation_id', new.conversation_id,
      'sender_id',       new.sender_id,
      'message_type',    new.message_type,
      'created_at',      new.created_at
    )
  );
  return new;
end;
$$;

drop trigger if exists trg_enqueue_dm_message on public.dm_messages;
create trigger trg_enqueue_dm_message
  after insert on public.dm_messages
  for each row execute function public.enqueue_dm_message_event();

-- ─── Worker claim function (FOR UPDATE SKIP LOCKED — no double-processing) ───
-- Edge Function calls this to atomically grab a batch.
create or replace function public.claim_outbox_batch(p_limit integer default 50)
returns setof public.message_outbox
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.message_outbox o
  set status = 'processing', attempts = o.attempts + 1
  where o.id in (
    select id from public.message_outbox
    where status = 'pending'
    order by id
    limit p_limit
    for update skip locked
  )
  returning o.*;
end;
$$;

create or replace function public.mark_outbox_done(p_ids bigint[])
returns void
language sql
security definer
set search_path = public
as $$
  update public.message_outbox
  set status = 'done', processed_at = now()
  where id = any(p_ids);
$$;
