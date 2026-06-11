## Goal
Tear down the current Expo / React Native codebase and ship a clean **TanStack Start (React 19 + Vite)** web app that mirrors the look & feel of your Telugu news app — News feed + article detail, Reels (vertical video), Live channels, Profile/Settings — connected to the **same Lovable Cloud backend** (`news_updates`, `reels`, `live_channels`).

This is what the Lovable preview/build pipeline is actually designed for, so the live preview, publishing, and SSR will all start working again instead of fighting Expo Router on web.

## Design language (carried over from current app)
- Dark, premium news feel — bg `#0d1320`, primary teal `#0a9b9a`, accent pink `#ff4f87`
- Telugu-first typography with a strong display weight for headlines (Noto Sans Telugu + Inter pair)
- Pill-shaped active tab indicator (teal-tinted), top brand bar with logo + search
- News cards: large image, category chip, title, reporter row, fact-check badge
- Reels: full-bleed vertical video, right-side action rail (like / comment / share / save), bottom title + channel
- Live: grid of channel cards with logo, "LIVE" badge, tap to open player
- Profile: avatar header, saved/history/preferences/language/about list

## Scope (this pass)

### 1. Scaffold TanStack Start
- Replace `package.json`, `vite.config.ts`, `tsconfig.json` with a TanStack Start setup (React 19, Vite 7, Tailwind v4).
- Keep `src/integrations/supabase/client.ts` and `src/integrations/supabase/types.ts` exactly as-is so the backend keeps working.
- Drop Expo packages and the entire `app/` (Expo Router) tree, `android/`, `ios/`, native-only files.

### 2. Design system (src/styles.css)
- Define semantic tokens in `oklch` (background, surface, card, primary, primary-foreground, accent, pink, border, muted, etc.) for dark theme.
- shadcn primitives (button, card, badge, avatar, skeleton, sheet, tabs) themed to those tokens.
- One H1 font (display) + body font via Google Fonts import; Telugu fallback.

### 3. Routes (`src/routes/`)
- `__root.tsx` — html shell, top header (logo, search), bottom tab bar (News / Reels / Live / Profile), `<Outlet />`.
- `index.tsx` — News feed (category chips + infinite list of NewsCard).
- `news.$id.tsx` — Article detail (hero image, title, reporter, body, share row).
- `reels.tsx` — Vertical snap-scroll video feed using `<iframe>` YouTube embeds (works on web, unlike `expo-av`).
- `live.tsx` — Grid of live channels; tap opens an in-page player sheet.
- `profile.tsx` — Profile landing with list rows to `profile/saved`, `profile/history`, `profile/language`, `profile/about`.

### 4. Data layer
- `src/features/news/api.ts`, `reels/api.ts`, `live/api.ts` — each exports a `createServerFn` that reads from Supabase via `supabaseAdmin` (public read tables, no auth required).
- Each route uses the canonical `queryOptions` + `ensureQueryData` in loader + `useSuspenseQuery` in component.
- Empty states with Retry, skeletons while loading, error boundaries on every loader route.

### 5. UX details to preserve
- Pull-to-refresh equivalent on web → "Refresh" button + auto-refetch on tab focus.
- Category chips horizontally scrollable, sticky under header.
- Reels: keyboard ↑/↓ + scroll-snap navigation, mute toggle, action rail.
- Reporter avatars + names where present in the data.

## Out of scope (this pass)
- Auth / saved-for-later persistence (Profile lists render local placeholders until you ask for accounts).
- Chat tab (existing Expo chat code stays removed; can be re-added later).
- Native APK builds — this becomes a web app. Mobile shell can be revisited later.

## Technical notes
- Backend tables stay unchanged. No migrations.
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` already in `.env`, reused.
- Reels video uses YouTube iframe embeds keyed by `youtube_id` / `video_id`.
- All color/typography goes through `src/styles.css` tokens — no hard-coded `text-white` / `bg-[#...]`.

## Deliverable
After approval I will, in a small number of batched edits:
1. Wipe Expo/native files and rewrite `package.json` for TanStack Start.
2. Add `src/styles.css` design tokens + shadcn primitives.
3. Build the 6 routes above wired to the existing Supabase tables.
4. Verify the preview renders News, Reels, and Live with real data.

Approve this and I'll start.
