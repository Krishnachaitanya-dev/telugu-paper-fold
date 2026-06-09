/**
 * SpeedNewsCard — Instagram-Stories-style news cards.
 * Swipe left/right or tap sides to navigate. Tap bottom CTA to read full article.
 */
import * as WebBrowser from "expo-web-browser";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface SpeedNewsItem {
  id: string;
  title: string;
  summary?: string;
  source?: string;
  category?: string;
  url?: string;
  timeAgo?: string;
  imageUrl?: string;
}

interface Props {
  items: SpeedNewsItem[];
  onClose?: () => void;
}

const { width: W, height: H } = Dimensions.get("window");
const SWIPE_THRESHOLD = W * 0.28;

// Gradient palette per category
const CAT_GRADIENTS: Record<string, [string, string, string]> = {
  politics:  ["#1a0a2e", "#2d1b5e", "#1a0a2e"],
  movies:    ["#1a0814", "#3d0a2e", "#1a0814"],
  sports:    ["#0a1a14", "#0a3d2e", "#0a1a14"],
  jobs:      ["#0a140a", "#1a3d0a", "#0a140a"],
  districts: ["#14140a", "#3d3d0a", "#14140a"],
  default:   ["#0b0f14", "#131b24", "#0b0f14"],
};

function getGradient(category?: string): [string, string, string] {
  const key = (category ?? "").toLowerCase();
  return CAT_GRADIENTS[key] ?? CAT_GRADIENTS.default;
}

