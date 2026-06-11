import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeIcon } from "@/components/SafeIcon";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NewspaperFeed } from "@/components/news/NewspaperFeed";
import { SpeedNewsCard, type SpeedNewsItem } from "@/components/news/SpeedNewsCard";
import { db, type NewsUpdate } from "@/lib/supabase";
import {
  cacheNews,
  filterCached,
  formatCacheAge,
  getCachedNews,
  type CacheResult,
} from "@/lib/offlineCache";
import { saveShareDraft } from "@/lib/shareDraft";
import { filterNewsByCategory, NEWS_CATEGORIES } from "@/lib/newsCategories";
import { getFollowedReporterIds, getReporterFollowState, toggleReporterFollow } from "@/lib/reporterClient";

// ─── Constants ─────────────────────────────────────────────────────────────────

const CHIP_H       = 44;
const TWO_MIN_MS   = 2 * 60 * 1000;

const CATEGORIES = [...NEWS_CATEGORIES];
const SORT_OPTIONS = ["Latest", "Trending", "Most liked"] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

function normalizeSourceName(name: string) {
  return name
    .toLowerCase()
    .replace(/telugu|news|tv|channel|live/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function sourceLogoAliases(sourceName: string) {
  const normalized = normalizeSourceName(sourceName);
  const aliases = new Set([sourceName.toLowerCase(), normalized]);

  if (normalized.includes("v6") || normalized.includes("velugu")) aliases.add("v6");
  if (normalized.includes("10")) aliases.add("10");
  if (normalized.includes("ntv")) aliases.add("ntv");
  if (normalized.includes("tv9")) aliases.add("9");
  if (normalized.includes("abn") || normalized.includes("andhrajyothy")) aliases.add("abn");
  if (normalized.includes("sakshi")) aliases.add("sakshi");

  return aliases;
}

// ─── Action Bar ───────────────────────────────────────────────────────────────

const ActionBar = memo(function ActionBar({ item }: { item: NewsUpdate }) {
  const [liked,      setLiked]      = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [following,  setFollowing]  = useState(false);
  const [canFollow,  setCanFollow]  = useState(false);
  const [isSelf,     setIsSelf]     = useState(false);

  useEffect(() => {
    if (!item.reporter_id) return;
    let live = true;
    getReporterFollowState(item.reporter_id)
      .then((s) => {
        if (!live) return;
        setFollowing(s.following);
        setCanFollow(s.canFollow);
        setIsSelf(Boolean(s.isSelf));
      })
      .catch(() => {});
    return () => { live = false; };
  }, [item.reporter_id]);

  const haptic = useCallback(() => {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);

  const handleLike = useCallback(() => { haptic(); setLiked((v) => !v); }, [haptic]);
  const handleBookmark = useCallback(() => { haptic(); setBookmarked((v) => !v); }, [haptic]);

  const handleWhatsApp = useCallback(async () => {
    const text = encodeURIComponent(`${item.title}\n${item.source_url ?? ""}`);
    const url  = Platform.OS === "web"
      ? `https://wa.me/?text=${text}`
      : `whatsapp://send?text=${text}`;
    try { await Linking.openURL(url); }
    catch { Share.share({ message: `${item.title}\n${item.source_url ?? ""}`, title: item.title }); }
  }, [item.title, item.source_url]);

  const handleShare = useCallback(async () => {
    await Share.share({ message: `${item.title}\n\n${item.source_url ?? ""}`, title: item.title });
  }, [item.title, item.source_url]);

  const handleChat = useCallback(async () => {
    await saveShareDraft({ kind: "news", title: item.title, url: `app-news:${item.id}`, imageUrl: item.image_url });
    router.push("/(tabs)/chat" as never);
  }, [item.id, item.image_url, item.title]);

  const handleFollow = useCallback(async () => {
    if (!item.reporter_id) return;
    if (!canFollow) {
      Alert.alert("Sign in needed", "Please sign in to follow reporters.");
      return;
    }
    try {
      await toggleReporterFollow(item.reporter_id, following);
      setFollowing((p) => !p);
    } catch (err) {
      Alert.alert("Follow failed", err instanceof Error ? err.message : "Please sign in from Chat first.");
    }
  }, [canFollow, following, item.reporter_id]);

  const iconColor = "rgba(255,255,255,0.55)";

  return (
    <View style={styles.actionBar}>
      <TouchableOpacity onPress={handleLike} style={styles.actionBtn} activeOpacity={0.7}
        accessibilityRole="button" accessibilityLabel="Like">
        <Feather name="heart" size={18} color={liked ? "#0a9b9a" : iconColor} />
      </TouchableOpacity>

      <TouchableOpacity onPress={handleBookmark} style={styles.actionBtn} activeOpacity={0.7}
        accessibilityRole="button" accessibilityLabel="Bookmark">
        <Feather name="bookmark" size={18} color={bookmarked ? "#0a9b9a" : iconColor} />
      </TouchableOpacity>

      <TouchableOpacity onPress={handleWhatsApp} style={styles.actionBtn} activeOpacity={0.7}
        accessibilityRole="button" accessibilityLabel="Share to WhatsApp">
        <MaterialCommunityIcons name="whatsapp" size={20} color="#25D366" />
      </TouchableOpacity>

      <TouchableOpacity onPress={handleShare} style={styles.actionBtn} activeOpacity={0.7}
        accessibilityRole="button" accessibilityLabel="Share">
        <Feather name="share-2" size={18} color={iconColor} />
      </TouchableOpacity>

      <TouchableOpacity onPress={handleChat} style={styles.actionBtn} activeOpacity={0.7}
        accessibilityRole="button" accessibilityLabel="Send to chat">
        <Feather name="send" size={17} color={iconColor} />
      </TouchableOpacity>

      {item.reporter_id && !isSelf ? (
        <TouchableOpacity
          onPress={handleFollow}
          activeOpacity={0.75}
          style={[styles.followPill, following && styles.followPillActive]}
          accessibilityRole="button"
          accessibilityLabel={following ? "Unfollow reporter" : "Follow reporter"}
        >
          <Feather
            name={following ? "user-check" : "user-plus"}
            size={12}
            color={following ? "#0a9b9a" : "#fff"}
          />
          <Text style={[styles.followText, following && styles.followTextActive]}>
            {following ? "Following" : "Follow"}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
});

// ─── Category Bar ─────────────────────────────────────────────────────────────

const CategoryBar = memo(function CategoryBar({
  selected,
  onSelect,
  categories,
}: {
  selected: string;
  onSelect: (c: string) => void;
  categories: string[];
}) {
  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={categories}
      keyExtractor={(c) => c}
      contentContainerStyle={styles.chipRow}
      initialNumToRender={CATEGORIES.length}
      renderItem={({ item: cat }) => {
        const active = cat === selected;
        return (
          <TouchableOpacity
            onPress={() => onSelect(cat)}
            activeOpacity={0.72}
            style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.chipText, { color: active ? "#fff" : "rgba(255,255,255,0.65)" }]}>
              {cat}
            </Text>
          </TouchableOpacity>
        );
      }}
    />
  );
});

// ─── Sort Dropdown ─────────────────────────────────────────────────────────────

const SortBtn = memo(function SortBtn({
  sortOption,
  onSort,
}: {
  sortOption: SortOption;
  onSort: (s: SortOption) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <TouchableOpacity
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.75}
        style={styles.sortBtn}
      >
        <Feather name="sliders" size={12} color="rgba(255,255,255,0.55)" />
        <Text style={styles.sortBtnText}>{sortOption}</Text>
        <Feather name={open ? "chevron-up" : "chevron-down"} size={11} color="rgba(255,255,255,0.35)" />
      </TouchableOpacity>
      {open && (
        <View style={styles.sortSheet}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt}
              onPress={() => { onSort(opt); setOpen(false); }}
              activeOpacity={0.75}
              style={styles.sortOption}
            >
              <Text style={[styles.sortOptionText, opt === sortOption && styles.sortOptionActive]}>
                {opt}
              </Text>
              {opt === sortOption && <Feather name="check" size={13} color="#0a9b9a" />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
});

// ─── Offline Banner ───────────────────────────────────────────────────────────

function OfflineBanner({ cachedAt, onRetry }: { cachedAt: Date | null; onRetry: () => void }) {
  return (
    <View style={styles.offlineBanner}>
      <Feather name="wifi-off" size={12} color="#EA580C" />
      <Text style={styles.offlineBannerText}>
        Offline · Cached{cachedAt ? ` · ${formatCacheAge(cachedAt)}` : ""}
      </Text>
      <TouchableOpacity onPress={onRetry} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.offlineRetry}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function NewsScreen() {
  const insets = useSafeAreaInsets();

  const [feedHeight, setFeedHeight] = useState(0);

  const [category,            setCategory]            = useState("All");
  const [sortOption,          setSortOption]          = useState<SortOption>("Latest");
  const [refreshing,          setRefreshing]          = useState(false);
  const [followedReporterIds, setFollowedReporterIds] = useState<string[]>([]);
  const [speedNewsOpen,       setSpeedNewsOpen]       = useState(false);

  const [cache,       setCache]       = useState<CacheResult>({ articles: [], cachedAt: null });
  const [cacheLoaded, setCacheLoaded] = useState(false);

  useEffect(() => {
    let live = true;
    getCachedNews().then((r) => { if (live) { setCache(r); setCacheLoaded(true); } });
    return () => { live = false; };
  }, []);

  useEffect(() => {
    getFollowedReporterIds().then(setFollowedReporterIds).catch(() => setFollowedReporterIds([]));
  }, []);

  const topPad     = Platform.OS === "web" ? 67 : insets.top;
  const feedTop    = topPad + CHIP_H;
  const bottomPad  = insets.bottom + (Platform.OS === "web" ? 84 : 100);

  const { data: freshData, isLoading, isError, refetch } = useQuery({
    queryKey: ["news", category, followedReporterIds.join(",")],
    queryFn: async () => {
      const articles = await db.fetchNews(category, followedReporterIds);
      if (articles.length > 0) {
        const merged = Array.from(
          new Map([...articles, ...cache.articles].map((x) => [x.id, x])).values()
        );
        cacheNews(merged).then(() => setCache({ articles: merged, cachedAt: new Date() }));
      }
      return articles;
    },
    enabled: cacheLoaded,
    staleTime: TWO_MIN_MS,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 1,
  });

  const { data: liveChannels } = useQuery({
    queryKey: ["live-channels"],
    queryFn: db.fetchLiveChannels,
    staleTime: 10 * 60 * 1000,
  });

  const channelLogoMap = useMemo(() => {
    const map: Record<string, string> = {};
    liveChannels?.forEach((ch) => {
      if (!ch.logo_url) return;
      const normalized = normalizeSourceName(ch.channel_name);
      map[ch.channel_name.toLowerCase()] = ch.logo_url;
      map[normalized] = ch.logo_url;

      if (normalized.includes("v6")) map.v6 = ch.logo_url;
      if (normalized.includes("10")) map["10"] = ch.logo_url;
      if (normalized.includes("ntv")) map.ntv = ch.logo_url;
      if (normalized.includes("9")) map["9"] = ch.logo_url;
      if (normalized.includes("abn")) map.abn = ch.logo_url;
      if (normalized.includes("sakshi")) map.sakshi = ch.logo_url;
    });
    return map;
  }, [liveChannels]);

  const isOffline   = isError && cache.articles.length > 0;
  const sourceData  = freshData !== undefined ? freshData : filterCached(cache.articles, category);
  const rawData     = filterNewsByCategory(sourceData, category, followedReporterIds);

  const displayData = useMemo(() =>
    rawData.map((item) => ({
      ...item,
      reporter_avatar_url:
        item.reporter_avatar_url ??
        (item.source_name
          ? Array.from(sourceLogoAliases(item.source_name))
              .map((alias) => channelLogoMap[alias])
              .find(Boolean) ?? null
          : null),
    })),
    [rawData, channelLogoMap]
  );

  const showSpinner = (!cacheLoaded || isLoading) && cache.articles.length === 0 && !freshData;
  const showError   = isError && cache.articles.length === 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleSelectCategory = useCallback((c: string) => {
    if (c === "Speed") { setSpeedNewsOpen(true); return; }
    if (c === "Following") {
      getFollowedReporterIds().then(setFollowedReporterIds).catch(() => setFollowedReporterIds([]));
    }
    setCategory(c);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (category === "Reporters" || category === "Following") {
        getFollowedReporterIds().then(setFollowedReporterIds).catch(() => setFollowedReporterIds([]));
        refetch().catch(() => {});
      }
    }, [category, refetch])
  );

  const renderActions = useCallback(
    (item: NewsUpdate) => <ActionBar item={item} />,
    []
  );

  const speedItems = (displayData.slice(0, 10) as NewsUpdate[]).map(
    (a): SpeedNewsItem => ({
      id: a.id,
      title: a.title,
      summary: a.description ?? undefined,
      source: a.source_name ?? undefined,
      category: a.category ?? undefined,
      url: a.source_url ?? undefined,
      imageUrl: a.image_url ?? undefined,
      timeAgo: a.created_at
        ? (() => {
            const d = Date.now() - new Date(a.created_at).getTime();
            const m = Math.floor(d / 60000);
            if (m < 60) return `${m}m ago`;
            const h = Math.floor(m / 60);
            return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
          })()
        : undefined,
    })
  );

  const debugLabel = showSpinner
    ? "NewsScreen · loading"
    : showError
    ? "NewsScreen · error"
    : displayData.length === 0
    ? "NewsScreen · empty"
    : `NewsScreen · NewspaperFeed (${displayData.length})`;

  return (
    <View style={styles.container}>
      {/* TEMP DEBUG LABEL — remove when done */}
      <View pointerEvents="none" style={debugStyles.wrap}>
        <Text style={debugStyles.text}>{debugLabel}</Text>
      </View>


      {/* ══════════════════ CATEGORY CHIPS ════════════════════════════════════ */}
      <View style={[styles.chipBar, { top: topPad }]}>
        <View style={{ flex: 1 }}>
          <CategoryBar
            selected={category}
            onSelect={handleSelectCategory}
            categories={CATEGORIES}
          />
        </View>
        <View style={styles.chipBarDivider} />
        <SortBtn sortOption={sortOption} onSort={setSortOption} />
      </View>

      {/* ══════════════════ SPEED NEWS MODAL ══════════════════════════════════ */}
      <Modal
        visible={speedNewsOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSpeedNewsOpen(false)}
      >
        <SpeedNewsCard
          items={speedItems}
          onClose={() => setSpeedNewsOpen(false)}
        />
      </Modal>

      {/* ══════════════════ OFFLINE BANNER ════════════════════════════════════ */}
      {isOffline && (
        <OfflineBanner cachedAt={cache.cachedAt} onRetry={refetch} />
      )}

      {/* ══════════════════ FEED ══════════════════════════════════════════════ */}
      <View
        style={[styles.feedWrap, { paddingTop: feedTop }]}
        onLayout={(e) => setFeedHeight(e.nativeEvent.layout.height)}
      >
        {showSpinner ? (
          <View style={styles.center}>
            <View style={styles.statusIconWrap}>
              <Feather name="loader" size={24} color="#0a9b9a" />
            </View>
            <Text style={styles.statusText}>Loading news…</Text>
          </View>
        ) : showError ? (
          <View style={styles.center}>
            <View style={[styles.statusIconWrap, { backgroundColor: "rgba(239,68,68,0.12)" }]}>
              <Feather name="wifi-off" size={24} color="#EF4444" />
            </View>
            <Text style={styles.errorTitle}>No connection</Text>
            <Text style={styles.errorSub}>
              Pull to retry — articles load from{"\n"}cache once you've been online.
            </Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()} activeOpacity={0.8}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <NewspaperFeed
            key={category}
            data={displayData}
            renderActions={renderActions}
            cardHeight={feedHeight > 0 ? Math.max(320, feedHeight - feedTop) : undefined}
            contentPaddingTop={0}
            contentPaddingBottom={feedHeight > 0 ? 0 : bottomPad}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#0a9b9a"
                progressViewOffset={feedTop}
              />
            }
            emptyComponent={
              <View style={[styles.center, { marginTop: 60 }]}>
                <View style={styles.statusIconWrap}>
                  <Feather name="inbox" size={22} color="rgba(255,255,255,0.30)" />
                </View>
                <Text style={styles.emptyTitle}>No articles here yet</Text>
                <Text style={styles.emptySub}>Try a different category</Text>
              </View>
            }
          />
        )}
      </View>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050a0f" },

  // Category chips
  chipBar: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "#0d1320",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.09)",
    height: CHIP_H,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 8,
  },
  chipBarDivider: {
    width: StyleSheet.hairlineWidth,
    height: 22,
    backgroundColor: "rgba(255,255,255,0.09)",
    marginRight: 8,
  },
  chipRow: {
    paddingHorizontal: 14,
    gap: 6,
    flexDirection: "row",
    alignItems: "center",
    height: CHIP_H,
  },
  chip: {
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive:   { backgroundColor: "#0a9b9a", borderColor: "#0a9b9a" },
  chipInactive: { backgroundColor: "rgba(18,20,24,0.78)", borderColor: "rgba(255,255,255,0.16)" },
  chipText:     { fontSize: 11, fontWeight: "800", letterSpacing: 0.2 },

  // Sort
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(18,20,24,0.78)",
    marginRight: 4,
  },
  sortBtnText: { color: "rgba(255,255,255,0.80)", fontSize: 11, fontWeight: "700" },
  sortSheet: {
    position: "absolute",
    top: 34,
    right: 4,
    zIndex: 50,
    backgroundColor: "#111820",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    minWidth: 152,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    minHeight: 44,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  sortOptionText:   { color: "#ffffff", fontSize: 13, fontWeight: "600" },
  sortOptionActive: { color: "#0a9b9a", fontWeight: "800" },

  // Action bar (inside each card, passed via renderActions)
  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 12,
    gap: 0,
  },
  actionBtn: {
    flex: 1,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  followPill: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: "#0a9b9a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginLeft: 6,
    marginRight: 0,
  },
  followPillActive: {
    backgroundColor: "rgba(10,155,154,0.12)",
    borderWidth: 1.5,
    borderColor: "#0a9b9a",
  },
  followText:       { color: "#fff",    fontSize: 11, fontWeight: "800" },
  followTextActive: { color: "#0a9b9a" },

  // Feed wrapper
  feedWrap: { flex: 1 },

  // Status screens
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingTop: 80,
  },
  statusIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(10,155,154,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  statusText:  { color: "rgba(255,255,255,0.55)", fontSize: 14, fontWeight: "600" },
  errorTitle:  { color: "#ffffff", fontSize: 16, fontWeight: "800" },
  errorSub: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  retryBtn: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#0a9b9a",
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  retryBtnText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  emptyTitle:   { color: "#ffffff", fontSize: 15, fontWeight: "700", textAlign: "center" },
  emptySub:     { color: "rgba(255,255,255,0.45)", fontSize: 13, textAlign: "center" },

  // Offline banner
  offlineBanner: {
    position: "absolute",
    zIndex: 20,
    bottom: Platform.OS === "web" ? 90 : 108,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#0f1723",
    borderWidth: 1.5,
    borderColor: "#0a9b9a",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  offlineBannerText: { flex: 1, color: "#0a9b9a", fontSize: 12, fontWeight: "600" },
  offlineRetry:      { color: "#ffffff", fontSize: 12, fontWeight: "800" },
});

const debugStyles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 2,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: "center",
  },
  text: {
    backgroundColor: "rgba(10,155,154,0.95)",
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    letterSpacing: 0.3,
  },
});
