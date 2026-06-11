## UI/UX Audit — News & Reels

I went through `app/(tabs)/index.tsx`, `app/(tabs)/reels.tsx`, `components/news/AnimatedNewsCard.tsx`, `components/news/NewspaperFeed.tsx`, and the tab bar. Below is the senior-designer audit followed by a tight, scoped fix plan. No backend or data changes — pure presentation.

### Findings — News page

1. **Debug overlay shipped to users.** `NewsScreen` renders a floating "NewsScreen · NewspaperFeed (N)" label (lines 431–434). Looks unfinished.
2. **Header is missing.** There is no app title / logo / search affordance at top — the screen starts cold with category chips. Users have no anchor.
3. **Category chip bar is cramped.** Chips, a vertical divider, and the Sort dropdown all fight for 390px. Sort label ("Latest" + two icons) eats ~30% of the row; chips get cut off. Sort dropdown opens *inside* the chip bar with no scrim, often clipped under the feed.
4. **Card hierarchy is duplicated.** Category + time appear twice (badge on image AND meta row below), and time appears a third time in the source row. Visual noise.
5. **Action bar has no labels and weak affordance.** 5–6 monochrome 18px icons in a flat row at 55% white — like + bookmark + WhatsApp + share + send + follow pill. Tap targets are tight (~32px), the active state is just a color swap, no count, no separator from the card content.
6. **Card padding / rhythm.** Headline 20/27 is good, but `marginBottom:14` on summary + `marginBottom:14` on source row + action divider makes the bottom feel heavy. Source row has both `sourceName flex:1` AND `sourceSpacer flex:1` — a layout bug that pushes the time off-balance.
7. **Empty / loading states** use a basic spinner; we already have `NewsCardSkeleton` in `src/shared/skeleton/` that is unused here.
8. **Offline banner** is fine but uses a different orange (`#EA580C`) than the rest of the teal-accent system — inconsistent.

### Findings — Reels page

1. **Two stacked filter bars** (`ChannelBar` for All/Channels/Reporters/Following at `top = topPad + 46`, plus a second `CONTENT_FILTERS` bar at `top + 94`). On a 390×844 device that's ~140px of chrome floating over the video — covers the subject's face on most reels.
2. **Side action rail is too tall.** 8 stacked buttons (Like, Dislike, WhatsApp, Share, Chat, Poll, Follow, Mute) each with icon + label. With `cardHeight = height` the rail extends from mid-screen to the nav bar, overlapping the title/channel pill.
3. **No reporter / channel avatar on the reel itself.** Only a small text pill at bottom. TikTok / Reels / Shorts conventions all put the creator avatar above the like button — users expect it.
4. **Title + channel pill sits under a heavy 88% black gradient** that runs from 45% of the screen — darkens the bottom half of the video unnecessarily. Should be a shorter, sharper scrim.
5. **Poll button in the side rail is surprising.** It's the same visual weight as Like/Share but opens an unrelated modal. Belongs in an overflow / "…" menu, not the primary rail.
6. **Mute toggle position.** Buried at the bottom of an 8-item rail — should be top-right corner per platform convention so it's reachable without scanning.
7. **Progress dots** render but only when `cardHeight` is provided; on Reels they're on the right edge at 14px tall, easy to miss.
8. **Tab bar `News` icon is a `book-open` SVG via `SafeIcon`**, while the other tabs use raster `Image` with `tintColor`. Visual weight differs (the SVG is 20px, the images are 24–28px). Inconsistent.

### Cross-cutting

- Two parallel design systems coexist: `constants/colors.ts` (used by `useColors`) and `src/design/tokens/colors.ts` (used by `useTheme`). Components mix them. Not a blocker today, but every new color hardcoded as `"#0a9b9a"` makes the eventual cleanup harder.
- Many components hardcode `"#fff"`, `"rgba(255,255,255,0.x)"`, `"#0a9b9a"` directly — fine for this pass, flagged for future.

---

## Fix Plan (scope: News + Reels presentation only)

### News screen
- Remove the debug label overlay.
- Add a compact header row above the chip bar: app wordmark (left), search icon + bell icon (right). ~44px tall, same dark surface as chip bar.
- Restructure chip bar: chips take full width with horizontal scroll; move Sort into a small icon-only button (sliders icon) that opens a proper bottom sheet modal (with scrim), not an in-flow dropdown.
- Replace in-screen spinner with 3 `NewsCardSkeleton` placeholders (component already exists).
- Tighten `AnimatedNewsCard`:
  - Remove the duplicated category badge on the image (keep only the meta row under the image) OR remove the meta-row category dot+label — pick one. Plan: keep image badge, drop meta-row category, keep time in meta row.
  - Fix the `sourceSpacer flex:1` + `sourceName flex:1` layout bug → use a single spacer.
  - Drop bottom margins from 14 → 10 for a calmer rhythm.
- Action bar refresh:
  - Bump icon size 18 → 20, button hit area to 40×40.
  - Add a thin top divider already present, plus add small count text under Like / Share when available (placeholder "—" when not).
  - Group: Like · Bookmark · Share · Send-to-chat on the left; WhatsApp + Follow pill on the right (justify-between).

### Reels screen
- Collapse the two filter bars into one bar with a segmented control (All / Channels / Reporters / Following), and move content filters (Latest / Politics / …) behind a small "filter" chip that opens a sheet. Reduces top chrome from ~140px to ~60px.
- Shorten the bottom gradient (start at 65% instead of 45%, max opacity 0.7).
- Add a circular reporter/channel avatar at the top of the side rail (44×44, ring in `#0a9b9a` if following).
- Move Mute to top-right corner of the reel (floating round button), remove from the side rail.
- Move Poll into an overflow "…" button at the bottom of the side rail.
- Rail order top→bottom: Avatar · Like(+count) · Dislike · Comment/Chat · Share · WhatsApp · More(…). Reduces rail height by ~30%.
- Title block: show channel pill + title in 2 lines max; raise it ~8px so it clears the new (shorter) gradient cleanly.

### Tab bar
- Swap the News tab's `SafeIcon book-open` for the same raster `Image` pattern as the other tabs (add `assets/tab-icons/icon-news.png`) — or, simpler, render all 5 tabs through `SafeIcon` with Feather icons so weights match. Plan: use SafeIcon/Feather for all 5 (`book-open`, `film`, `radio`, `message-circle`, `user`) at 22px. One consistent system.

### Files I expect to touch
- `app/(tabs)/index.tsx` — header, chip bar layout, sort sheet, skeletons, remove debug label.
- `app/(tabs)/reels.tsx` — merge filter bars, side-rail reorder, mute float, avatar, gradient.
- `components/news/AnimatedNewsCard.tsx` — dedupe meta, fix source row spacer, tighten spacing.
- `app/(tabs)/_layout.tsx` — unify tab icons.
- (new) small `FilterSheet` component used by both screens.

### Out of scope (explicit)
- No data, query, Supabase, or auth changes.
- No new colors in `src/design/tokens` (still flagged as future cleanup).
- No copy/i18n changes.
- No animation library swaps.

Want me to proceed with all of the above, or trim any section before I build?
