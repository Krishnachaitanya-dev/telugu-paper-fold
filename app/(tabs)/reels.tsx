import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import InAppYouTubePlayer from "@/components/InAppYouTubePlayer";
import { PollCard, type PollData } from "@/components/news/PollCard";
import { db, type Reel } from "@/lib/supabase";
import { saveShareDraft } from "@/lib/shareDraft";
import {
  cacheReels,
  formatCacheAge,
  getCachedReels,
  type ReelsCacheResult,
} from "@/lib/offlineCache";
import { getFollowedReporterIds, getReporterFollowState, toggleReporterFollow } from "@/lib/reporterClient";

const SAMPLE_POLL: PollData = {
  id: "poll-1",
  question: "ఈ రోజు రాష్ట్రంలో అత్యంత ముఖ్యమైన సమస్య ఏది?",
  options: [
    { id: "a", label: "నిరుద్యోగం", votes: 412 },
    { id: "b", label: "ధరల పెరుగుదల", votes: 389 },
    { id: "c", label: "విద్యుత్ సమస్య", votes: 178 },
    { id: "d", label: "రహదారుల స్థితి", votes: 203 },
  ],
  totalVotes: 1182,
};

const ALL_CHANNELS = "All";
const CHANNELS_FILTER = "Channels";
const REEL_FILTERS = ["All", CHANNELS_FILTER, "Reporters", "Following"] as const;
const CONTENT_FILTERS = ["Latest", "Local", "Politics", "Movies", "Sports", "Trending"] as const;
type ContentFilter = (typeof CONTENT_FILTERS)[number];
const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

