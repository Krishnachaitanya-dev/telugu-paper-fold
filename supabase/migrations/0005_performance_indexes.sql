-- no-transaction
-- Performance indexes for 100K-user readiness.
-- This migration uses CREATE INDEX CONCURRENTLY, so it must run outside BEGIN/COMMIT.

-- STEP 1a: news_updates - the hot path (every feed load)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_news_created_at
  ON public.news_updates (created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_news_category_created_at
  ON public.news_updates (category, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_news_reporter_id_created_at
  ON public.news_updates (reporter_id, created_at DESC)
  WHERE reporter_id IS NOT NULL;

-- STEP 1b: full-text search on news (replaces ILIKE O(n) scans)
ALTER TABLE public.news_updates
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
  ) STORED;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_news_search_vector
  ON public.news_updates USING gin(search_vector);

-- STEP 1c: reels feed ordering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reels_created_at
  ON public.reels (created_at DESC);

-- STEP 1d: live channels ordering (low cardinality, small table - quick win)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_live_sort_order
  ON public.live_channels (sort_order ASC);

-- STEP 1e: chat - conversation list (the other hot path)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_user1_last_msg
  ON public.conversations (user1_id, last_message_at DESC NULLS LAST);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_user2_last_msg
  ON public.conversations (user2_id, last_message_at DESC NULLS LAST);

-- STEP 1f: dm_messages - message history pagination
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dm_messages_conv_created
  ON public.dm_messages (conversation_id, created_at DESC);

-- STEP 1g: mark-as-seen query
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dm_messages_seen
  ON public.dm_messages (conversation_id, is_seen, sender_id)
  WHERE is_seen = false;

-- STEP 1h: chat user discovery (online list + search)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_users_last_seen
  ON public.chat_users (last_seen_at DESC NULLS LAST);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_users_display_name
  ON public.chat_users USING gin(to_tsvector('simple', display_name));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_users_username
  ON public.chat_users (username);

-- STEP 1i: reporter follows (follow state + follower count)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reporter_follows_reporter_id
  ON public.reporter_follows (reporter_id);
