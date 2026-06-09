import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const FONT_SIZE_KEY = "pref_font_size";

type FontSize = "Small" | "Default" | "Large";
const FONT_SIZES: FontSize[] = ["Small", "Default", "Large"];
const FONT_SIZE_VALUES: Record<FontSize, number> = { Small: 13, Default: 15, Large: 17 };

export default function DisplayScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [fontSize, setFontSize] = useState<FontSize>("Default");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(FONT_SIZE_KEY).then((v) => {
      if (v && FONT_SIZES.includes(v as FontSize)) setFontSize(v as FontSize);
    });
  }, []);

  const handleSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await AsyncStorage.setItem(FONT_SIZE_KEY, fontSize);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    Alert.alert("Reset display settings", "Restore all display settings to default?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: async () => {
          setFontSize("Default");
          await AsyncStorage.removeItem(FONT_SIZE_KEY);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ title: "Display & Font" }} />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === "web" ? 84 : 40), paddingTop: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Theme — dark only for now */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>THEME</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.row, { borderBottomColor: colors.border }]}>
              <View style={[styles.rowIcon, { backgroundColor: colors.primarySoft }]}>
                <Feather name="moon" size={16} color={colors.primary} />
              </View>
              <View style={styles.rowInfo}>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>Dark mode</Text>
                <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>Always on — light mode coming soon</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>On</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Font size */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>FONT SIZE</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {FONT_SIZES.map((size, i) => {
              const active = size === fontSize;
              return (
                <TouchableOpacity
                  key={size}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFontSize(size); }}
                  activeOpacity={0.75}
                  style={[
                    styles.row,
                    { borderBottomColor: colors.border },
                    i === FONT_SIZES.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={[styles.rowIcon, { backgroundColor: active ? colors.primarySoft : colors.muted }]}>
                    <Text style={{ fontSize: 13 + i * 2, fontWeight: "700", color: active ? colors.primary : colors.mutedForeground }}>
                      A
                    </Text>
                  </View>
                  <View style={styles.rowInfo}>
                    <Text style={[styles.rowLabel, { color: active ? colors.primary : colors.foreground, fontSize: FONT_SIZE_VALUES[size] }]}>
                      {size}
                    </Text>
                    <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                      {FONT_SIZE_VALUES[size]}pt · {size === "Small" ? "Compact" : size === "Large" ? "Easy reading" : "Recommended"}
                    </Text>
                  </View>
                  {active ? <Feather name="check" size={18} color={colors.primary} /> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Preview */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PREVIEW</Text>
          <View style={[styles.previewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.previewHeadline, { color: colors.foreground, fontSize: FONT_SIZE_VALUES[fontSize] + 6 }]}>
              ఆంధ్రప్రదేశ్ లో కొత్త పథకాలు
            </Text>
            <Text style={[styles.previewBody, { color: colors.mutedForeground, fontSize: FONT_SIZE_VALUES[fontSize] }]}>
              రాష్ట్ర ప్రభుత్వం అనేక కొత్త సంక్షేమ పథకాలు ప్రకటించింది.
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: saved ? "#22c55e" : colors.primary }]}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            <Feather name={saved ? "check" : "save"} size={18} color="#fff" />
            <Text style={styles.saveBtnText}>{saved ? "Saved!" : "Save"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.resetBtn, { borderColor: colors.border }]}
            onPress={handleReset}
            activeOpacity={0.75}
          >
            <Feather name="refresh-ccw" size={16} color={colors.mutedForeground} />
            <Text style={[styles.resetBtnText, { color: colors.mutedForeground }]}>Reset</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { marginHorizontal: 16, marginBottom: 24 },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 10 },
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  rowIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: "600" },
  rowSub: { fontSize: 12, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  previewCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 8 },
  previewHeadline: { fontWeight: "800", lineHeight: 26 },
  previewBody: { lineHeight: 22 },
  btnRow: { flexDirection: "row", marginHorizontal: 16, gap: 10, marginBottom: 16 },
  saveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
    borderWidth: 1,
  },
  resetBtnText: { fontSize: 14, fontWeight: "600" },
});
