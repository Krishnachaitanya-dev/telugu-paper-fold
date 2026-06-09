import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { memo, useCallback } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { FactCheckBadge } from "./FactCheckBadge";
import { getNewsCategory } from "@/lib/newsCategories";
import type { NewsUpdate } from "@/lib/supabase";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  item: NewsUpdate;
  shouldLoadImage: boolean;
  height?: number;
  renderActions?: (item: NewsUpdate) => React.ReactNode;
}

// ─── Category colour map ───────────────────────────────────────────────────────

const CAT_COLORS: Record<string, string> = {
  Politics:      "#1E40AF",
  Sports:        "#047857",
  Technology:    "#6D28D9",
  Entertainment: "#BE185D",
  Business:      "#B45309",
  Crime:         "#B91C1C",
  Health:        "#0E7490",
  Education:     "#0369A1",
  Science:       "#065F46",
  Travel:        "#0891B2",
};

function catAccent(cat: string): string {
  return CAT_COLORS[cat] ?? "#0a9b9a";
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.max(0, Math.floor(d / 60000));
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function srcInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

// ─── Preprocessed summary ─────────────────────────────────────────────────────

function getPreprocessedSummary(raw: string | null): string {
  return raw?.trim() ?? "";
}

// ─── Card ──────────────────────────────────────────────────────────────────────

const IMAGE_H_DEFAULT = 218;

function AnimatedNewsCardBase({ item, shouldLoadImage, height, renderActions }: Props) {
  const router = useRouter();
  const category = getNewsCategory(item);
  const accent   = catAccent(category);
  const time     = item.created_at ? timeAgo(item.created_at) : "";
  const summaryText = getPreprocessedSummary(item.description);

  const IMAGE_H = height ? Math.round(height * 0.50) : IMAGE_H_DEFAULT;

  const handlePress = useCallback(() => {
    router.push(`/news/${item.id}` as never);
  }, [item.id, router]);

  const hasImage = Boolean(item.image_url && shouldLoadImage);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.card, height ? { height } : undefined, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={item.title}
    >
      {/* ── IMAGE ZONE ────────────────────────────────────────── */}
      <View style={[styles.imageZone, { height: IMAGE_H }]}>
        {hasImage ? (
          <Image
            source={{ uri: item.image_url! }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            fadeDuration={150}
            progressiveRenderingEnabled
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.noImage]}>
            <View style={styles.noImageIcon}>
              <Feather name="image" size={28} color="rgba(255,255,255,0.25)" />
            </View>
          </View>
        )}

        {/* Bottom gradient scrim */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.42)"]}
          locations={[0.35, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* Category badge — bottom-left */}
        <View style={[styles.catBadge, { backgroundColor: accent }]}>
          <Text style={styles.catText}>{category.toUpperCase()}</Text>
        </View>

        {/* Time — bottom-right */}
        {time ? (
          <View style={styles.timeBadge}>
            <Feather name="clock" size={9} color="rgba(255,255,255,0.85)" />
            <Text style={styles.timeText}>{time}</Text>
          </View>
        ) : null}
      </View>

      {/* ── CONTENT ZONE ──────────────────────────────────────── */}
      <View style={[styles.content, height ? styles.contentFlex : undefined]}>
        {/* Upper content — flex:1 pins actions to bottom */}
        <View style={{ flex: 1 }}>
          {/* Metadata line */}
          <View style={styles.metaRow}>
            <View style={[styles.metaDot, { backgroundColor: accent }]} />
            <Text style={[styles.metaCategory, { color: accent }]}>
              {category.toUpperCase()}
            </Text>
            {time ? <Text style={styles.metaTime}> · {time}</Text> : null}
          </View>

          {/* Headline */}
          <Text style={styles.headline} numberOfLines={3}>
            {item.title}
          </Text>

          {/* Summary is preprocessed by the Supabase ingest function. */}
          {summaryText ? (
            <Text style={styles.summary} numberOfLines={5}>
              {summaryText}
            </Text>
          ) : null}

          {/* Fact check badge */}
          {item.fact_check_status ? (
            <View style={styles.factWrap}>
              <FactCheckBadge status={item.fact_check_status} />
            </View>
          ) : null}

          {/* Source row */}
          <View style={styles.sourceRow}>
            {item.source_name ? (
              <>
                <View style={styles.sourceAvatarWrap}>
                  {item.reporter_avatar_url ? (
                    <Image
                      source={{ uri: item.reporter_avatar_url }}
                      style={styles.sourceAvatar}
                    />
                  ) : (
                    <View style={[styles.sourceAvatar, { backgroundColor: accent + "20" }]}>
                      <Text style={[styles.sourceAvatarText, { color: accent }]}>
                        {srcInitials(item.source_name)}
                      </Text>
                    </View>
                  )}
                  {item.fact_check_status === "verified" && (
                    <View style={styles.verifiedBadge}>
                      <Feather name="check" size={8} color="#fff" />
                    </View>
                  )}
                </View>
                <Text style={styles.sourceName} numberOfLines={1}>
                  {item.source_name}
                </Text>
              </>
            ) : (
              <View style={[styles.sourceAvatar, { backgroundColor: "rgba(255,255,255,0.08)" }]}>
                <Feather name="globe" size={12} color="rgba(255,255,255,0.40)" />
              </View>
            )}
            <View style={styles.sourceSpacer} />
            {time ? (
              <Text style={styles.sourceTime}>{time}</Text>
            ) : null}
          </View>
        </View>

        {/* Actions — always pinned to bottom */}
        {renderActions ? (
          <>
            <View style={styles.actionDivider} />
            <View style={styles.actionsZone}>
              {renderActions(item)}
            </View>
          </>
        ) : null}
      </View>

      {/* Bottom card border */}
      <View style={styles.cardFooter} />
    </Pressable>
  );
}

