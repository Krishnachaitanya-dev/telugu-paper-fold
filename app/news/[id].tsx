import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { db } from "@/lib/supabase";

export default function NewsDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["news-detail", id],
    queryFn: () => db.fetchNewsById(id),
    enabled: Boolean(id),
    staleTime: 12 * 60 * 60 * 1000,
  });

  return (
    <>
      <Stack.Screen options={{ title: "News" }} />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === "web" ? 84 : 30) }}
      >
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : !data ? (
          <View style={styles.center}>
            <Feather name="file-text" size={30} color={colors.mutedForeground} />
            <Text style={[styles.empty, { color: colors.mutedForeground }]}>News not found</Text>
            <TouchableOpacity onPress={() => refetch()} style={[styles.openBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.openBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {data.image_url ? (
              <Image source={{ uri: data.image_url }} style={styles.hero} resizeMode="cover" />
            ) : (
              <View style={[styles.hero, styles.heroFallback, { backgroundColor: colors.primarySoft }]}>
                <Feather name="file-text" size={44} color={colors.primary} />
              </View>
            )}
            <View style={styles.body}>
              <View style={styles.metaRow}>
                <Text style={[styles.category, { color: colors.primary }]}>{data.category}</Text>
                <Text style={[styles.source, { color: colors.mutedForeground }]}>
                  {data.reporter_name ?? data.source_name ?? "Telugu News"}
                </Text>
              </View>
              <Text style={[styles.title, { color: colors.foreground }]}>{data.title}</Text>
              {data.description ? (
                <Text style={[styles.description, { color: colors.foreground }]}>{data.description}</Text>
              ) : null}
              {data.source_url ? (
                <TouchableOpacity
                  onPress={() => WebBrowser.openBrowserAsync(data.source_url!).catch(() => {})}
                  style={[styles.openBtn, { backgroundColor: colors.primary }]}
                >
                  <Feather name="external-link" size={16} color="#fff" />
                  <Text style={styles.openBtnText}>Open Source</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { minHeight: 320, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  empty: { fontSize: 14, fontWeight: "700" },
  hero: { width: "100%", aspectRatio: 1.18 },
  heroFallback: { alignItems: "center", justifyContent: "center" },
  body: { padding: 18, gap: 12 },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  category: { fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  source: { flex: 1, textAlign: "right", fontSize: 12, fontWeight: "700" },
  title: { fontSize: 28, lineHeight: 36, fontWeight: "900" },
  description: { fontSize: 18, lineHeight: 30, fontWeight: "500" },
  openBtn: {
    alignSelf: "flex-start",
    minHeight: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 6,
  },
  openBtnText: { color: "#fff", fontSize: 14, fontWeight: "800" },
});
