import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React, { useState } from "react";
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

const LANGUAGES = [
  { code: "te", label: "తెలుగు", english: "Telugu", native: true },
  { code: "en", label: "English", english: "English", native: false },
  { code: "hi", label: "हिंदी", english: "Hindi", native: false },
  { code: "ta", label: "தமிழ்", english: "Tamil", native: false },
  { code: "kn", label: "ಕನ್ನಡ", english: "Kannada", native: false },
];

export default function LanguageScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selectedLang, setSelectedLang] = useState("te");

  const handleSelect = (code: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedLang(code);
  };

  return (
    <>
      <Stack.Screen options={{ title: "Language" }} />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 84 : 40),
          paddingTop: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.intro, { color: colors.mutedForeground }]}>
          Select your preferred language for the app interface and news content.
        </Text>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {LANGUAGES.map((lang, idx) => {
            const active = lang.code === selectedLang;
            return (
              <TouchableOpacity
                key={lang.code}
                onPress={() => handleSelect(lang.code)}
                activeOpacity={0.7}
                style={[
                  styles.langRow,
                  {
                    borderBottomColor: colors.border,
                    borderBottomWidth:
                      idx < LANGUAGES.length - 1 ? StyleSheet.hairlineWidth : 0,
                  },
                ]}
              >
                <View style={styles.langInfo}>
                  <Text style={[styles.langNative, { color: colors.foreground }]}>
                    {lang.label}
                  </Text>
                  <Text style={[styles.langEnglish, { color: colors.mutedForeground }]}>
                    {lang.english}
                    {lang.native ? " · Primary" : ""}
                  </Text>
                </View>
                {active && (
                  <Feather name="check-circle" size={22} color={colors.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.applyBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
        >
          <Text style={styles.applyBtnText}>Apply Language</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  intro: { marginHorizontal: 20, marginBottom: 20, fontSize: 14, lineHeight: 20 },
  card: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 20,
  },
  langRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  langInfo: { flex: 1 },
  langNative: { fontSize: 17, fontWeight: "700" },
  langEnglish: { fontSize: 12, marginTop: 2 },
  applyBtn: {
    marginHorizontal: 20,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  applyBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
