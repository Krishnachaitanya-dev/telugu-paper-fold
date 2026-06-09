import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

// ─── Types ────────────────────────────────────────────────────────────────────

type FeatherName = keyof typeof Feather.glyphMap;

interface SettingItem {
  icon: FeatherName;
  label: string;
  subtitle?: string;
  route?: string;
  toggle?: "notifications" | "breakingAlerts";
  iconColor?: string;
  destructive?: boolean;
}

interface SettingSection {
  title: string;
  items: SettingItem[];
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function SettingRow({
  item,
  switchValue,
  onSwitch,
}: {
  item: SettingItem;
  switchValue?: boolean;
  onSwitch?: (v: boolean) => void;
}) {
  const tint = item.destructive ? "#EF4444" : (item.iconColor ?? "#0a9b9a");
  const bgTint = item.destructive ? "rgba(239,68,68,0.10)" : "rgba(10,155,154,0.12)";

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (item.route) router.push(item.route as never);
  };

  return (
    <TouchableOpacity
      activeOpacity={item.route ? 0.7 : 1}
      onPress={item.route ? handlePress : undefined}
      style={styles.row}
    >
      <View style={[styles.rowIcon, { backgroundColor: bgTint }]}>
        <Feather name={item.icon} size={16} color={tint} />
      </View>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowLabel, item.destructive && { color: "#EF4444" }]}>
          {item.label}
        </Text>
        {item.subtitle ? (
          <Text style={styles.rowSub}>{item.subtitle}</Text>
        ) : null}
      </View>
      {item.toggle && onSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={(v) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSwitch(v);
          }}
          trackColor={{ true: "#0a9b9a", false: "rgba(255,255,255,0.18)" }}
          thumbColor="#fff"
        />
      ) : item.route ? (
        <Feather name="chevron-right" size={15} color="rgba(255,255,255,0.30)" />
      ) : null}
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState(true);
  const [breakingAlerts, setBreakingAlerts] = useState(true);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = insets.bottom + (Platform.OS === "web" ? 84 : 100);

  const SECTIONS: SettingSection[] = [
    {
      title: "ACCOUNT",
      items: [
        { icon: "user", label: "Edit Profile", subtitle: "Name, username, avatar", route: "/profile/edit" },
        { icon: "upload-cloud", label: "Reporter Studio", subtitle: "Upload news & reels", route: "/profile/reporter" },
      ],
    },
    {
      title: "CHAT & PRIVACY",
      items: [
        { icon: "lock", label: "Lock Chat", subtitle: "Require biometrics to open chat — coming soon" },
        { icon: "user", label: "Change Username", subtitle: "Update your @username", route: "/profile/edit" },
      ],
    },
    {
      title: "NOTIFICATIONS",
      items: [
        { icon: "bell", label: "Notifications", toggle: "notifications", subtitle: "Enable push alerts" },
        { icon: "zap", label: "Breaking News Alerts", toggle: "breakingAlerts", subtitle: "Immediate alerts" },
        { icon: "settings", label: "Alert Settings", route: "/profile/notifications" },
      ],
    },
    {
      title: "APP",
      items: [
        { icon: "star", label: "Rate the App", subtitle: "Love the app? Leave a review", route: "/profile/about" },
        { icon: "share-2", label: "Share with Friends", route: "/profile/about" },
        { icon: "message-circle", label: "Feedback", subtitle: "Send us your thoughts", route: "/profile/about" },
        { icon: "info", label: "About", subtitle: "Insta News Telugu v1.0", route: "/profile/about" },
      ],
    },
    {
      title: "LEGAL",
      items: [
        { icon: "shield", label: "Privacy Policy", route: "/profile/about" },
        { icon: "file-text", label: "Terms of Service", route: "/profile/about" },
      ],
    },
    {
      title: "ACCOUNT ACTIONS",
      items: [
        { icon: "log-out", label: "Sign Out", destructive: true, route: "/profile/edit" },
      ],
    },
  ];

  const getSwitchValue = (key: SettingItem["toggle"]) => {
    if (key === "notifications") return notifications;
    if (key === "breakingAlerts") return breakingAlerts;
    return false;
  };

  const handleSwitch = (key: SettingItem["toggle"], value: boolean) => {
    if (key === "notifications") setNotifications(value);
    if (key === "breakingAlerts") setBreakingAlerts(value);
  };

  return (
    <View style={[styles.container, { backgroundColor: "#050a0f" }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 10 },
        ]}
      >
        <Text style={styles.headerTitle}>PROFILE</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar hero card */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => router.push("/profile/edit" as never)}
          style={styles.avatarCard}
        >
          {/* Orange left accent */}
          <View style={styles.avatarAccent} />
          <View style={[styles.avatar]}>
            <Text style={styles.avatarText}>తె</Text>
          </View>
          <View style={styles.avatarInfo}>
            <Text style={styles.displayName}>Telugu Reader</Text>
            <Text style={styles.tagline}>Tap to edit profile</Text>
          </View>
          <View style={styles.editPill}>
            <Feather name="edit-2" size={13} color="#0a9b9a" />
          </View>
        </TouchableOpacity>

        {/* Sections */}
        {SECTIONS.map((section) => (
          <View key={section.title}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionTitleDot} />
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            <View style={styles.sectionCard}>
              {section.items.map((item) => (
                <SettingRow
                  key={item.label}
                  item={item}
                  switchValue={item.toggle ? getSwitchValue(item.toggle) : undefined}
                  onSwitch={item.toggle ? (v) => handleSwitch(item.toggle!, v) : undefined}
                />
              ))}
            </View>
          </View>
        ))}

        <Text style={[styles.version, { color: colors.mutedForeground }]}>
          Insta News Telugu · v1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: "#0d1320",
    borderBottomWidth: 3,
    borderBottomColor: "#0a9b9a",
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 2,
  },

  scroll: { paddingTop: 20 },

  // Avatar card
  avatarCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#0d1320",
    padding: 16,
    gap: 14,
    marginBottom: 24,
    overflow: "hidden",
  },
  avatarAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: "#0a9b9a",
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(10,155,154,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 22, fontWeight: "900", color: "#0a9b9a" },
  avatarInfo: { flex: 1 },
  displayName: { fontSize: 16, fontWeight: "800", color: "#ffffff" },
  tagline: { fontSize: 12, marginTop: 2, color: "rgba(255,255,255,0.50)", fontWeight: "500" },
  editPill: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(10,155,154,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Sections
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 20,
    marginBottom: 8,
  },
  sectionTitleDot: {
    width: 3,
    height: 12,
    borderRadius: 2,
    backgroundColor: "#0a9b9a",
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(255,255,255,0.50)",
    letterSpacing: 1.2,
  },
  sectionCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#0d1320",
    overflow: "hidden",
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
    gap: 12,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: "600", color: "#ffffff" },
  rowSub: { fontSize: 12, marginTop: 2, color: "rgba(255,255,255,0.50)" },
  version: {
    fontSize: 11,
    textAlign: "center",
    marginBottom: 10,
    color: "rgba(255,255,255,0.35)",
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