export const AnimatedNewsCard = memo(AnimatedNewsCardBase);

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#111820",
    borderBottomWidth: 8,
    borderBottomColor: "#0d1320",
  },
  cardPressed: { opacity: 0.94 },

  // Image
  imageZone: {
    width: "100%",
    backgroundColor: "#1a2035",
    overflow: "hidden",
  },
  noImage: {
    backgroundColor: "#1a2035",
    alignItems: "center",
    justifyContent: "center",
  },
  noImageIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },

  catBadge: {
    position: "absolute",
    bottom: 14,
    left: 16,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 4,
  },
  catText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  timeBadge: {
    position: "absolute",
    bottom: 14,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  timeText: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 10,
    fontWeight: "600",
  },

  // Content
  content: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 4,
  },
  contentFlex: { flex: 1 },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 9,
  },
  metaDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 6,
  },
  metaCategory: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  metaTime: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.48)",
    letterSpacing: 0.2,
  },

  headline: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ffffff",
    lineHeight: 27,
    letterSpacing: -0.3,
    marginBottom: 10,
  },

  summary: {
    fontSize: 13.5,
    lineHeight: 20,
    color: "rgba(255,255,255,0.70)",
    fontWeight: "400",
    marginBottom: 14,
  },

  factWrap: { marginBottom: 12 },

  // Source row
  sourceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    marginBottom: 14,
  },
  sourceAvatarWrap: {
    position: "relative",
    width: 28,
    height: 28,
    marginRight: 0,
  },
  sourceAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  sourceAvatarText: {
    fontSize: 10,
    fontWeight: "900",
  },
  verifiedBadge: {
    position: "absolute",
    right: -3,
    bottom: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#1d9bf0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#111820",
  },
  sourceName: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.65)",
  },
  sourceSpacer: { flex: 1 },
  sourceTime: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.40)",
  },

  actionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.09)",
    marginBottom: 2,
  },
  actionsZone: {},

  cardFooter: {},
});
