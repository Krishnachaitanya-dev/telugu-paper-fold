import { Feather } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

export default function SavedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <>
      <Stack.Screen options={{ title: "Saved Articles" }} />
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 84 : 40),
          },
        ]}
      >
        {/* Empty state */}
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.primarySoft }]}>
            <Feather name="bookmark" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            No Saved Articles
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Bookmark articles from the News feed to read them later, even without internet.
          </Text>
          <TouchableOpacity
            style={[styles.browseBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
          >
            <Text style={[styles.browseBtnText, { color: "#fff" }]}>Browse News</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 16,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 20, fontWeight: "800", textAlign: "center" },
  emptyText: { fontSize: 14, lineHeight: 21, textAlign: "center" },
  browseBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  browseBtnText: { fontSize: 15, fontWeight: "700" },
});
