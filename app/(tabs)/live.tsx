import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import {
  Dimensions,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { db, type LiveChannel } from "@/lib/supabase";

const SCREEN_W = Dimensions.get("window").width;
const PLAYER_H = Math.round((SCREEN_W * 9) / 16);
const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

function getThumb(videoId: string) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

// ─── Now Playing Card ─────────────────────────────────────────────────────────

const NowPlayingCard = memo(function NowPlayingCard({ channel }: { channel: LiveChannel }) {
  const [playing, setPlaying] = useState(Boolean(channel.video_id));
  const [playerError, setPlayerError] = useState(false);

  useEffect(() => {
    setPlaying(Boolean(channel.video_id));
    setPlayerError(false);
  }, [channel.id, channel.video_id]);

  return (
    <View style={styles.playerCard}>
      <View style={{ height: PLAYER_H, width: SCREEN_W }}>
        {playerError ? (
          <View style={[styles.playerError, { height: PLAYER_H }]}>
            <View style={styles.playerErrorIcon}>
              <Feather name="alert-circle" size={26} color="#ff4f87" />
            </View>
            <Text style={styles.playerErrorTitle}>Stream unavailable</Text>
            <Text style={styles.playerErrorSub}>
              Could not load {channel.channel_name} right now.
            </Text>
            <TouchableOpacity
              style={styles.playerErrorBtn}
              activeOpacity={0.8}
              onPress={() => { setPlayerError(false); setPlaying(true); }}
            >
              <Feather name="refresh-cw" size={13} color="#fff" />
              <Text style={styles.playerErrorBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : playing && channel.video_id ? (
          <YouTubeEmbed
            videoId={channel.video_id}
            height={PLAYER_H}
            autoplay
            onError={() => { setPlayerError(true); setPlaying(false); }}
          />
        ) : (
          <>
            {channel.video_id ? (
              <Image
                source={{ uri: getThumb(channel.video_id) }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
                fadeDuration={0}
              />
            ) : channel.logo_url ? (
              <Image
                source={{ uri: channel.logo_url }}
                style={[StyleSheet.absoluteFill, { resizeMode: "contain", backgroundColor: "#0d0f14" }]}
                fadeDuration={0}
              />
            ) : (
              <View style={[StyleSheet.absoluteFill, styles.playerPlaceholder]}>
                <View style={styles.playerPlaceholderIcon}>
                  <Feather name="tv" size={36} color="#0a9b9a" />
                </View>
              </View>
            )}

            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.65)"]}
              style={styles.playerGradient}
            />

            {channel.is_active && (
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}

            {channel.video_id ? (
              <TouchableOpacity
                style={styles.bigPlayBtn}
                onPress={() => setPlaying(true)}
                activeOpacity={0.85}
              >
                <Feather name="play" size={26} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.watchYtBtn}
                onPress={() => {
                  const url = channel.official_url ?? `https://www.youtube.com/results?search_query=${encodeURIComponent(channel.channel_name + " live")}`;
                  WebBrowser.openBrowserAsync(url);
                }}
                activeOpacity={0.85}
              >
                <Feather name="youtube" size={16} color="#fff" />
                <Text style={styles.watchYtText}>Watch on YouTube</Text>
              </TouchableOpacity>
            )}

            <View style={styles.playerInfo}>
              <Text style={styles.playerChannelName}>{channel.channel_name}</Text>
              {channel.description ? (
                <Text style={styles.playerDesc} numberOfLines={1}>
                  {channel.description}
                </Text>
              ) : null}
            </View>
          </>
        )}
      </View>

      {playing && (
        <TouchableOpacity
          style={styles.watchBar}
          onPress={() => setPlaying(false)}
          activeOpacity={0.85}
        >
          <Feather name="square" size={14} color="#ffffff" />
          <Text style={styles.watchBarText}>Stop</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

// ─── Channel Row ──────────────────────────────────────────────────────────────

const ChannelRow = memo(function ChannelRow({
  channel,
  isActive,
  onPress,
}: {
  channel: LiveChannel;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.channelRow, isActive && styles.channelRowActive]}
    >
      {isActive && <View style={styles.channelActiveBar} />}

      {channel.logo_url ? (
        <Image source={{ uri: channel.logo_url }} style={styles.channelLogo} fadeDuration={0} />
      ) : (
        <View style={styles.channelLogoFallback}>
          <Feather name="tv" size={20} color="#0a9b9a" />
        </View>
      )}

      <View style={styles.channelInfo}>
        <View style={styles.channelNameRow}>
          <Text style={[styles.channelName, isActive && styles.channelNameActive]}>
            {channel.channel_name}
          </Text>
          {channel.is_active ? (
            <View style={styles.liveSmallBadge}>
              <View style={styles.liveSmallDot} />
              <Text style={styles.liveSmallText}>LIVE</Text>
            </View>
          ) : (
            <View style={styles.offlineBadge}>
              <Text style={styles.offlineBadgeText}>Offline</Text>
            </View>
          )}
          {channel.badge ? (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>{channel.badge}</Text>
            </View>
          ) : null}
        </View>
        {channel.description ? (
          <Text style={styles.channelDesc} numberOfLines={1}>
            {channel.description}
          </Text>
        ) : null}
      </View>

      <View style={[styles.selectIndicator, isActive && styles.selectIndicatorActive]} />
    </TouchableOpacity>
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function LiveScreen() {
  const insets = useSafeAreaInsets();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["live-channels"],
    queryFn: db.fetchLiveChannels,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  useEffect(() => {
    if (data && data.length > 0 && !selectedId) {
      const first = data.find((c) => c.is_active) ?? data[0];
      setSelectedId(first.id);
    }
  }, [data]);

  const selectedChannel = data?.find((c) => c.id === selectedId) ?? data?.[0] ?? null;
  const liveCount = useMemo(() => data?.filter((c) => c.is_active).length ?? 0, [data]);
  const filterLabels = useMemo(() => ["All", ...(data ?? []).map((c) => c.channel_name)], [data]);
  const filteredData = useMemo(() => {
    if (!data) return [];
    if (filter === "All") return data;
    return data.filter((channel) => channel.channel_name === filter);
  }, [data, filter]);

  const handleSelectChannel = useCallback((channel: LiveChannel) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setSelectedId(channel.id);
  }, []);

  const handleFilter = useCallback((next: string) => {
    setFilter(next);
    if (next === "All") return;
    const ch = data?.find((item) => item.channel_name === next);
    if (ch) setSelectedId(ch.id);
  }, [data]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = insets.bottom + (Platform.OS === "web" ? 84 : 100);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <View style={styles.statusIconWrap}>
          <Feather name="radio" size={24} color="#0a9b9a" />
        </View>
        <Text style={styles.statusText}>Loading channels…</Text>
      </View>
    );
  }

  if (error || !data?.length) {
    return (
      <View style={styles.center}>
        <View style={[styles.statusIconWrap, { backgroundColor: "rgba(255,255,255,0.10)" }]}>
          <Feather name="tv" size={24} color="rgba(255,255,255,0.40)" />
        </View>
        <Text style={styles.statusText}>
          {error ? "Failed to load channels" : "No channels available"}
        </Text>
        {error && (
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── STICKY TOP: status bar bg + player + section header ── */}
      <View style={styles.stickyTop}>
        <View style={{ height: topPad, backgroundColor: "#0a0c10" }} />
        {selectedChannel ? <NowPlayingCard channel={selectedChannel} /> : null}

        {/* Section header + filter chips */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderTop}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionTitleBar} />
              <Text style={styles.sectionTitle}>ALL CHANNELS</Text>
            </View>
            {liveCount > 0 ? (
              <View style={styles.livePill}>
                <View style={styles.livePillDot} />
                <Text style={styles.livePillText}>{liveCount} Active</Text>
              </View>
            ) : null}
          </View>

          <FlatList
            horizontal
            data={filterLabels}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
            renderItem={({ item }) => {
              const active = item === filter;
              return (
                <TouchableOpacity
                  onPress={() => handleFilter(item)}
                  activeOpacity={0.75}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>

      {/* ── SCROLLABLE CHANNEL LIST ── */}
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPad }}
        renderItem={({ item }) => (
          <ChannelRow
            channel={item}
            isActive={item.id === selectedId}
            onPress={() => handleSelectChannel(item)}
          />
        )}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews={Platform.OS === "android"}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050a0f" },
  stickyTop: { backgroundColor: "#050a0f" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, backgroundColor: "#050a0f" },

  // Status screens
  statusIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: "rgba(10,155,154,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: { fontSize: 14, fontWeight: "600", color: "rgba(255,255,255,0.55)" },
  retryBtn: {
    backgroundColor: "#0a9b9a",
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 8,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  retryBtnText: { color: "#fff", fontSize: 13, fontWeight: "800" },

  // Player
  playerCard: { backgroundColor: "#0a0c10", overflow: "hidden" },
  playerError: {
    backgroundColor: "#0a0c10",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 24,
  },
  playerErrorIcon: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "rgba(255,79,135,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  playerErrorTitle: { color: "#fff", fontSize: 15, fontWeight: "800" },
  playerErrorSub: { color: "rgba(255,255,255,0.50)", fontSize: 13, textAlign: "center" },
  playerErrorBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0a9b9a",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minHeight: 44,
    marginTop: 4,
  },
  playerErrorBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  playerPlaceholder: {
    backgroundColor: "#0d0f14",
    alignItems: "center",
    justifyContent: "center",
  },
  playerPlaceholderIcon: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: "rgba(10,155,154,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  playerGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "55%",
  },
  liveBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#ff4f87",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" },
  liveText: { color: "#fff", fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  bigPlayBtn: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -30 }, { translateY: -30 }],
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.35)",
  },
  watchYtBtn: {
    position: "absolute",
    alignSelf: "center",
    bottom: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#cc0000",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    minHeight: 44,
  },
  watchYtText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  playerInfo: { position: "absolute", bottom: 12, left: 14, right: 14 },
  playerChannelName: { color: "#fff", fontSize: 15, fontWeight: "800" },
  playerDesc: { color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 2 },
  watchBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    backgroundColor: "#0f1723",
    borderBottomWidth: 2,
    borderBottomColor: "#0a9b9a",
  },
  watchBarText: { color: "#ffffff", fontSize: 13, fontWeight: "800" },

  // Section header
  sectionHeader: {
    backgroundColor: "#0d1320",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 3,
    borderBottomColor: "#0a9b9a",
  },
  sectionHeaderTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitleBar: { width: 3, height: 14, borderRadius: 2, backgroundColor: "#0a9b9a" },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: "rgba(255,255,255,0.55)",
    letterSpacing: 1.5,
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,79,135,0.10)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  livePillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#ff4f87" },
  livePillText: { color: "#ff4f87", fontSize: 11, fontWeight: "800" },
  filterRow: { gap: 7, flexDirection: "row" },
  filterChip: {
    minHeight: 34,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(18,20,24,0.78)",
    borderColor: "rgba(255,255,255,0.16)",
  },
  filterChipActive: { backgroundColor: "#0a9b9a", borderColor: "#0a9b9a" },
  filterChipText: { fontSize: 12, fontWeight: "800", color: "rgba(255,255,255,0.60)" },
  filterChipTextActive: { color: "#fff" },

  // Channel rows
  channelRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    backgroundColor: "#0d1320",
    overflow: "hidden",
  },
  channelRowActive: { backgroundColor: "rgba(10,155,154,0.12)" },
  channelActiveBar: {
    position: "absolute",
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    backgroundColor: "#0a9b9a",
    borderRadius: 2,
  },
  channelLogo: { width: 48, height: 48, borderRadius: 10, resizeMode: "contain" },
  channelLogoFallback: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "rgba(10,155,154,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  channelInfo: { flex: 1 },
  channelNameRow: { flexDirection: "row", alignItems: "center", gap: 7, flexWrap: "wrap" },
  channelName: { fontSize: 14, fontWeight: "700", color: "#ffffff" },
  channelNameActive: { color: "#0a9b9a" },
  liveSmallBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ff4f87",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  liveSmallDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#fff" },
  liveSmallText: { color: "#fff", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  offlineBadge: {
    backgroundColor: "rgba(255,255,255,0.10)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  offlineBadgeText: { color: "rgba(255,255,255,0.45)", fontSize: 9, fontWeight: "700" },
  featuredBadge: {
    backgroundColor: "rgba(10,155,154,0.12)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  featuredBadgeText: { color: "#0a9b9a", fontSize: 9, fontWeight: "800" },
  channelDesc: { fontSize: 12, marginTop: 3, color: "rgba(255,255,255,0.45)", fontWeight: "500" },
  selectIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  selectIndicatorActive: { backgroundColor: "#0a9b9a" },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.07)",
    marginLeft: 76,
  },
});
