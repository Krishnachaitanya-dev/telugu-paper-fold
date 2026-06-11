## Goal

Switch the running app away from the current Lovable Cloud backend and point it at your own Supabase project at `https://gahfunvvsrrnfuiwwplx.supabase.co`, using the anon key you pasted.

## Changes

1. **Update `.env`** — replace the Lovable Cloud URL/key with your project's values, on the `EXPO_PUBLIC_*` keys the Expo runtime reads:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://gahfunvvsrrnfuiwwplx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...jIs2Qk
   ```
   The `VITE_*` duplicates (only used by the web-side `src/integrations/supabase/client.ts`) will also be updated to match, so nothing in the codebase still hits the old project.

2. **Restart Metro/dev server** so Expo re-inlines the new `EXPO_PUBLIC_*` values into the bundle. Without a restart, the app keeps the old URL baked in and you'll still see "No connection".

3. **Leave code untouched** — `src/core/env/env.ts`, `src/core/supabase/supabaseClient.ts`, and `lib/supabase.ts` already read these env vars; no source edits needed.

## What you need to verify on your Supabase project

For the home feed to actually render rows (not just connect), your project at `gahfunvvsrrnfuiwwplx` must have:

- A table `public.news_updates` with columns: `id`, `title`, `description`, `image_url`, `category`, `source_name`, `source_url`, `reporter_name`, `reporter_avatar_url`, `reporter_id`, `fact_check_status`, `created_at`.
- RLS enabled and a policy allowing public/anon `SELECT` (e.g. `USING (true)`).
- `GRANT SELECT ON public.news_updates TO anon, authenticated;`
- At least one row inserted.

Same shape is expected for `public.live_channels` and `public.reels` (already present in the current backend).

If those tables don't exist yet on your Supabase project, the feed will connect but show "No articles here yet" — that's a data problem on your side, not an app bug. I can't create them for you since I don't have admin access to your external Supabase project; you'd run the equivalent SQL in your own Supabase dashboard.

## Out of scope

- Not touching auth/social providers, RLS, or any other backend wiring.
- Not removing the Lovable Cloud integration from the project — only redirecting the runtime keys. The Cloud backend stays available if you ever want to switch back.
- No UI changes; the debug label from the previous turn stays.

## After implementation

Reload the app. Expected debug label sequence on the News tab: `NewsScreen · loading` → `NewsScreen · NewspaperFeed (N)` (if rows exist) or `NewsScreen · empty` (if the table is empty but reachable). If it stays on `NewsScreen · error`, your Supabase project is either missing the table, missing the public-read RLS policy, or missing the `GRANT SELECT TO anon` — tell me which and I'll guide the fix.
