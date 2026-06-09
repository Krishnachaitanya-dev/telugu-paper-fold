-- Migration 0001: Idempotency keys
-- Goal: make writes safe to retry. A client generates a UUID per logical action
-- and sends it as client_tag. A UNIQUE index turns a replayed insert into a
-- no-op (ON CONFLICT DO NOTHING) instead of a duplicate row.
-- Re-runnable: guarded with IF NOT EXISTS.

-- ─── dm_messages: dedupe message sends ──────────────────────────────────────
alter table public.dm_messages
  add column if not exists client_tag uuid;

-- Partial unique index: only enforce when client_tag is present, so legacy
-- rows with NULL tags are unaffected.
create unique index if not exists dm_messages_client_tag_uniq
  on public.dm_messages (sender_id, client_tag)
  where client_tag is not null;

-- ─── reporter_follows: natural-key uniqueness (dedupe double-follow) ─────────
-- A follower can follow a reporter at most once. This is the real idempotency
-- guarantee for the follow action — no separate tag needed.
create unique index if not exists reporter_follows_pair_uniq
  on public.reporter_follows (follower_id, reporter_id);

-- ─── conversations: one conversation per ordered user pair ──────────────────
create unique index if not exists conversations_pair_uniq
  on public.conversations (user1_id, user2_id);
