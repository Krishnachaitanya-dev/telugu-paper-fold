import { Feather } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

// TODO: replace with real history data from backend/AsyncStorage
interface HistoryItem {
  id: string;
  kind: "article" | "reel";
  title: string;
  source?: string;
  viewedAt: string;
}

function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const MOCK_HISTORY: HistoryItem[] = [
  { id: "1", kind: "article", title: "ఆంధ్రప్రదేశ్ లో కొత్త పథకాలు ప్రకటన", source: "Sakshi TV", viewedAt: new Date(Date.now() - 3600000).toISOString() },
  { id: "2", kind: "reel", title: "10TV Short: రాజకీయ వివాదాలు", source: "10TV News", viewedAt: new Date(Date.now() - 7200000).toISOString() },
  { id: "3", kind: "article", title: "Hyderabad Traffic Update: నగరంలో జాము సమస్యలు", source: "NTV Telugu", viewedAt: new Date(Date.now() - 86400000).toISOString() },
  { id: "4", kind: "reel", title: "V6 Short: క్రికెట్ అప్‌డేట్", source: "V6 News Telugu", viewedAt: new Date(Date.now() - 172800000).toISOString() },
];

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<HistoryItem[]>(MOCK_HISTORY);

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleClearAll = () => {
    Alert.alert(
      "Clear all history",
      "This will remove all watched and read items. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear all",
          style: "destructive",
          onPress: () => setItems([]),
        },
      ]
    );
  };

  const bottomPad = insets.bottom + (Platform.OS === "web" ? 84 : 40);

  return (
    <>
      <Stack.Screen
        options={{
          title: "History",
          headerRight: () =>
            items.length > 0 ? (
              <TouchableOpacity onPress={handleClearAll} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={{ color: colors.destructive, fontSize: 13, fontWeight: "700", marginRight: 4 }}>
                  Clear all
                </Text>
              </TouchableOpacity>
            ) : null,
        }}
      />
      <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: bottomPad }]}>
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.accentSoft }]}>
              <Feather name="clock" size={32} color={colors.accent} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No history yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Articles and reels you read or watch will appear here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 12, paddingHorizontal: 16, gap: 10 }}
            renderItem={({ item }) => (
              <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.kindIcon, { backgroundColor: item.kind === "reel" ? colors.accentSoft : colors.primarySoft }]}>
                  <Feather
                    name={item.kind === "reel" ? "film" : "file-text"}
                    size={16}
                    color={item.kind === "reel" ? colors.accent : colors.primary}
                  />
                </View>
                <View style={styles.rowInfo}>
                  <Text style={[styles.rowTitle, { color: colors.foreground }]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={[styles.rowMeta, { color: colors.mutedForeground }]}>
                    {item.source ? `${item.source} · ` : ""}{timeAgo(item.viewedAt)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(item.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.deleteBtn}
                >
                  <Feather name="x" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            )}
          />
        )}
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  kindIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowInfo: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: "600", lineHeight: 20 },
  rowMeta: { fontSize: 11, marginTop: 3 },
  deleteBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
