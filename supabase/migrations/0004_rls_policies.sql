-- Migration 0004: Row Level Security hardening
-- Goal: enforce access control at the database, independent of client code.
-- Public content is world-readable; user data is owner-scoped; new internal
-- tables (rate_limit_counters, message_outbox) are locked to service_role only.
-- Re-runnable: every policy is dropped before create.

-- ─── Public read-only content ───────────────────────────────────────────────
alter table public.news_updates   enable row level security;
alter table public.reels          enable row level security;
alter table public.live_channels  enable row level security;

drop policy if exists "public read news"  on public.news_updates;
create policy "public read news"  on public.news_updates
  for select using (true);

drop policy if exists "public read reels" on public.reels;
create policy "public read reels" on public.reels
  for select using (true);

drop policy if exists "public read live" on public.live_channels;
create policy "public read live" on public.live_channels
  for select using (true);

-- ─── chat_users: read all, write only self ──────────────────────────────────
alter table public.chat_users enable row level security;

drop policy if exists "read chat users"   on public.chat_users;
create policy "read chat users"   on public.chat_users
  for select using (true);

drop policy if exists "upsert own chat user" on public.chat_users;
create policy "upsert own chat user" on public.chat_users
  for insert with check (auth.uid() = id);

drop policy if exists "update own chat user" on public.chat_users;
create policy "update own chat user" on public.chat_users
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ─── conversations: only participants ────────────────────────────────────────
alter table public.conversations enable row level security;

drop policy if exists "read own conversations" on public.conversations;
create policy "read own conversations" on public.conversations
  for select using (auth.uid() = user1_id or auth.uid() = user2_id);

drop policy if exists "create conversation as participant" on public.conversations;
create policy "create conversation as participant" on public.conversations
  for insert with check (auth.uid() = user1_id or auth.uid() = user2_id);

drop policy if exists "update own conversations" on public.conversations;
create policy "update own conversations" on public.conversations
  for update using (auth.uid() = user1_id or auth.uid() = user2_id);

-- ─── dm_messages: only sender inserts; only participants read ───────────────
alter table public.dm_messages enable row level security;

drop policy if exists "read messages in own conversations" on public.dm_messages;
create policy "read messages in own conversations" on public.dm_messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = dm_messages.conversation_id
        and (auth.uid() = c.user1_id or auth.uid() = c.user2_id)
    )
  );

drop policy if exists "send as self into own conversation" on public.dm_messages;
create policy "send as self into own conversation" on public.dm_messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = dm_messages.conversation_id
        and (auth.uid() = c.user1_id or auth.uid() = c.user2_id)
    )
  );

drop policy if exists "update seen in own conversation" on public.dm_messages;
create policy "update seen in own conversation" on public.dm_messages
  for update using (
    exists (
      select 1 from public.conversations c
      where c.id = dm_messages.conversation_id
        and (auth.uid() = c.user1_id or auth.uid() = c.user2_id)
    )
  );

-- ─── reporter_profiles: read all, write own ─────────────────────────────────
alter table public.reporter_profiles enable row level security;

drop policy if exists "read reporter profiles" on public.reporter_profiles;
create policy "read reporter profiles" on public.reporter_profiles
  for select using (true);

drop policy if exists "upsert own reporter profile" on public.reporter_profiles;
create policy "upsert own reporter profile" on public.reporter_profiles
  for insert with check (auth.uid() = id);

drop policy if exists "update own reporter profile" on public.reporter_profiles;
create policy "update own reporter profile" on public.reporter_profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ─── reporter_follows: follower owns the row ────────────────────────────────
alter table public.reporter_follows enable row level security;

drop policy if exists "read follows" on public.reporter_follows;
create policy "read follows" on public.reporter_follows
  for select using (true);

drop policy if exists "follow as self" on public.reporter_follows;
create policy "follow as self" on public.reporter_follows
  for insert with check (auth.uid() = follower_id);

drop policy if exists "unfollow as self" on public.reporter_follows;
create policy "unfollow as self" on public.reporter_follows
  for delete using (auth.uid() = follower_id);

-- ─── Internal tables: service_role only (no public access) ──────────────────
alter table public.rate_limit_counters enable row level security;
alter table public.message_outbox      enable row level security;
-- No policies created => only service_role (which bypasses RLS) can touch them.
-- The rate-limit trigger functions are SECURITY DEFINER so they still work.