function getThumb(videoId: string) {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

function isPortraitReel(reel: Reel) {
  return reel.is_short === true || reel.aspect_ratio === "9:16" || reel.source_url?.includes("/shorts/");
}

function isUsefulReelTitle(title: string) {
  const normalized = title.trim().toLowerCase();
  return ![
    "short",
    "shorts",
    "subtitles and closed captions",
    "keyboard shortcuts",
    "spherical videos",
  ].includes(normalized);
}

// ─── Side Action Buttons ──────────────────────────────────────────────────────

const SideActions = memo(function SideActions({
  reel,
  muted,
  onToggleMute,
}: {
  reel: Reel;
  muted: boolean;
  onToggleMute: () => void;
}) {
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [following, setFollowing] = useState(false);
  const [canFollow, setCanFollow] = useState(false);
  const [isSelfReporter, setIsSelfReporter] = useState(false);
  const [pollOpen, setPollOpen] = useState(false);

  const url = reel.source_url ?? `https://www.youtube.com/watch?v=${reel.video_id}`;

  useEffect(() => {
    let mounted = true;
    if (!reel.reporter_id) {
      setCanFollow(false); setFollowing(false); setIsSelfReporter(false);
      return;
    }
    getReporterFollowState(reel.reporter_id)
      .then((state) => {
        if (!mounted) return;
        setFollowing(state.following);
        setCanFollow(state.canFollow);
        setIsSelfReporter(Boolean(state.isSelf));
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [reel.reporter_id]);

  const handleLike = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setLiked((v) => { if (!v) setDisliked(false); return !v; });
  }, []);

  const handleDislike = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setDisliked((v) => { if (!v) setLiked(false); return !v; });
  }, []);

  const handleShare = useCallback(async () => {
    await Share.share({ message: `${reel.title}\n${url}`, title: reel.title });
  }, [reel.title, url]);

  const handleWhatsApp = useCallback(async () => {
    const text = encodeURIComponent(`${reel.title}\n${url}`);
    const waUrl = Platform.OS === "web"
      ? `https://wa.me/?text=${text}`
      : `whatsapp://send?text=${text}`;
    try {
      await Linking.openURL(waUrl);
    } catch {
      Share.share({ message: `${reel.title}\n${url}`, title: reel.title });
    }
  }, [reel.title, url]);

  const handleShareToChat = useCallback(async () => {
    await saveShareDraft({ kind: "reel", title: reel.title, url, imageUrl: getThumb(reel.video_id) });
    router.push("/(tabs)/chat" as never);
  }, [reel.title, reel.video_id, url]);

  const handleFollow = useCallback(async () => {
    if (!reel.reporter_id) return;
    if (!canFollow) { Alert.alert("Sign in needed", "Please sign in once to follow reporters."); return; }
    try {
      await toggleReporterFollow(reel.reporter_id, following);
      setFollowing((v) => !v);
    } catch (err) {
      Alert.alert("Follow failed", err instanceof Error ? err.message : "Could not follow reporter");
    }
  }, [canFollow, following, reel.reporter_id]);

  return (
    <>
      <View style={styles.sideActions}>
        <TouchableOpacity onPress={handleLike} style={styles.sideBtn} activeOpacity={0.75}>
          <View style={[styles.sideBtnIcon, liked && styles.sideBtnIconActive]}>
            <Feather name="heart" size={22} color={liked ? "#ff4f87" : "#fff"} />
          </View>
          <Text style={styles.sideBtnLabel}>Like</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleDislike} style={styles.sideBtn} activeOpacity={0.75}>
          <View style={[styles.sideBtnIcon, disliked && styles.sideBtnIconDislike]}>
            <Feather name="thumbs-down" size={20} color={disliked ? "#ff9f40" : "#fff"} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleShareToChat} style={styles.sideBtn} activeOpacity={0.75}>
          <View style={styles.sideBtnIcon}>
            <Feather name="message-circle" size={20} color="#fff" />
          </View>
          <Text style={styles.sideBtnLabel}>Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleShare} style={styles.sideBtn} activeOpacity={0.75}>
          <View style={styles.sideBtnIcon}>
            <Feather name="share-2" size={20} color="#fff" />
          </View>
          <Text style={styles.sideBtnLabel}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleWhatsApp} style={styles.sideBtn} activeOpacity={0.75}>
          <View style={styles.sideBtnIcon}>
            <MaterialCommunityIcons name="whatsapp" size={22} color="#25D366" />
          </View>
        </TouchableOpacity>

        {reel.reporter_id && !isSelfReporter ? (
          <TouchableOpacity onPress={handleFollow} style={styles.sideBtn} activeOpacity={0.75}>
            <View style={[styles.sideBtnIcon, following && styles.sideBtnIconFollow]}>
              <Feather name={following ? "user-check" : "user-plus"} size={20} color={following ? "#0a9b9a" : "#fff"} />
            </View>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity onPress={() => setPollOpen(true)} style={styles.sideBtn} activeOpacity={0.75}>
          <View style={[styles.sideBtnIcon, styles.sideBtnIconPoll]}>
            <Feather name="bar-chart-2" size={20} color="#0a9b9a" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Poll sheet */}
      <Modal visible={pollOpen} transparent animationType="slide" onRequestClose={() => setPollOpen(false)}>
        <Pressable style={styles.pollScrim} onPress={() => setPollOpen(false)}>
          <Pressable style={styles.pollSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.pollHandle} />
            <PollCard poll={SAMPLE_POLL} />
            <TouchableOpacity style={styles.pollClose} onPress={() => setPollOpen(false)}>
              <Text style={styles.pollCloseText}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
});

// ─── Single Reel Card ─────────────────────────────────────────────────────────

