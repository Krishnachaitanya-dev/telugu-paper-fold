import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Stack } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import { NEWS_CATEGORIES } from "@/lib/newsCategories";
import type { NewsUpdate, Reel } from "@/lib/supabase";
import {
  getMyReporterProfile,
  uploadReporterNewsImage,
  upsertReporterProfile,
  type ReporterProfile,
} from "@/lib/reporterClient";
import { hasSupabaseAuthConfig, supabase } from "@/lib/supabaseClient";

const NEWS_UPLOAD_CATEGORIES = NEWS_CATEGORIES.filter(
  (cat) => !["All", "Reporters", "Following"].includes(cat)
);

function extractYouTubeId(input: string) {
  const value = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;
  return (
    value.match(/[?&]v=([A-Za-z0-9_-]{11})/)?.[1] ??
    value.match(/youtu\.be\/([A-Za-z0-9_-]{11})/)?.[1] ??
    value.match(/shorts\/([A-Za-z0-9_-]{11})/)?.[1] ??
    ""
  );
}

function isShortsUrl(input: string) {
  return /youtube\.com\/shorts\/[A-Za-z0-9_-]{11}|youtu\.be\/shorts\/[A-Za-z0-9_-]{11}/i.test(input.trim());
}

export default function ReporterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [mode, setMode] = useState<"news" | "reel">("news");
  const [userId, setUserId] = useState<string | null>(null);
  const [reporterProfile, setReporterProfile] = useState<ReporterProfile | null>(null);
  const [reporterName, setReporterName] = useState("Reporter");
  const [reporterBio, setReporterBio] = useState("");
  const [myNews, setMyNews] = useState<NewsUpdate[]>([]);
  const [myReels, setMyReels] = useState<Reel[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [editingReelId, setEditingReelId] = useState<string | null>(null);

  const [newsTitle, setNewsTitle] = useState("");
  const [newsDescription, setNewsDescription] = useState("");
  const [newsCategory, setNewsCategory] = useState("Top");
  const [newsImageUrl, setNewsImageUrl] = useState("");
  const [newsSourceUrl, setNewsSourceUrl] = useState("");
  const [newsSourceName, setNewsSourceName] = useState("Reporter");

  const [reelTitle, setReelTitle] = useState("");
  const [reelInput, setReelInput] = useState("");
  const [reelChannel, setReelChannel] = useState("Reporter");
  const [reelTag, setReelTag] = useState("Telugu");
  const [reelCategory, setReelCategory] = useState("Top");

  const bottomPad = insets.bottom + (Platform.OS === "web" ? 84 : 30);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSessionEmail(data.session?.user.email ?? null);
      setUserId(data.session?.user.id ?? null);
      setAuthBusy(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionEmail(session?.user.email ?? null);
      setUserId(session?.user.id ?? null);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!sessionEmail) return;
    getMyReporterProfile()
      .then((profile) => {
        if (!profile) return;
        setReporterProfile(profile);
        setReporterName(profile.display_name);
        setReporterBio(profile.bio ?? "");
        setNewsSourceName(profile.display_name);
        setReelChannel(profile.display_name);
      })
      .catch(() => {});
  }, [sessionEmail]);

  const canSubmitNews = useMemo(
    () => newsTitle.trim().length >= 6 && newsDescription.trim().length >= 10,
    [newsDescription, newsTitle]
  );
  const canSubmitReel = useMemo(
    () => reelTitle.trim().length >= 4 && extractYouTubeId(reelInput).length === 11 && isShortsUrl(reelInput),
    [reelInput, reelTitle]
  );

  const loadMyPosts = async (id = userId) => {
    if (!id) return;
    setLoadingPosts(true);
    const [newsResult, reelsResult] = await Promise.all([
      supabase
        .from("news_updates")
        .select("id,title,description,category,image_url,source_url,source_name,created_at,reporter_id,reporter_name,reporter_avatar_url")
        .eq("reporter_id", id)
        .order("created_at", { ascending: false })
        .limit(25),
      supabase
        .from("reels")
        .select("id,video_id,title,channel,tag,category,source_url,sort_order,created_at,is_short,aspect_ratio,duration_seconds,reporter_id,reporter_name,reporter_avatar_url")
        .eq("reporter_id", id)
        .order("created_at", { ascending: false })
        .limit(25),
    ]);
    setMyNews((newsResult.data as NewsUpdate[]) ?? []);
    setMyReels((reelsResult.data as Reel[]) ?? []);
    setLoadingPosts(false);
  };

  useEffect(() => {
    if (userId) loadMyPosts(userId).catch(() => setLoadingPosts(false));
  }, [userId]);

  const handleSignIn = async () => {
    if (!hasSupabaseAuthConfig) {
      Alert.alert("Supabase missing", "Add Supabase URL and anon key in .env first.");
      return;
    }
    if (!email.trim() || password.length < 6) {
      Alert.alert("Login details", "Enter email and at least 6 characters password.");
      return;
    }
    setAuthBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setAuthBusy(false);
    if (error) Alert.alert("Login failed", error.message);
  };

  const handleCreateAccount = async () => {
    if (!email.trim() || password.length < 6) {
      Alert.alert("Reporter account", "Enter email and at least 6 characters password.");
      return;
    }
    setAuthBusy(true);
    const { error } = await supabase.auth.signUp({ email: email.trim(), password });
    setAuthBusy(false);
    if (error) Alert.alert("Signup failed", error.message);
    else Alert.alert("Account created", "Check email if confirmation is enabled.");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleSaveReporterProfile = async () => {
    if (!reporterName.trim()) {
      Alert.alert("Reporter name", "Enter reporter or channel name.");
      return;
    }
    setSubmitting(true);
    try {
      const profile = await upsertReporterProfile({
        displayName: reporterName,
        bio: reporterBio,
        avatarUrl: reporterProfile?.avatar_url,
      });
      setReporterProfile(profile);
      setNewsSourceName(profile.display_name);
      setReelChannel(profile.display_name);
      Alert.alert("Saved", "Reporter profile updated.");
    } catch (err) {
      Alert.alert("Profile failed", err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePickNewsImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow photo access to upload a news image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.78,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    setUploadingImage(true);
    try {
      const url = await uploadReporterNewsImage(result.assets[0].uri);
      setNewsImageUrl(url);
    } catch (err) {
      Alert.alert("Image upload failed", err instanceof Error ? err.message : "Could not upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmitNews = async () => {
    if (!canSubmitNews) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);
    const payload = {
      title: newsTitle.trim(),
      description: newsDescription.trim(),
      category: newsCategory.toLowerCase(),
      image_url: newsImageUrl.trim() || null,
      source_url: newsSourceUrl.trim() || null,
      source_name: newsSourceName.trim() || reporterName.trim() || "Reporter",
      reporter_id: userId,
      reporter_name: reporterName.trim() || newsSourceName.trim() || "Reporter",
      reporter_avatar_url: reporterProfile?.avatar_url ?? null,
    };
    const { error } = editingNewsId
      ? await supabase.from("news_updates").update(payload).eq("id", editingNewsId).eq("reporter_id", userId)
      : await supabase.from("news_updates").insert(payload);
    setSubmitting(false);
    if (error) {
      Alert.alert("Upload failed", error.message);
      return;
    }
    setNewsTitle("");
    setNewsDescription("");
    setNewsImageUrl("");
    setNewsSourceUrl("");
    setEditingNewsId(null);
    loadMyPosts().catch(() => {});
    Alert.alert(editingNewsId ? "Updated" : "Uploaded", "News is saved and will appear after refresh.");
  };

  const handleSubmitReel = async () => {
    const videoId = extractYouTubeId(reelInput);
    if (!canSubmitReel || !videoId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);
    const payload = {
      video_id: videoId,
      title: reelTitle.trim(),
      channel: reelChannel.trim() || "Reporter",
      tag: reelTag.trim() || null,
      category: reelCategory,
      source_url: `https://www.youtube.com/shorts/${videoId}`,
      sort_order: 0,
      is_short: true,
      aspect_ratio: "9:16",
      reporter_id: userId,
      reporter_name: reporterName.trim() || reelChannel.trim() || "Reporter",
      reporter_avatar_url: reporterProfile?.avatar_url ?? null,
    };
    const { error } = editingReelId
      ? await supabase.from("reels").update(payload).eq("id", editingReelId).eq("reporter_id", userId)
      : await supabase.from("reels").insert(payload);
    setSubmitting(false);
    if (error) {
      Alert.alert("Upload failed", error.message);
      return;
    }
    setReelTitle("");
    setReelInput("");
    setEditingReelId(null);
    loadMyPosts().catch(() => {});
    Alert.alert(editingReelId ? "Updated" : "Uploaded", "Reel is saved and will appear after refresh.");
  };

  const handleEditNews = (item: NewsUpdate) => {
    setMode("news");
    setEditingNewsId(item.id);
    setEditingReelId(null);
    setNewsTitle(item.title);
    setNewsDescription(item.description ?? "");
    setNewsCategory(NEWS_UPLOAD_CATEGORIES.includes(item.category as any) ? item.category : "Top");
    setNewsImageUrl(item.image_url ?? "");
    setNewsSourceUrl(item.source_url ?? "");
    setNewsSourceName(item.source_name ?? reporterName);
  };

  const handleEditReel = (item: Reel) => {
    setMode("reel");
    setEditingReelId(item.id);
    setEditingNewsId(null);
    setReelTitle(item.title);
    setReelInput(item.source_url ?? `https://www.youtube.com/shorts/${item.video_id}`);
    setReelChannel(item.channel ?? reporterName);
    setReelTag(item.tag ?? "");
    setReelCategory(NEWS_UPLOAD_CATEGORIES.includes(item.category as any) ? item.category! : "Top");
  };

  const handleDeletePost = (kind: "news" | "reel", id: string) => {
    Alert.alert("Delete post", "This will remove the post from the app.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const table = kind === "news" ? "news_updates" : "reels";
          const { error } = await supabase.from(table).delete().eq("id", id).eq("reporter_id", userId);
          if (error) Alert.alert("Delete failed", error.message);
          else loadMyPosts().catch(() => {});
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ title: "Reporter Studio" }} />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ padding: 18, paddingBottom: bottomPad }}
        keyboardShouldPersistTaps="handled"
      >
        {authBusy ? (
          <View style={styles.centerCard}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : !sessionEmail ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBadge, { backgroundColor: colors.primarySoft }]}>
                <Feather name="lock" size={18} color={colors.primary} />
              </View>
              <View style={styles.headerCopy}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Reporter Login</Text>
                <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                  Sign in to upload news and reels.
                </Text>
              </View>
            </View>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              keyboardType="email-address"
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
            />
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={handleSignIn}>
              <Text style={styles.primaryBtnText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkBtn} onPress={handleCreateAccount}>
              <Text style={[styles.linkText, { color: colors.primary }]}>Create reporter account</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={[styles.signedCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.signedText, { color: colors.foreground }]}>Logged in as {sessionEmail}</Text>
              <TouchableOpacity onPress={handleSignOut}>
                <Text style={[styles.linkText, { color: colors.primary }]}>Sign out</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Reporter Profile</Text>
              <TextInput
                value={reporterName}
                onChangeText={setReporterName}
                placeholder="Reporter or channel name"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
              />
              <TextInput
                value={reporterBio}
                onChangeText={setReporterBio}
                placeholder="Short bio"
                placeholderTextColor={colors.mutedForeground}
                multiline
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
              />
              <TouchableOpacity
                disabled={submitting}
                style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveReporterProfile}
              >
                <Text style={styles.primaryBtnText}>Save Reporter Profile</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.segment}>
              {(["news", "reel"] as const).map((item) => {
                const active = mode === item;
                return (
                  <TouchableOpacity
                    key={item}
                    onPress={() => setMode(item)}
                    style={[styles.segmentBtn, { backgroundColor: active ? colors.primary : colors.card, borderColor: active ? colors.primary : colors.border }]}
                  >
                    <Text style={[styles.segmentText, { color: active ? "#fff" : colors.foreground }]}>
                      {item === "news" ? "News" : "Reels"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {mode === "news" ? (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Upload News</Text>
                {editingNewsId ? <Text style={[styles.editingNote, { color: colors.primary }]}>Editing existing news post</Text> : null}
                <TextInput
                  value={newsTitle}
                  onChangeText={setNewsTitle}
                  placeholder="Headline"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                />
                <TextInput
                  value={newsDescription}
                  onChangeText={setNewsDescription}
                  placeholder="Description"
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  style={[styles.input, styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                />
                <View style={styles.categoryGrid}>
                  {NEWS_UPLOAD_CATEGORIES.map((cat) => {
                    const active = cat === newsCategory;
                    return (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => setNewsCategory(cat)}
                        style={[styles.catChip, { backgroundColor: active ? colors.primary : colors.background, borderColor: active ? colors.primary : colors.border }]}
                      >
                        <Text style={[styles.catText, { color: active ? "#fff" : colors.foreground }]}>{cat}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <TouchableOpacity
                  onPress={handlePickNewsImage}
                  disabled={uploadingImage}
                  style={[styles.imagePickBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                >
                  <Feather name="image" size={18} color={colors.primary} />
                  <Text style={[styles.imagePickText, { color: colors.primary }]}>
                    {uploadingImage ? "Uploading image..." : newsImageUrl ? "Change uploaded image" : "Upload image"}
                  </Text>
                </TouchableOpacity>
                <TextInput
                  value={newsImageUrl}
                  onChangeText={setNewsImageUrl}
                  placeholder="Image URL or uploaded image URL"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="none"
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                />
                <TextInput
                  value={newsSourceUrl}
                  onChangeText={setNewsSourceUrl}
                  placeholder="Source URL"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="none"
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                />
                <TextInput
                  value={newsSourceName}
                  onChangeText={setNewsSourceName}
                  placeholder="Source name"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                />
                <TouchableOpacity
                  disabled={!canSubmitNews || submitting}
                  style={[styles.primaryBtn, { backgroundColor: canSubmitNews ? colors.primary : colors.muted }]}
                  onPress={handleSubmitNews}
                >
                  <Text style={styles.primaryBtnText}>
                    {submitting ? "Saving..." : editingNewsId ? "Update News" : "Upload News"}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Upload Reel</Text>
                {editingReelId ? <Text style={[styles.editingNote, { color: colors.primary }]}>Editing existing reel</Text> : null}
                <TextInput
                  value={reelTitle}
                  onChangeText={setReelTitle}
                  placeholder="Reel title"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                />
                <TextInput
                  value={reelInput}
                  onChangeText={setReelInput}
                  placeholder="YouTube Shorts URL"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="none"
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                />
                <Text style={[styles.helperText, { color: colors.mutedForeground }]}>
                  Only YouTube Shorts links are accepted so the Reels feed stays vertical.
                </Text>
                <TextInput
                  value={reelChannel}
                  onChangeText={setReelChannel}
                  placeholder="Channel"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                />
                <TextInput
                  value={reelTag}
                  onChangeText={setReelTag}
                  placeholder="Tag"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                />
                <View style={styles.categoryGrid}>
                  {NEWS_UPLOAD_CATEGORIES.map((cat) => {
                    const active = cat === reelCategory;
                    return (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => setReelCategory(cat)}
                        style={[styles.catChip, { backgroundColor: active ? colors.primary : colors.background, borderColor: active ? colors.primary : colors.border }]}
                      >
                        <Text style={[styles.catText, { color: active ? "#fff" : colors.foreground }]}>{cat}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <TouchableOpacity
                  disabled={!canSubmitReel || submitting}
                  style={[styles.primaryBtn, { backgroundColor: canSubmitReel ? colors.primary : colors.muted }]}
                  onPress={handleSubmitReel}
                >
                  <Text style={styles.primaryBtnText}>
                    {submitting ? "Saving..." : editingReelId ? "Update Reel" : "Upload Reel"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.manageHeader}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Manage Your Posts</Text>
                <TouchableOpacity onPress={() => loadMyPosts().catch(() => {})}>
                  <Text style={[styles.linkText, { color: colors.primary }]}>{loadingPosts ? "Loading..." : "Refresh"}</Text>
                </TouchableOpacity>
              </View>
              {[...myNews.map((item) => ({ kind: "news" as const, id: item.id, title: item.title, sub: item.category, raw: item })),
                ...myReels.map((item) => ({ kind: "reel" as const, id: item.id, title: item.title, sub: item.channel, raw: item }))].length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No reporter posts yet.</Text>
              ) : (
                <>
                  {myNews.map((item) => (
                    <View key={item.id} style={[styles.postRow, { borderColor: colors.border }]}>
                      <View style={styles.postCopy}>
                        <Text style={[styles.postType, { color: colors.primary }]}>News · {item.category}</Text>
                        <Text style={[styles.postTitle, { color: colors.foreground }]} numberOfLines={2}>{item.title}</Text>
                      </View>
                      <TouchableOpacity onPress={() => handleEditNews(item)} style={styles.smallIconBtn}>
                        <Feather name="edit-2" size={17} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeletePost("news", item.id)} style={styles.smallIconBtn}>
                        <Feather name="trash-2" size={17} color="#ff4f87" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {myReels.map((item) => (
                    <View key={item.id} style={[styles.postRow, { borderColor: colors.border }]}>
                      <View style={styles.postCopy}>
                        <Text style={[styles.postType, { color: colors.primary }]}>Reel · {item.channel}</Text>
                        <Text style={[styles.postTitle, { color: colors.foreground }]} numberOfLines={2}>{item.title}</Text>
                      </View>
                      <TouchableOpacity onPress={() => handleEditReel(item)} style={styles.smallIconBtn}>
                        <Feather name="edit-2" size={17} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeletePost("reel", item.id)} style={styles.smallIconBtn}>
                        <Feather name="trash-2" size={17} color="#ff4f87" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerCard: { minHeight: 220, alignItems: "center", justifyContent: "center" },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    marginBottom: 14,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: "800" },
  cardSub: { fontSize: 12, marginTop: 2 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  textArea: { minHeight: 120, textAlignVertical: "top" },
  primaryBtn: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  linkBtn: { alignItems: "center", paddingVertical: 4 },
  linkText: { fontSize: 13, fontWeight: "800" },
  signedCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  signedText: { flex: 1, fontSize: 13, fontWeight: "700" },
  segment: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  segmentBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  segmentText: { fontSize: 14, fontWeight: "800" },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catChip: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  catText: { fontSize: 13, fontWeight: "700" },
  editingNote: { fontSize: 12, fontWeight: "800" },
  helperText: { fontSize: 12, lineHeight: 18 },
  imagePickBtn: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  imagePickText: { fontSize: 14, fontWeight: "800" },
  manageHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  emptyText: { fontSize: 13, fontWeight: "700" },
  postRow: {
    borderTopWidth: 1,
    paddingTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  postCopy: { flex: 1, minWidth: 0 },
  postType: { fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  postTitle: { fontSize: 14, lineHeight: 20, fontWeight: "800", marginTop: 2 },
  smallIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(127,127,127,0.09)",
  },
});
