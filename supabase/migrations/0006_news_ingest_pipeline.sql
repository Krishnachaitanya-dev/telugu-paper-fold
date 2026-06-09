-- News ingest pipeline support.
-- Edge Function `ingest-news` reads rss_sources, summarizes source text with
-- the GEMINI_API_KEY Edge secret, and stores the preprocessed description in
-- public.news_updates for the app to read directly.

create table if not exists public.rss_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  feed_url text not null unique,
  category text not null default 'Top',
  is_active boolean not null default true,
  license_status text not null default 'pending'
    check (license_status in ('pending','licensed','link_only','blocked')),
  created_at timestamptz not null default now()
);

alter table public.rss_sources enable row level security;

drop policy if exists "service role can manage rss sources" on public.rss_sources;
create policy "service role can manage rss sources" on public.rss_sources
  for all using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

alter table public.news_updates
  add column if not exists source_url text,
  add column if not exists source_name text,
  add column if not exists description text,
  add column if not exists image_url text,
  add column if not exists category text not null default 'Top',
  add column if not exists created_at timestamptz not null default now();

create unique index if not exists idx_news_updates_source_url_unique
  on public.news_updates (source_url)
  where source_url is not null;

create index if not exists idx_news_updates_created_at
  on public.news_updates (created_at desc);

create index if not exists idx_news_updates_category_created_at
  on public.news_updates (category, created_at desc);
