import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
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
import {
  getCachedPushToken,
  getPermissionStatus,
  requestPermissions,
  sendBreakingNewsDemo,
  sendDelayedNotification,
  type PermissionStatus,
} from "@/lib/notifications";

const PREFS_KEY = "notification_prefs_v1";

interface NotifCategory {
  key: string;
  label: string;
  subtitle: string;
  icon: keyof typeof Feather.glyphMap;
  defaultOn: boolean;
}

const CATEGORIES: NotifCategory[] = [
  { key: "breaking",  label: "Breaking News",    subtitle: "Urgent stories as they happen",    icon: "zap",          defaultOn: true  },
  { key: "morning",   label: "Morning Digest",    subtitle: "Top stories at 7 AM",              icon: "sun",          defaultOn: true  },
  { key: "evening",   label: "Evening Recap",     subtitle: "Daily summary at 6 PM",            icon: "moon",         defaultOn: false },
  { key: "local",     label: "District Updates",  subtitle: "News from your district",          icon: "map-pin",      defaultOn: true  },
  { key: "jobs",      label: "Job Alerts",        subtitle: "New government job postings",      icon: "briefcase",    defaultOn: false },
  { key: "movies",    label: "Movie News",        subtitle: "Telugu cinema updates",            icon: "film",         defaultOn: true  },
  { key: "ttd",       label: "TTD Updates",       subtitle: "Tirumala temple news",             icon: "bell",         defaultOn: false },
  { key: "live",      label: "Live TV Alerts",    subtitle: "When channels go live",            icon: "radio",        defaultOn: false },
];

// ─── Permission Status Card ───────────────────────────────────────────────────

function PermissionCard({
  status,
  onRequest,
  loading,
}: {
  status: PermissionStatus;
  onRequest: () => void;
  loading: boolean;
}) {
  const colors = useColors();

  const isGranted = status === "granted";
  const isDenied = status === "denied";

  const openSettings = () => Linking.openSettings();

  return (
    <View
      style={[
        styles.permCard,
        {
          backgroundColor: isGranted
            ? colors.primarySoft
            : isDenied
            ? "rgba(255,79,135,0.1)"
            : colors.card,
          borderColor: isGranted
            ? colors.primary
            : isDenied
            ? "#ff4f87"
            : colors.border,
        },
      ]}
    >
      <View style={styles.permCardLeft}>
        <View
          style={[
            styles.permIcon,
            {
              backgroundColor: isGranted
                ? colors.primary
                : isDenied
                ? "#ff4f87"
                : colors.muted,
            },
          ]}
        >
          <Feather
            name={isGranted ? "bell" : isDenied ? "bell-off" : "bell"}
            size={20}
            color="#fff"
          />
        </View>
        <View style={styles.permText}>
          <Text style={[styles.permTitle, { color: colors.foreground }]}>
            {isGranted
              ? "Notifications enabled"
              : isDenied
              ? "Notifications blocked"
              : "Enable notifications"}
          </Text>
          <Text style={[styles.permSub, { color: colors.mutedForeground }]}>
            {isGranted
              ? "You'll receive breaking news alerts"
              : isDenied
              ? "Open Settings to allow notifications"
              : "Get alerts for breaking news and updates"}
          </Text>
        </View>
      </View>

      {!isGranted &&
        (isDenied ? (
          <TouchableOpacity
            style={[styles.permBtn, { backgroundColor: "#ff4f87" }]}
            onPress={openSettings}
            activeOpacity={0.85}
          >
            <Text style={styles.permBtnText}>Settings</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.permBtn, { backgroundColor: colors.primary }]}
            onPress={onRequest}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.permBtnText}>Enable</Text>
            )}
          </TouchableOpacity>
        ))}
    </View>
  );
}

// ─── Push Token Card ──────────────────────────────────────────────────────────

