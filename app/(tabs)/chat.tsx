import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  avatarColor,
  fetchAvailableUsers,
  formatTimeShort,
  getConversations,
  getCurrentUserId,
  getMyProfile,
  getOrCreateConversation,
  initials,
  normalizeUsername,
  registerOrUpdateUser,
  sendShareMessage,
  setOnlineStatus,
  type ChatUser,
  type Conversation,
  type ShareDraft,
} from "@/lib/chatClient";
import { clearShareDraft, readShareDraft } from "@/lib/shareDraft";
import { hasSupabaseAuthConfig, supabase } from "@/lib/supabaseClient";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: "#050a0f",
  white: "#0d1320",
  orange: "#0a9b9a",
  orangeSoft: "rgba(10,155,154,0.14)",
  orangeAlpha: "rgba(10,155,154,0.12)",
  navy: "#ffffff",
  navyMuted: "rgba(255,255,255,0.52)",
  navyFaint: "rgba(255,255,255,0.22)",
  border: "rgba(255,255,255,0.10)",
  muted: "#0f1723",
  green: "#22c55e",
} as const;

// ─── Avatar ───────────────────────────────────────────────────────────────────

function UserAvatar({ user, size = 48 }: { user: ChatUser; size?: number }) {
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: user.avatar_color || avatarColor(user.display_name),
        },
      ]}
    >
      <Text style={styles.avatarText}>{initials(user.display_name)}</Text>
      {user.is_online ? <View style={styles.onlineDot} /> : null}
    </View>
  );
}

// ─── Auth Panel ───────────────────────────────────────────────────────────────

