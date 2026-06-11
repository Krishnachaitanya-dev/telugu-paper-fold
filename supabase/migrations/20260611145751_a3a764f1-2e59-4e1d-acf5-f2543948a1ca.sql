ALTER TABLE public.live_channels
  ADD COLUMN IF NOT EXISTS logo_url text;

UPDATE public.live_channels
SET logo_url = logo_text
WHERE logo_url IS NULL
  AND logo_text IS NOT NULL;

ALTER TABLE public.reels
  ADD COLUMN IF NOT EXISTS video_id text,
  ADD COLUMN IF NOT EXISTS tag text,
  ADD COLUMN IF NOT EXISTS sort_order integer,
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS aspect_ratio text,
  ADD COLUMN IF NOT EXISTS duration_seconds integer,
  ADD COLUMN IF NOT EXISTS reporter_id uuid,
  ADD COLUMN IF NOT EXISTS reporter_avatar_url text;

UPDATE public.reels
SET
  video_id = COALESCE(video_id, youtube_id),
  source_url = COALESCE(source_url, CASE WHEN youtube_id IS NOT NULL THEN 'https://www.youtube.com/watch?v=' || youtube_id ELSE NULL END),
  tag = COALESCE(tag, category),
  sort_order = COALESCE(sort_order, 0),
  aspect_ratio = COALESCE(aspect_ratio, CASE WHEN is_short THEN '9:16' ELSE NULL END)
WHERE video_id IS NULL
   OR source_url IS NULL
   OR tag IS NULL
   OR sort_order IS NULL
   OR aspect_ratio IS NULL;

ALTER TABLE public.news_updates
  ADD COLUMN IF NOT EXISTS reporter_id uuid;

GRANT SELECT ON public.news_updates TO anon, authenticated;
GRANT SELECT ON public.reels TO anon, authenticated;
GRANT SELECT ON public.live_channels TO anon, authenticated;
GRANT ALL ON public.news_updates TO service_role;
GRANT ALL ON public.reels TO service_role;
GRANT ALL ON public.live_channels TO service_role;