const ReelCard = memo(function ReelCard({
  reel,
  cardHeight,
  width,
  insets,
  isVisible,
  shouldMountPlayer,
}: {
  reel: Reel;
  cardHeight: number;
  width: number;
  insets: { top: number; bottom: number };
  isVisible: boolean;
  shouldMountPlayer: boolean;
}) {
  const [muted, setMuted] = useState(false);
  const toggleMute = useCallback(() => setMuted((v) => !v), []);

  const navPad = insets.bottom + (Platform.OS === "web" ? 84 : 100);
  const thumb = useMemo(() => getThumb(reel.video_id), [reel.video_id]);
  const title = isUsefulReelTitle(reel.title) ? reel.title : "";

  return (
    <View style={{ height: cardHeight, width, backgroundColor: "#000" }}>
      {shouldMountPlayer ? (
        <InAppYouTubePlayer
          videoId={reel.video_id}
          isVisible={isVisible}
          height={cardHeight}
          isMuted={muted}
        />
      ) : (
        <Image
          source={{ uri: thumb }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          fadeDuration={0}
        />
      )}

      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.78)"]}
        locations={[0.55, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Floating mute toggle — top right */}
      {isVisible ? (
        <TouchableOpacity
          onPress={toggleMute}
          activeOpacity={0.75}
          style={[styles.muteFloat, { top: insets.top + 56 }]}
          accessibilityRole="button"
          accessibilityLabel={muted ? "Unmute" : "Mute"}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name={muted ? "volume-x" : "volume-2"} size={18} color="#fff" />
        </TouchableOpacity>
      ) : null}

      {isVisible && <SideActions reel={reel} muted={muted} onToggleMute={toggleMute} />}

      <View style={[styles.reelInfo, { paddingBottom: navPad }]} pointerEvents="none">
        {reel.tag ? (
          <View style={styles.tagBadge}>
            <Text style={styles.tagText}>{reel.tag.toUpperCase()}</Text>
          </View>
        ) : null}
        {title ? (
          <Text style={styles.reelTitle} numberOfLines={2}>
            {title}
          </Text>
        ) : null}
        <View style={styles.channelPill}>
          <Feather name="youtube" size={11} color="rgba(255,255,255,0.7)" />
          <Text style={styles.channelText} numberOfLines={1}>{reel.channel}</Text>
        </View>
      </View>
    </View>
  );
});

// ─── Progress Dots ────────────────────────────────────────────────────────────

const ProgressDots = memo(function ProgressDots({ total, current }: { total: number; current: number }) {
  const visible = Math.min(total, 6);
  const start = Math.max(0, Math.min(current - 2, total - visible));
  return (
    <View style={styles.progressDots} pointerEvents="none">
      {Array.from({ length: visible }).map((_, i) => {
        const idx = start + i;
        const active = idx === current;
        return <View key={idx} style={[styles.dot, active && styles.dotActive]} />;
      })}
    </View>
  );
});

// ─── Channel Filter Bar ───────────────────────────────────────────────────────

const ChannelBar = memo(function ChannelBar({
  selected,
  filters,
  onSelect,
  top,
}: {
  selected: string;
  filters: string[];
  onSelect: (filter: string) => void;
  top: number;
}) {
  return (
    <View style={[styles.channelBar, { top }]}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={filters}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.channelRowFilters}
        renderItem={({ item }) => {
          const active = item === selected;
          return (
            <TouchableOpacity
              onPress={() => onSelect(item)}
              activeOpacity={0.75}
              style={[styles.channelChip, active ? styles.channelChipActive : styles.channelChipIdle]}
            >
              <Text style={[styles.channelChipText, { color: active ? "#fff" : "rgba(255,255,255,0.72)" }]}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
});

// ─── Channel Picker Modal ─────────────────────────────────────────────────────

const ChannelPicker = memo(function ChannelPicker({
  visible,
  channels,
  selected,
  onClose,
  onSelect,
}: {
  visible: boolean;
  channels: string[];
  selected: string;
  onClose: () => void;
  onSelect: (channel: string) => void;
}) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalScrim} onPress={onClose}>
        <Pressable style={styles.channelSheet}>
          <View style={styles.channelSheetHeader}>
            <Text style={styles.channelSheetTitle}>Channels</Text>
            <View style={styles.channelSheetAccent} />
          </View>
          <FlatList
            data={channels}
            keyExtractor={(item) => item}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const active = item === selected;
              return (
                <TouchableOpacity
                  onPress={() => onSelect(item)}
                  activeOpacity={0.75}
                  style={[styles.channelOption, active && styles.channelOptionActive]}
                >
                  {active ? <View style={styles.channelOptionBar} /> : null}
                  <Text style={[styles.channelOptionText, active && styles.channelOptionTextActive]}>
                    {item === ALL_CHANNELS ? "All channels" : item}
                  </Text>
                  {active ? <Feather name="check" size={16} color="#0a9b9a" /> : null}
                </TouchableOpacity>
              );
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ReelsScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedFilter, setFeedFilter] = useState<(typeof REEL_FILTERS)[number]>("All");
  const [contentFilter, setContentFilter] = useState<ContentFilter>("Latest");
  const [channel, setChannel] = useState(ALL_CHANNELS);
  const [channelPickerOpen, setChannelPickerOpen] = useState(false);
  const [followedReporterIds, setFollowedReporterIds] = useState<string[]>([]);
  const [cache, setCache] = useState<ReelsCacheResult>({ reels: [], cachedAt: null });
  const [cacheLoaded, setCacheLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { console.log("[Reels] screen mounted"); }, []);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const HEADER_H = 46;
  const CHIP_BAR_H = 48;
  const CONTENT_BAR_H = 40;
  const channelBarTop = topPad + HEADER_H;
  const contentBarTop = channelBarTop + CHIP_BAR_H;
  const cardHeight = height;

  useEffect(() => {
    let mounted = true;
    getCachedReels().then((result) => {
      if (!mounted) return;
      setCache(result);
      setCacheLoaded(true);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    getFollowedReporterIds().then(setFollowedReporterIds).catch(() => setFollowedReporterIds([]));
  }, []);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["reels"],
    queryFn: async () => {
      console.log("[Reels] queryFn start");
      const t0 = Date.now();
      const reels = await db.fetchReels();
      console.log(`[Reels] fetched ${reels.length} reels in ${Date.now() - t0}ms`);
      if (reels.length > 0) {
        cacheReels(reels).then(() => setCache({ reels, cachedAt: new Date() }));
      }
      return reels;
    },
    enabled: cacheLoaded,
    staleTime: TWELVE_HOURS_MS,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  useEffect(() => {
    if (error) console.warn("[Reels] query error:", error);
  }, [error]);

  const onRefresh = useCallback(async () => {
    console.log("[Reels] pull-to-refresh");
    setRefreshing(true);
    try { await refetch(); } finally { setRefreshing(false); }
  }, [refetch]);

  const sourceData = data !== undefined ? data : cache.reels;
  const portraitData = useMemo(() => sourceData.filter(isPortraitReel), [sourceData]);
  const reporterFilteredData = useMemo(() => {
    if (feedFilter === "Reporters") return portraitData.filter((item) => Boolean(item.reporter_id));
    if (feedFilter === "Following") {
      const followed = new Set(followedReporterIds);
      return portraitData.filter((item) => item.reporter_id && followed.has(item.reporter_id));
    }
    return portraitData;
  }, [feedFilter, followedReporterIds, portraitData]);
  const channels = useMemo(() => {
    const names = Array.from(
      new Set(portraitData.map((item) => item.channel).filter(Boolean))
    );
    return [ALL_CHANNELS, ...names];
  }, [portraitData]);
  const reelFilters = useMemo(() => [...REEL_FILTERS], []);
  const activeChip = channel !== ALL_CHANNELS ? CHANNELS_FILTER : feedFilter;
  const displayData = useMemo(() => {
    if (channel === ALL_CHANNELS) return reporterFilteredData;
    return reporterFilteredData.filter((item) => item.channel === channel);
  }, [channel, reporterFilteredData]);

  useEffect(() => {
    if (channel !== ALL_CHANNELS && !channels.includes(channel)) {
      setChannel(ALL_CHANNELS);
    }
  }, [channel, channels]);

  const handleSelectChannel = useCallback((next: string) => {
    setChannel(next);
    setFeedFilter(next === ALL_CHANNELS ? "All" : CHANNELS_FILTER);
    setChannelPickerOpen(false);
    setCurrentIndex(0);
  }, []);

  const handleSelectFeedFilter = useCallback((next: (typeof REEL_FILTERS)[number]) => {
    if (next === CHANNELS_FILTER) {
      setChannelPickerOpen(true);
      return;
    }
    if (next === "Following") {
      getFollowedReporterIds().then(setFollowedReporterIds).catch(() => setFollowedReporterIds([]));
    }
    setFeedFilter(next);
    setChannel(ALL_CHANNELS);
    setCurrentIndex(0);
  }, []);

  const handleSelectChip = useCallback(
    (next: string) => {
      if ((REEL_FILTERS as readonly string[]).includes(next)) {
        handleSelectFeedFilter(next as (typeof REEL_FILTERS)[number]);
        return;
      }
      setFeedFilter("All");
      handleSelectChannel(next);
    },
    [handleSelectChannel, handleSelectFeedFilter]
  );

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const next = viewableItems[0]?.index;
      if (next != null) setCurrentIndex((prev) => (prev === next ? prev : next));
    },
    []
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 75 });

  const renderItem = useCallback(
    ({ item, index }: { item: Reel; index: number }) => (
      <ReelCard
        reel={item}
        cardHeight={cardHeight}
        width={width}
        insets={insets}
        isVisible={index === currentIndex}
        shouldMountPlayer={Math.abs(index - currentIndex) <= 1}
      />
    ),
    [cardHeight, width, insets, currentIndex]
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<Reel> | null | undefined, index: number) => ({
      length: cardHeight,
      offset: cardHeight * index,
      index,
    }),
    [cardHeight]
  );

  console.log(`[Reels] render — items=${displayData.length} loading=${isLoading} error=${!!error} cache=${cache.reels.length}`);

  if ((!cacheLoaded || isLoading) && sourceData.length === 0) {
    return (
      <View style={[styles.fullCenter, { backgroundColor: "#0a0c10" }]}>
        <View style={styles.statusIconWrap}>
          <Feather name="film" size={26} color="#0a9b9a" />
        </View>
        <Text style={styles.loadingText}>Loading reels…</Text>
      </View>
    );
  }

  if (error && sourceData.length === 0) {
    return (
      <View style={[styles.fullCenter, { backgroundColor: "#0a0c10" }]}>
        <View style={[styles.statusIconWrap, { backgroundColor: "rgba(255,79,135,0.12)" }]}>
          <Feather name="alert-circle" size={26} color="#ff4f87" />
        </View>
        <Text style={styles.errorText}>Couldn't load reels</Text>
        <Text style={styles.loadingText}>Check your connection and try again.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()} activeOpacity={0.8}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.reelsHeader, { paddingTop: topPad, height: topPad + HEADER_H }]}>
        <View style={styles.reelsHeaderInner}>
          <Text style={styles.reelsHeaderTitle}>REELS</Text>
          <View style={styles.reelsHeaderPill}>
            <View style={styles.reelsLiveDot} />
            <Text style={styles.reelsHeaderPillText}>Short News</Text>
          </View>
        </View>
        <View style={styles.reelsHeaderBorder} />
      </View>

      {/* Feed filter chips */}
      <ChannelBar
        selected={activeChip}
        filters={reelFilters}
        onSelect={handleSelectChip}
        top={topPad + HEADER_H}
      />

      {/* (Secondary content type chips removed — too much chrome over the video) */}


      <ChannelPicker
        visible={channelPickerOpen}
        channels={channels}
        selected={channel}
        onClose={() => setChannelPickerOpen(false)}
        onSelect={handleSelectChannel}
      />

      {/* Offline cache banner */}
      {error && cache.reels.length > 0 ? (
        <View style={[styles.cachePill, { top: topPad + HEADER_H + CHIP_BAR_H + CONTENT_BAR_H + 8 }]}>
          <Feather name="wifi-off" size={11} color="#ff9f40" />
          <Text style={styles.cachePillText}>
            Cached{cache.cachedAt ? ` · ${formatCacheAge(cache.cachedAt)}` : ""}
          </Text>
          <TouchableOpacity onPress={() => refetch()} activeOpacity={0.8}>
            <Text style={styles.cacheRetry}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <FlatList
        key={`${feedFilter}-${channel}`}
        data={displayData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        snapToAlignment="start"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig.current}
        getItemLayout={getItemLayout}
        scrollEnabled={displayData.length > 0}
        removeClippedSubviews={false}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={4}
        updateCellsBatchingPeriod={40}
        ListEmptyComponent={
          <View style={[styles.fullCenter, { backgroundColor: "#0a0c10" }]}>
            <View style={styles.statusIconWrap}>
              <Feather name="video-off" size={24} color="rgba(255,255,255,0.3)" />
            </View>
            <Text style={styles.emptyText}>No reels here</Text>
          </View>
        }
      />

      {displayData.length > 1 && (
        <ProgressDots total={displayData.length} current={currentIndex} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  // Header
  reelsHeader: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 21,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "flex-end",
  },
  reelsHeaderInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingBottom: 10,
    gap: 10,
  },
  reelsHeaderTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  reelsHeaderPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(10,155,154,0.18)",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 4,
  },
  reelsLiveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#0a9b9a" },
  reelsHeaderPillText: { color: "#0a9b9a", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  reelsHeaderBorder: { height: 2, backgroundColor: "#0a9b9a", opacity: 0.7 },

  fullCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  statusIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: "rgba(10,155,154,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Filter chips
  channelBar: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  channelRowFilters: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 7,
    flexDirection: "row",
  },
  channelChip: {
    minHeight: 30,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: "center",
  },
  channelChipActive: { backgroundColor: "#0a9b9a", borderColor: "#0a9b9a" },
  channelChipIdle: { backgroundColor: "rgba(18,20,24,0.78)", borderColor: "rgba(255,255,255,0.16)" },
  channelChipText: { fontSize: 12, fontWeight: "800", letterSpacing: 0.2 },

  // Content chips (underline style)
  contentBar: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  contentBarRow: { paddingHorizontal: 14, paddingVertical: 5, gap: 0, flexDirection: "row" },
  contentChipWrap: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
  },
  contentChipText: { fontSize: 12, fontWeight: "700" },
  contentChipUnderline: {
    height: 2,
    width: "100%",
    backgroundColor: "#0a9b9a",
    borderRadius: 1,
    marginTop: 3,
  },

  // Cache pill
  cachePill: {
    position: "absolute",
    left: 14,
    right: 14,
    zIndex: 22,
    backgroundColor: "rgba(10,10,10,0.82)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cachePillText: { flex: 1, color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "600" },
  cacheRetry: { color: "#0a9b9a", fontSize: 12, fontWeight: "800" },

  // Channel picker modal
  modalScrim: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.62)",
    justifyContent: "flex-start",
    paddingTop: 100,
    paddingHorizontal: 16,
  },
  channelSheet: {
    maxHeight: 380,
    borderRadius: 12,
    backgroundColor: "rgba(18,20,24,0.96)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },
  channelSheetHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 0,
  },
  channelSheetTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  channelSheetAccent: {
    height: 2,
    backgroundColor: "#0a9b9a",
    marginBottom: 4,
  },
  channelOption: {
    minHeight: 48,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  channelOptionActive: {
    backgroundColor: "rgba(10,155,154,0.12)",
  },
  channelOptionBar: {
    position: "absolute",
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    backgroundColor: "#0a9b9a",
    borderRadius: 2,
  },
  channelOptionText: {
    flex: 1,
    color: "rgba(255,255,255,0.72)",
    fontSize: 14,
    fontWeight: "700",
    marginRight: 12,
  },
  channelOptionTextActive: { color: "#fff" },

  // Floating mute toggle (top-right of reel)
  muteFloat: {
    position: "absolute",
    right: 14,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.18)",
    zIndex: 25,
  },

  // Side action buttons
  sideActions: {
    position: "absolute",
    right: 14,
    bottom: 200,
    gap: 16,
    alignItems: "center",
    zIndex: 5,
  },
  sideBtn: { alignItems: "center", gap: 5 },
  sideBtnIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  sideBtnIconActive:  { backgroundColor: "rgba(255,79,135,0.20)" },
  sideBtnIconDislike: { backgroundColor: "rgba(255,159,64,0.20)" },
  sideBtnIconMuted:   { backgroundColor: "rgba(255,159,64,0.20)" },
  sideBtnIconPoll:    { backgroundColor: "rgba(10,155,154,0.16)" },
  sideBtnIconFollow:  { backgroundColor: "rgba(10,155,154,0.16)" },
  sideBtnLabel: { color: "rgba(255,255,255,0.75)", fontSize: 10, fontWeight: "700" },

  // Poll modal
  pollScrim: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  pollSheet: {
    backgroundColor: "#0f1117",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: "#0a9b9a",
  },
  pollHandle: {
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignSelf: "center",
    marginBottom: 14,
  },
  pollClose: { alignItems: "center", marginTop: 10 },
  pollCloseText: { color: "#0a9b9a", fontSize: 14, fontWeight: "800" },

  // Reel info overlay
  reelInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 76,
    paddingHorizontal: 18,
    paddingTop: 20,
  },
  tagBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#0a9b9a",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 8,
  },
  tagText: { color: "#fff", fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  reelTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 23,
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  channelPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,0,0,0.40)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 4,
  },
  channelText: { color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: "600" },

  // Progress dots
  progressDots: {
    position: "absolute",
    right: 10,
    top: "50%",
    gap: 4,
    alignItems: "center",
    zIndex: 20,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  dotActive: {
    width: 3,
    height: 18,
    backgroundColor: "#0a9b9a",
    borderRadius: 2,
  },

  // Status screens
  loadingText: { color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: "600" },
  errorText: { color: "#ff4f87", fontSize: 15, fontWeight: "700" },
  retryBtn: {
    backgroundColor: "#0a9b9a",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  retryBtnText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  emptyText: { color: "rgba(255,255,255,0.35)", fontSize: 13, fontWeight: "600" },
});