function SpeedNewsStack({ items, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;

  const current = items[index];
  const done = index >= items.length;
  const AUTO_DURATION = 8000;

  // Auto-advance timer
  useEffect(() => {
    if (done || paused) return;
    progress.setValue(0);
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: AUTO_DURATION,
      useNativeDriver: false,
    });
    anim.start(({ finished }) => {
      if (finished) goNext();
    });
    return () => anim.stop();
  }, [index, paused, done]);

  const goNext = useCallback(() => {
    Animated.sequence([
      Animated.timing(cardOpacity, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    setIndex((i) => i + 1);
    translateX.setValue(0);
  }, [cardOpacity, translateX]);

  const goPrev = useCallback(() => {
    if (index === 0) return;
    Animated.sequence([
      Animated.timing(cardOpacity, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    setIndex((i) => Math.max(0, i - 1));
    translateX.setValue(0);
  }, [cardOpacity, index, translateX]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > Math.abs(g.dy) * 1.2,
      onPanResponderGrant: () => setPaused(true),
      onPanResponderMove: (_, g) => translateX.setValue(g.dx),
      onPanResponderRelease: (_, g) => {
        setPaused(false);
        if (g.dx < -SWIPE_THRESHOLD) goNext();
        else if (g.dx > SWIPE_THRESHOLD) goPrev();
        else Animated.spring(translateX, { toValue: 0, useNativeDriver: true, tension: 120, friction: 8 }).start();
      },
      onPanResponderTerminate: () => { setPaused(false); translateX.setValue(0); },
    })
  ).current;

  const handleShare = useCallback(() => {
    if (!current) return;
    Share.share({ message: `${current.title}\n${current.url ?? ""}`, title: current.title });
  }, [current]);

  const handleOpen = useCallback(() => {
    if (current?.url) WebBrowser.openBrowserAsync(current.url);
  }, [current]);

  if (done) {
    return (
      <View style={[styles.done, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.doneIconWrap}>
          <Feather name="check-circle" size={52} color="#0a9b9a" />
        </View>
        <Text style={styles.doneTitle}>All caught up!</Text>
        <Text style={styles.doneSub}>You've read all speed news for now.</Text>
        <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.85}>
          <Text style={styles.doneBtnText}>Back to feed</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const grad = getGradient(current.category);
  const barW = progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  return (
    <View style={styles.root} {...panResponder.panHandlers}>
      {/* Solid dark bg */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "#080b10" }]} />

      {/* Top half — full image, no crop */}
      {current.imageUrl ? (
        <View style={styles.imageFrame}>
          <Image
            source={{ uri: current.imageUrl }}
            style={styles.fullImage}
            resizeMode="contain"
          />
          {/* Subtle bottom fade so image blends into content */}
          <LinearGradient
            colors={["transparent", "rgba(8,11,16,0.85)"]}
            locations={[0.6, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        </View>
      ) : (
        /* No image — gradient background fills full screen */
        <LinearGradient colors={grad} style={StyleSheet.absoluteFill} />
      )}

      {/* ── TOP BAR ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        {/* Progress bars */}
        <View style={styles.progressBars}>
          {items.map((_, i) => (
            <View key={i} style={styles.progressTrack}>
              {i < index ? (
                <View style={[styles.progressFill, { width: "100%", backgroundColor: "#fff" }]} />
              ) : i === index ? (
                <Animated.View style={[styles.progressFill, { width: barW as any, backgroundColor: "#0a9b9a" }]} />
              ) : null}
            </View>
          ))}
        </View>

        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.headerBrand}>
            <Feather name="zap" size={14} color="#0a9b9a" />
            <Text style={styles.headerBrandText}>Speed News</Text>
          </View>
          <Text style={styles.headerCounter}>{index + 1}/{items.length}</Text>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="x" size={20} color="rgba(255,255,255,0.85)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── TAP ZONES (left = prev, right = next) ── */}
      <View style={styles.tapZones} pointerEvents="box-none">
        <TouchableWithoutFeedback onPress={goPrev}>
          <View style={styles.tapLeft} />
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={goNext}>
          <View style={styles.tapRight} />
        </TouchableWithoutFeedback>
      </View>

      {/* ── CONTENT ── */}
      <Animated.View
        style={[styles.content, { paddingBottom: insets.bottom + 24, opacity: cardOpacity }]}
        pointerEvents="box-none"
      >
        {/* Category + time */}
        <View style={styles.metaRow}>
          {current.category ? (
            <View style={styles.catBadge}>
              <Text style={styles.catText}>{current.category.toUpperCase()}</Text>
            </View>
          ) : null}
          {current.timeAgo ? (
            <View style={styles.timeBadge}>
              <Feather name="clock" size={10} color="rgba(255,255,255,0.6)" />
              <Text style={styles.timeText}>{current.timeAgo}</Text>
            </View>
          ) : null}
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={4}>{current.title}</Text>

        {/* Summary */}
        {current.summary ? (
          <Text style={styles.summary} numberOfLines={3}>{current.summary}</Text>
        ) : null}

        {/* Source */}
        {current.source ? (
          <View style={styles.sourceRow}>
            <View style={styles.sourceDot} />
            <Text style={styles.sourceText}>{current.source}</Text>
          </View>
        ) : null}

        {/* Actions */}
        <View style={styles.actions}>
          {current.url ? (
            <TouchableOpacity onPress={handleOpen} style={styles.readBtn} activeOpacity={0.88}>
              <Text style={styles.readBtnText}>Read full article</Text>
              <Feather name="arrow-right" size={15} color="#fff" />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity onPress={handleShare} style={styles.shareBtn} activeOpacity={0.8}>
            <Feather name="share-2" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Swipe hint — only first card */}
        {index === 0 ? (
          <Text style={styles.swipeHint}>← Swipe to navigate →</Text>
        ) : null}
      </Animated.View>
    </View>
  );
}

export const SpeedNewsCard = memo(SpeedNewsStack);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#080b10" },
  imageFrame: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: H * 0.52,
    backgroundColor: "#080b10",
    overflow: "hidden",
  },
  fullImage: {
    width: W,
    height: H * 0.52,
    backgroundColor: "#080b10",
  },

  // Top bar
  topBar: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 20, paddingHorizontal: 14, gap: 10 },
  progressBars: { flexDirection: "row", gap: 4 },
  progressTrack: {
    flex: 1,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 2 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingBottom: 6 },
  headerBrand: { flexDirection: "row", alignItems: "center", gap: 5, flex: 1 },
  headerBrandText: { color: "#fff", fontSize: 13, fontWeight: "800", letterSpacing: 0.3 },
  headerCounter: { color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: "700" },
  closeBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },

  // Tap zones
  tapZones: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, flexDirection: "row" },
  tapLeft: { width: "30%", height: "100%" },
  tapRight: { width: "70%", height: "100%" },

  // Content — sits in bottom 48% so image above is never obscured
  content: {
    position: "absolute",
    top: H * 0.48,
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 22,
    paddingTop: 16,
    gap: 10,
    backgroundColor: "#080b10",
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  catBadge: {
    backgroundColor: "#c7292f",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 5,
  },
  catText: { color: "#fff", fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  timeBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  timeText: { color: "rgba(255,255,255,0.6)", fontSize: 11 },

  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 33,
    letterSpacing: -0.3,
  },
  summary: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 14,
    lineHeight: 21,
  },
  sourceRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  sourceDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#0a9b9a" },
  sourceText: { color: "#0a9b9a", fontSize: 12, fontWeight: "800" },

  actions: { flexDirection: "row", gap: 10, alignItems: "center", paddingTop: 4 },
  readBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "#0a9b9a",
    borderRadius: 14,
    paddingVertical: 13,
    minHeight: 48,
    shadowColor: "#0a9b9a",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  readBtnText: { color: "#fff", fontSize: 15, fontWeight: "900" },
  shareBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  swipeHint: {
    textAlign: "center",
    color: "rgba(255,255,255,0.3)",
    fontSize: 11,
    letterSpacing: 0.3,
    marginTop: 4,
  },

  // Done screen
  done: { flex: 1, backgroundColor: "#0b0f14", alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 32 },
  doneIconWrap: { width: 96, height: 96, borderRadius: 48, backgroundColor: "rgba(10,155,154,0.12)", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  doneTitle: { color: "#fff", fontSize: 26, fontWeight: "900" },
  doneSub: { color: "rgba(255,255,255,0.5)", fontSize: 14, textAlign: "center", lineHeight: 21 },
  doneBtn: { marginTop: 8, backgroundColor: "#0a9b9a", paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14, minHeight: 48 },
  doneBtnText: { color: "#fff", fontSize: 15, fontWeight: "900" },
});