function PushTokenCard({ token }: { token: string | null }) {
  const colors = useColors();
  const [copied, setCopied] = useState(false);

  if (!token) return null;

  const short = `${token.slice(0, 24)}…`;

  const handleCopy = () => {
    // Clipboard.setStringAsync is not available in bare RN without expo-clipboard
    // For now just show a brief "copied" indicator as UX feedback
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <TouchableOpacity
      onPress={handleCopy}
      activeOpacity={0.75}
      style={[styles.tokenCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={[styles.tokenIcon, { backgroundColor: colors.primarySoft }]}>
        <Feather name="key" size={14} color={colors.primary} />
      </View>
      <View style={styles.tokenText}>
        <Text style={[styles.tokenLabel, { color: colors.mutedForeground }]}>
          EXPO PUSH TOKEN
        </Text>
        <Text style={[styles.tokenValue, { color: colors.foreground }]} numberOfLines={1}>
          {short}
        </Text>
        <Text style={[styles.tokenHint, { color: colors.mutedForeground }]}>
          Use this token to send push notifications from your server
        </Text>
      </View>
      <Feather
        name={copied ? "check" : "copy"}
        size={16}
        color={copied ? colors.primary : colors.mutedForeground}
      />
    </TouchableOpacity>
  );
}

// ─── Test Notification Button ─────────────────────────────────────────────────

function TestNotificationRow({ enabled }: { enabled: boolean }) {
  const colors = useColors();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleTest = async () => {
    if (!enabled) {
      Alert.alert(
        "Notifications Disabled",
        "Please enable notifications above to test them.",
        [{ text: "OK" }]
      );
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSending(true);
    await sendBreakingNewsDemo();
    setSending(false);
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  const handleMorning = async () => {
    if (!enabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await sendDelayedNotification(
      "🌅 Good Morning!",
      "Your Telugu morning digest is ready. 5 top stories await.",
      5, // 5 seconds for demo
      { screen: "news", category: "Top" }
    );
    Alert.alert("Scheduled!", "Morning digest notification in 5 seconds.");
  };

  return (
    <View style={[styles.testCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.testTitle, { color: colors.foreground }]}>
        Test Notifications
      </Text>
      <Text style={[styles.testSub, { color: colors.mutedForeground }]}>
        Fire a real device notification to see how it looks.
      </Text>

      <View style={styles.testBtns}>
        <TouchableOpacity
          style={[
            styles.testBtn,
            {
              backgroundColor: sent ? "#22c55e" : colors.primary,
              opacity: !enabled ? 0.5 : 1,
            },
          ]}
          onPress={handleTest}
          activeOpacity={0.85}
          disabled={sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Feather name={sent ? "check" : "zap"} size={15} color="#fff" />
              <Text style={styles.testBtnText}>
                {sent ? "Sent!" : "Breaking News"}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.testBtnOutline,
            {
              borderColor: colors.border,
              opacity: !enabled ? 0.5 : 1,
            },
          ]}
          onPress={handleMorning}
          activeOpacity={0.85}
          disabled={!enabled}
        >
          <Feather name="sun" size={15} color={colors.primary} />
          <Text style={[styles.testBtnOutlineText, { color: colors.primary }]}>
            Morning Digest (5s)
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [permStatus, setPermStatus] = useState<PermissionStatus>("undetermined");
  const [permLoading, setPermLoading] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => {
    const defaults: Record<string, boolean> = {};
    CATEGORIES.forEach((c) => { defaults[c.key] = c.defaultOn; });
    return defaults;
  });

  // Load real permission status + stored token
  useEffect(() => {
    getPermissionStatus().then(setPermStatus);
    getCachedPushToken().then(setPushToken);

    AsyncStorage.getItem(PREFS_KEY).then((raw) => {
      if (raw) {
        try { setPrefs(JSON.parse(raw)); } catch {}
      }
    });
  }, []);

  const handleRequestPermission = useCallback(async () => {
    setPermLoading(true);
    const granted = await requestPermissions();
    setPermStatus(granted ? "granted" : "denied");
    setPermLoading(false);
  }, []);

  const togglePref = useCallback(async (key: string, value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next));
  }, [prefs]);

  const isGranted = permStatus === "granted";

  return (
    <>
      <Stack.Screen options={{ title: "Notifications" }} />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 84 : 40),
          paddingTop: 20,
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Permission status */}
        <View style={styles.section}>
          <PermissionCard
            status={permStatus}
            onRequest={handleRequestPermission}
            loading={permLoading}
          />
        </View>

        {/* Push token */}
        {pushToken && (
          <View style={styles.section}>
            <PushTokenCard token={pushToken} />
          </View>
        )}

        {/* Test notification */}
        <View style={styles.section}>
          <TestNotificationRow enabled={isGranted} />
        </View>

        {/* Per-category toggles */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            ALERT CATEGORIES
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {CATEGORIES.map((cat, idx) => (
              <View
                key={cat.key}
                style={[
                  styles.row,
                  {
                    borderBottomColor: colors.border,
                    borderBottomWidth: idx < CATEGORIES.length - 1 ? StyleSheet.hairlineWidth : 0,
                    opacity: isGranted ? 1 : 0.45,
                  },
                ]}
              >
                <View style={[styles.rowIcon, { backgroundColor: colors.primarySoft }]}>
                  <Feather name={cat.icon} size={16} color={colors.primary} />
                </View>
                <View style={styles.rowInfo}>
                  <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                    {cat.label}
                  </Text>
                  <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                    {cat.subtitle}
                  </Text>
                </View>
                <Switch
                  value={isGranted && (prefs[cat.key] ?? cat.defaultOn)}
                  onValueChange={(v) => {
                    if (isGranted) togglePref(cat.key, v);
                  }}
                  trackColor={{ true: colors.primary, false: colors.muted }}
                  thumbColor="#fff"
                  disabled={!isGranted}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Info footer */}
        <View style={styles.section}>
          <Text style={[styles.footer, { color: colors.mutedForeground }]}>
            Notifications are processed by Expo's push service. Your device token is only used to
            deliver alerts and is never shared with third parties.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { paddingHorizontal: 16 },

  // Permission card
  permCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  permCardLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  permIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  permText: { flex: 1 },
  permTitle: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  permSub: { fontSize: 12, lineHeight: 17 },
  permBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, minWidth: 72, alignItems: "center" },
  permBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  // Token card
  tokenCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  tokenIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  tokenText: { flex: 1 },
  tokenLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1, marginBottom: 3 },
  tokenValue: { fontSize: 13, fontWeight: "600", marginBottom: 3, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  tokenHint: { fontSize: 11, lineHeight: 15 },

  // Test card
  testCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  testTitle: { fontSize: 15, fontWeight: "700" },
  testSub: { fontSize: 13, lineHeight: 19 },
  testBtns: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  testBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 120,
    justifyContent: "center",
  },
  testBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  testBtnOutline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  testBtnOutlineText: { fontSize: 13, fontWeight: "600" },

  // Category list
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 10 },
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: "600" },
  rowSub: { fontSize: 12, marginTop: 2 },

  footer: { fontSize: 12, lineHeight: 18, textAlign: "center" },
});
