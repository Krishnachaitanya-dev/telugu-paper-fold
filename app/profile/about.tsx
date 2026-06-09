import * as WebBrowser from "expo-web-browser";
import { Feather } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React from "react";
import {
  Image,
  Linking,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

interface LinkRow {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
}

export default function AboutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const handleShare = async () => {
    await Share.share({
      message:
        "Check out Insta News Telugu — the best Telugu news app! Download now.",
      title: "Insta News Telugu",
    });
  };

  const rows: LinkRow[] = [
    {
      icon: "star",
      label: "Rate on App Store",
      onPress: () => Linking.openURL("https://apps.apple.com"),
    },
    {
      icon: "share-2",
      label: "Share with Friends",
      onPress: handleShare,
    },
    {
      icon: "message-circle",
      label: "Send Feedback",
      onPress: () => Linking.openURL("mailto:feedback@teluguepapers.com"),
    },
    {
      icon: "shield",
      label: "Privacy Policy",
      onPress: () => WebBrowser.openBrowserAsync("https://example.com/privacy"),
    },
    {
      icon: "file-text",
      label: "Terms of Service",
      onPress: () => WebBrowser.openBrowserAsync("https://example.com/terms"),
    },
    {
      icon: "twitter",
      label: "Follow us on X",
      onPress: () => WebBrowser.openBrowserAsync("https://twitter.com"),
    },
  ];

  return (
    <>
      <Stack.Screen options={{ title: "About" }} />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 84 : 40),
          paddingTop: 30,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* App identity */}
        <View style={styles.appIdentity}>
          <View style={[styles.appIconWrap, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.appIconText, { color: colors.primary }]}>తె</Text>
          </View>
          <Text style={[styles.appName, { color: colors.foreground }]}>
            Insta News Telugu
          </Text>
          <Text style={[styles.appTagline, { color: colors.mutedForeground }]}>
            Your trusted source for Telugu news
          </Text>
          <View style={[styles.versionBadge, { backgroundColor: colors.muted }]}>
            <Text style={[styles.versionText, { color: colors.mutedForeground }]}>
              Version 1.0.0
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={[styles.statsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { label: "Daily News", value: "500+" },
            { label: "Live Channels", value: "20+" },
            { label: "Reels", value: "100+" },
          ].map((stat) => (
            <View key={stat.label} style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Links */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {rows.map((row, idx) => (
            <TouchableOpacity
              key={row.label}
              onPress={row.onPress}
              activeOpacity={0.7}
              style={[
                styles.linkRow,
                {
                  borderBottomColor: colors.border,
                  borderBottomWidth: idx < rows.length - 1 ? StyleSheet.hairlineWidth : 0,
                },
              ]}
            >
              <View style={[styles.rowIcon, { backgroundColor: colors.primarySoft }]}>
                <Feather name={row.icon} size={16} color={colors.primary} />
              </View>
              <Text style={[styles.linkLabel, { color: colors.foreground }]}>
                {row.label}
              </Text>
              <Feather name="external-link" size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.copyright, { color: colors.mutedForeground }]}>
          © 2025 Insta News Telugu. All rights reserved.{"\n"}
          Made with ♥ for Telugu readers worldwide.
        </Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  appIdentity: { alignItems: "center", marginBottom: 24, paddingHorizontal: 20 },
  appIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  appIconText: { fontSize: 38, fontWeight: "900" },
  appName: { fontSize: 22, fontWeight: "800", marginBottom: 4 },
  appTagline: { fontSize: 14, textAlign: "center", marginBottom: 12 },
  versionBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  versionText: { fontSize: 12, fontWeight: "600" },

  statsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    overflow: "hidden",
  },
  stat: { flex: 1, alignItems: "center", paddingVertical: 16 },
  statValue: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 11, marginTop: 4 },

  card: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 20,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  linkLabel: { flex: 1, fontSize: 14, fontWeight: "600" },

  copyright: { fontSize: 12, textAlign: "center", lineHeight: 18, paddingHorizontal: 30 },
});