function AuthPanel({ onDone }: { onDone: () => void }) {
  const [isSignup, setIsSignup] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = useCallback(async () => {
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    const displayName = name.trim();
    const cleanUsername = normalizeUsername(username || displayName);

    if (!cleanEmail || !cleanPassword || (isSignup && (!displayName || !cleanUsername))) {
      Alert.alert("Missing details", "Enter email, password, display name, and username.");
      return;
    }

    setBusy(true);
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
          options: { data: { display_name: displayName, username: cleanUsername } },
        });
        if (error) throw error;
        const userId = data.user?.id ?? (await getCurrentUserId());
        if (userId) await registerOrUpdateUser(userId, displayName, cleanUsername);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });
        if (error) throw error;
        const userId = data.user?.id ?? (await getCurrentUserId());
        if (userId && displayName) await registerOrUpdateUser(userId, displayName, cleanUsername || displayName);
      }
      onDone();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Auth failed";
      Alert.alert("Chat login failed", message);
    } finally {
      setBusy(false);
    }
  }, [email, isSignup, name, onDone, password, username]);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.authWrap}>
      <View style={styles.authCard}>
        {/* Icon */}
        <View style={styles.authIconWrap}>
          <Feather name="message-circle" size={28} color={C.orange} />
        </View>
        <Text style={styles.authTitle}>
          {isSignup ? "Join the discussion" : "Welcome back"}
        </Text>
        <Text style={styles.authSub}>
          Discuss breaking Telugu news with other readers.
        </Text>

        {/* Google button */}
        <TouchableOpacity
          activeOpacity={0.82}
          style={styles.googleBtn}
          onPress={() => Alert.alert("Coming soon", "Google sign-in will be available soon.")}
        >
          <Text style={styles.googleG}>G</Text>
          <Text style={styles.googleBtnText}>Continue with Google</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>
            or {isSignup ? "create account" : "sign in"} with email
          </Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Fields */}
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor={C.navyMuted}
          style={styles.authInput}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          placeholderTextColor={C.navyMuted}
          style={styles.authInput}
        />
        {isSignup && (
          <>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Display name"
              placeholderTextColor={C.navyMuted}
              style={styles.authInput}
            />
            <TextInput
              value={username}
              onChangeText={(v) => setUsername(normalizeUsername(v))}
              placeholder="Username (letters, numbers, _)"
              autoCapitalize="none"
              placeholderTextColor={C.navyMuted}
              style={styles.authInput}
            />
          </>
        )}

        <TouchableOpacity
          disabled={busy}
          onPress={submit}
          style={[styles.primaryBtn, busy && { opacity: 0.65 }]}
          activeOpacity={0.85}
        >
          {busy
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.primaryBtnText}>{isSignup ? "Create account" : "Sign in"}</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setIsSignup((v) => !v)}
          style={styles.switchBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.switchText}>
            {isSignup ? "Already have an account? " : "New here? "}
            <Text style={styles.switchTextBold}>{isSignup ? "Sign in" : "Create account"}</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const [myId, setMyId] = useState<string | null>(null);
  const [myProfile, setMyProfile] = useState<ChatUser | null>(null);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [pendingShare, setPendingShare] = useState<ShareDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = insets.bottom + (Platform.OS === "web" ? 84 : 100);

  const load = useCallback(async () => {
    if (!hasSupabaseAuthConfig) {
      setLoading(false);
      return;
    }
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user.id ?? null;
    setMyId(uid);
    if (!uid) {
      setLoading(false);
      return;
    }

    const profile = await getMyProfile();
    setMyProfile(profile);
    if (profile) setOnlineStatus(uid, true).catch(() => {});

    const [allUsers, convs, share] = await Promise.all([
      fetchAvailableUsers(uid),
      getConversations(uid),
      readShareDraft(),
    ]);
    setUsers(allUsers);
    setConversations(convs);
    setPendingShare(share);
    setLoading(false);
  }, []);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(() => {
      load().catch(() => setLoading(false));
    });
    load().catch(() => setLoading(false));
    return () => data.subscription.unsubscribe();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      readShareDraft().then(setPendingShare).catch(() => {});
      load().catch(() => {});
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.display_name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q)
    );
  }, [query, users]);

  const convByUser = useMemo(() => {
    const map = new Map<string, Conversation>();
    conversations.forEach((c) => c.other_user?.id && map.set(c.other_user.id, c));
    return map;
  }, [conversations]);

  const openConversation = useCallback(
    async (user: ChatUser) => {
      if (!myId) return;
      try {
        const conv = await getOrCreateConversation(myId, user.id);
        const share = pendingShare ?? (await readShareDraft());
        if (share) {
          await sendShareMessage(conv.id, myId, share);
          await clearShareDraft();
          setPendingShare(null);
        }
        router.push({
          pathname: "/chat/[id]",
          params: {
            id: conv.id,
            name: user.display_name,
            color: user.avatar_color,
            otherId: user.id,
            myId,
          },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not open chat";
        Alert.alert("Chat error", message);
      }
    },
    [myId, pendingShare]
  );

  const handleSignOut = useCallback(async () => {
    if (myId) setOnlineStatus(myId, false).catch(() => {});
    await supabase.auth.signOut();
    setMyId(null);
    setMyProfile(null);
    setUsers([]);
    setConversations([]);
  }, [myId]);

  // ── Error: no Supabase config ──
  if (!hasSupabaseAuthConfig) {
    return (
      <View style={styles.centerScreen}>
        <View style={styles.statusIconWrap}>
          <Feather name="alert-circle" size={24} color={C.orange} />
        </View>
        <Text style={styles.emptyTitle}>Supabase env missing</Text>
        <Text style={styles.emptySub}>
          Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env.
        </Text>
      </View>
    );
  }

  // ── Loading ──
  if (loading) {
    return (
      <View style={styles.centerScreen}>
        <View style={styles.statusIconWrap}>
          <ActivityIndicator size="small" color={C.orange} />
        </View>
        <Text style={styles.emptySub}>Loading chat…</Text>
      </View>
    );
  }

  // ── Auth wall ──
  if (!myId || !myProfile) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <AuthPanel onDone={load} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 10 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>CHAT</Text>
          <Text style={styles.headerSub}>
            @{myProfile.username} · {users.length} people available
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleSignOut}
          activeOpacity={0.8}
          style={styles.signOutBtn}
        >
          <Feather name="log-out" size={17} color={C.orange} />
        </TouchableOpacity>
      </View>

      {/* Share banner */}
      {pendingShare ? (
        <View style={styles.shareBanner}>
          {pendingShare.imageUrl ? (
            <Image source={{ uri: pendingShare.imageUrl }} style={styles.shareThumb} />
          ) : (
            <View style={styles.shareIconWrap}>
              <Feather name="send" size={16} color={C.orange} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.shareLabel}>
              Select someone to share this {pendingShare.kind}
            </Text>
            <Text style={styles.shareTitle} numberOfLines={1}>
              {pendingShare.title}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => { clearShareDraft(); setPendingShare(null); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="x" size={18} color={C.navyMuted} />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Search */}
      <View style={styles.searchWrap}>
        <Feather name="search" size={15} color={C.navyMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search people…"
          placeholderTextColor={C.navyMuted}
          style={styles.searchInput}
        />
        {query.length > 0 ? (
          <TouchableOpacity onPress={() => setQuery("")} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Feather name="x-circle" size={15} color={C.navyMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* User list */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(u) => u.id}
        contentContainerStyle={{ paddingBottom: bottomPad, paddingTop: 6 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.orange} />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item: user }) => {
          const conv = convByUser.get(user.id);
          const preview = conv?.last_message ?? (pendingShare ? "Tap to send shared item" : "Tap to start chatting");
          const hasUnread = false;
          return (
            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.row}
              onPress={() => openConversation(user)}
            >
              <UserAvatar user={user} />
              <View style={styles.info}>
                <View style={styles.topRow}>
                  <Text style={[styles.name, hasUnread && styles.nameUnread]} numberOfLines={1}>
                    {user.display_name}
                  </Text>
                  <Text style={styles.time}>
                    {formatTimeShort(conv?.last_message_at ?? user.last_seen_at)}
                  </Text>
                </View>
                <View style={styles.bottomRow}>
                  <Text style={styles.preview} numberOfLines={1}>
                    @{user.username} · {preview}
                  </Text>
                  {user.is_online ? (
                    <View style={styles.onlineBadge}>
                      <Text style={styles.onlineBadgeText}>Online</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <Feather name="chevron-right" size={16} color={C.navyFaint} />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyList}>
            <View style={styles.emptyIcon}>
              <Feather name="users" size={28} color={C.navyMuted} />
            </View>
            <Text style={styles.emptyTitle}>No one here yet</Text>
            <Text style={styles.emptySub}>
              Create another account on another device to test 1-to-1 chat.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  centerScreen: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    padding: 24,
  },
  statusIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: C.orangeSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: C.white,
    borderBottomWidth: 3,
    borderBottomColor: C.orange,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: C.navy,
    letterSpacing: 2,
  },
  headerSub: {
    fontSize: 11,
    marginTop: 2,
    color: C.navyMuted,
    fontWeight: "600",
  },
  signOutBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: C.orangeSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  // Share banner
  shareBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: C.orangeSoft,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  shareThumb: { width: 38, height: 38, borderRadius: 8, backgroundColor: C.muted },
  shareIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: C.orangeAlpha,
    alignItems: "center",
    justifyContent: "center",
  },
  shareLabel: { fontSize: 10, fontWeight: "800", color: C.orange, letterSpacing: 0.3 },
  shareTitle: { fontSize: 13, fontWeight: "700", color: C.navy, marginTop: 2 },

  // Search
  searchWrap: {
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: C.navy,
  },

  // Rows
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginLeft: 76 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
    backgroundColor: C.white,
  },
  avatar: { alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 15, fontWeight: "900" },
  onlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: C.green,
    borderWidth: 2,
    borderColor: C.white,
  },
  info: { flex: 1, minWidth: 0 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  name: { flex: 1, fontSize: 15, fontWeight: "700", color: C.navy },
  nameUnread: { fontWeight: "900" },
  time: { fontSize: 11, fontWeight: "600", color: C.navyMuted },
  bottomRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 3 },
  preview: { flex: 1, fontSize: 12, fontWeight: "500", color: C.navyMuted },
  onlineBadge: {
    backgroundColor: "rgba(34,197,94,0.12)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 3,
  },
  onlineBadgeText: { color: C.green, fontSize: 9, fontWeight: "900" },

  // Empty
  emptyList: {
    alignItems: "center",
    paddingTop: 64,
    paddingHorizontal: 30,
    gap: 12,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: C.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: C.navy, textAlign: "center" },
  emptySub: { fontSize: 13, color: C.navyMuted, textAlign: "center", lineHeight: 20 },

  // Auth panel
  authWrap: { flex: 1, justifyContent: "center", padding: 18 },
  authCard: {
    backgroundColor: C.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 22,
    gap: 11,
  },
  authIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 13,
    backgroundColor: C.orangeSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  authTitle: { fontSize: 21, fontWeight: "900", color: C.navy },
  authSub: { fontSize: 13, lineHeight: 19, color: C.navyMuted },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.white,
    marginVertical: 2,
  },
  googleG: { fontSize: 18, fontWeight: "900", color: "#4285F4", lineHeight: 22 },
  googleBtnText: { fontSize: 14, fontWeight: "700", color: C.navy },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 2 },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
  dividerText: { fontSize: 11, fontWeight: "600", color: C.navyMuted },
  authInput: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    height: 46,
    paddingHorizontal: 13,
    fontSize: 14,
    fontWeight: "600",
    color: C.navy,
    backgroundColor: C.bg,
  },
  primaryBtn: {
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.orange,
    marginTop: 2,
  },
  primaryBtnText: { color: "#fff", fontWeight: "900", fontSize: 15 },
  switchBtn: { alignItems: "center", paddingVertical: 4 },
  switchText: { fontSize: 13, fontWeight: "600", color: C.navyMuted },
  switchTextBold: { color: C.orange, fontWeight: "800" },
});
