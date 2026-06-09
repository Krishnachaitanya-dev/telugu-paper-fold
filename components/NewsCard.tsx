import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import React, { memo, useCallback } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";

import { type NewsUpdate } from "@/lib/supabase";
import { useColors } from "@/hooks/useColors";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface Props {
  item: NewsUpdate;
  featured?: boolean;
}

function NewsCardBase({ item, featured = false }: Props) {
  const colors = useColors();

  const handlePress = useCallback(async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    if (item.source_url) {
      await WebBrowser.openBrowserAsync(item.source_url);
    }
  }, [item.source_url]);

  if (featured) {
    return (
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={handlePress}
        style={[styles.featuredCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.featuredImage} fadeDuration={0} />
        ) : (
          <View style={[styles.featuredImage, { backgroundColor: colors.primarySoft }]} />
        )}
        <View style={styles.featuredOverlay}>
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.badgeText, { color: colors.primaryForeground }]}>
              {item.category}
            </Text>
          </View>
          <Text style={styles.featuredTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[styles.featuredMeta, { color: "rgba(255,255,255,0.7)" }]}>
            {item.source_name} · {timeAgo(item.created_at)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={handlePress}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.thumbnail} fadeDuration={0} />
      ) : (
        <View style={[styles.thumbnail, { backgroundColor: colors.primarySoft }]} />
      )}
      <View style={styles.body}>
        <View style={[styles.catBadge, { backgroundColor: colors.primarySoft }]}>
          <Text style={[styles.catText, { color: colors.primary }]}>{item.category}</Text>
        </View>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
          {item.title}
        </Text>
        {item.description ? (
          <Text style={[styles.desc, { color: colors.mutedForeground }]} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
        <View style={styles.meta}>
          {item.source_name ? (
            <Text style={[styles.source, { color: colors.primary }]}>{item.source_name}</Text>
          ) : null}
          <Text style={[styles.time, { color: colors.mutedForeground }]}>
            {timeAgo(item.created_at)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  thumbnail: {
    width: "100%",
    height: 180,
    resizeMode: "cover",
  },
  body: { padding: 14 },
  catBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    marginBottom: 8,
  },
  catText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
  title: { fontSize: 15, fontWeight: "700", lineHeight: 21 },
  desc: { fontSize: 13, lineHeight: 18, marginTop: 4 },
  meta: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  source: { fontSize: 12, fontWeight: "600" },
  time: { fontSize: 12 },

  featuredCard: {
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 14,
    height: 240,
    overflow: "hidden",
    borderWidth: 1,
  },
  featuredImage: { width: "100%", height: "100%", resizeMode: "cover" },
  featuredOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    paddingTop: 40,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    marginBottom: 8,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },
  featuredTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 23,
  },
  featuredMeta: { fontSize: 12, marginTop: 6 },
});

export const NewsCard = memo(NewsCardBase);
