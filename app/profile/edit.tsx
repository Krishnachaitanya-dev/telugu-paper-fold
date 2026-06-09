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
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { DISPLAY_NAME_KEY } from "@/lib/supabaseClient";

const USERNAME_KEY = "pref_username";
const USERNAME_RE = /^[a-z0-9_]{3,24}$/;
const CATEGORIES = ["Top", "Jobs", "Districts", "Movies", "TTD", "Exams", "Sports", "Politics"];

export default function EditProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["Top", "Movies"]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(DISPLAY_NAME_KEY).then((n) => { if (n) setDisplayName(n); });
    AsyncStorage.getItem(USERNAME_KEY).then((u) => { if (u) setUsername(u); });
  }, []);

  const handleSave = async () => {
    if (!displayName.trim()) return;
    if (username && !USERNAME_RE.test(username)) {
      setUsernameError("3-24 chars, lowercase letters, numbers, underscore only");
      return;
    }
    setUsernameError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await AsyncStorage.setItem(DISPLAY_NAME_KEY, displayName.trim());
    if (username) await AsyncStorage.setItem(USERNAME_KEY, username.toLowerCase().trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleCategory = (cat: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: "Edit Profile" }} />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 84 : 40),
          paddingTop: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={[styles.bigAvatar, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.bigAvatarText, { color: colors.primary }]}>
              {displayName?.[0]?.toUpperCase() ?? "తె"}
            </Text>
          </View>
          <Text style={[styles.changePhotoText, { color: colors.primary }]}>
            Change Photo
          </Text>
        </View>

        {/* Display Name */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            DISPLAY NAME
          </Text>
          <View
            style={[
              styles.inputWrap,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Feather name="user" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your display name"
              placeholderTextColor={colors.mutedForeground}
              maxLength={30}
            />
          </View>
        </View>

        {/* Username */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>USERNAME</Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: usernameError ? "#ff4f87" : colors.border }]}>
            <Text style={{ color: colors.mutedForeground, fontSize: 15 }}>@</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              value={username}
              onChangeText={(v) => { setUsername(v.toLowerCase()); setUsernameError(""); }}
              placeholder="your_username"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={24}
            />
          </View>
          {usernameError ? (
            <Text style={styles.errorText}>{usernameError}</Text>
          ) : (
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>
              3-24 chars · lowercase letters, numbers, underscore
            </Text>
          )}
        </View>

        {/* Category preferences */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            INTERESTS
          </Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => {
              const active = selectedCategories.includes(cat);
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => toggleCategory(cat)}
                  style={[
                    styles.catChip,
                    {
                      backgroundColor: active ? colors.primary : colors.card,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.catChipText,
                      { color: active ? "#fff" : colors.foreground },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={[
            styles.saveBtn,
            { backgroundColor: saved ? "#22c55e" : colors.primary },
          ]}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <Feather name={saved ? "check" : "save"} size={18} color="#fff" />
          <Text style={styles.saveBtnText}>{saved ? "Saved!" : "Save Profile"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  avatarSection: { alignItems: "center", marginBottom: 30 },
  bigAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  bigAvatarText: { fontSize: 36, fontWeight: "900" },
  changePhotoText: { fontSize: 14, fontWeight: "600" },
  section: { marginHorizontal: 20, marginBottom: 24 },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 10 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  input: { flex: 1, fontSize: 15 },
  errorText: { color: "#ff4f87", fontSize: 12, marginTop: 6, marginLeft: 4 },
  hint: { fontSize: 12, marginTop: 6, marginLeft: 4 },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  catChipText: { fontSize: 13, fontWeight: "600" },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
