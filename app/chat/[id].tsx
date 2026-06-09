import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as WebBrowser from "expo-web-browser";
import { Feather } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

import { useColors } from "@/hooks/useColors";
import { supabase } from "@/lib/supabaseClient";
import {
  avatarColor,
  cleanupExpiredImageMessages,
  getMessages,
  markImageMessageOpened,
  markAsSeen,
  sendImageMessage,
  sendTextMessage,
  uploadChatImage,
  type DmMessage,
} from "@/lib/chatClient";

function msgTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function isExpired(iso?: string | null) {
  return Boolean(iso && Date.now() > new Date(iso).getTime());
}

function isImageLocked(msg: DmMessage, isMe: boolean) {
  if (isExpired(msg.image_expires_at)) return true;
  return !isMe && msg.image_view_mode === "once" && Boolean(msg.image_viewed_at);
}

function ShareBubble({ msg, isMe }: { msg: DmMessage; isMe: boolean }) {
  const colors = useColors();
  const open = useCallback(() => {
    if (!msg.shared_url) return;
    if (msg.shared_kind === "news" && msg.shared_url.startsWith("app-news:")) {
      const id = msg.shared_url.replace("app-news:", "");
      router.push(`/news/${id}` as never);
      return;
    }
    WebBrowser.openBrowserAsync(msg.shared_url).catch(() => {});
  }, [msg.shared_kind, msg.shared_url]);

  return (
    <TouchableOpacity
      onPress={open}
      activeOpacity={0.85}
      disabled={!msg.shared_url}
      style={[
        styles.shareCard,
        {
          backgroundColor: isMe ? "rgba(255,255,255,0.16)" : colors.surface,
          borderColor: isMe ? "rgba(255,255,255,0.28)" : colors.border,
        },
      ]}
    >
      {msg.shared_image_url ? <Image source={{ uri: msg.shared_image_url }} style={styles.shareImage} /> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.shareKind, { color: isMe ? "rgba(255,255,255,0.78)" : colors.primary }]}>Shared {msg.shared_kind ?? "item"}</Text>
        <Text style={[styles.shareBubbleTitle, { color: isMe ? "#fff" : colors.foreground }]} numberOfLines={2}>{msg.shared_title ?? msg.content}</Text>
        {msg.shared_url ? <Text style={[styles.shareOpen, { color: isMe ? "#fff" : colors.primary }]}>Open</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

function ImageBubble({ msg, isMe }: { msg: DmMessage; isMe: boolean }) {
  const colors = useColors();
  const [visible, setVisible] = useState(false);
  const [left, setLeft] = useState(10);
  const [openedUrl, setOpenedUrl] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showImage = useCallback(() => {
    if (!msg.image_url || isImageLocked(msg, isMe)) return;
    setVisible(true);
    setOpenedUrl(msg.image_url);
    setLeft(10);
    if (!isMe && msg.image_view_mode === "once" && !msg.image_viewed_at) {
      markImageMessageOpened(msg.id).catch(() => {});
    }
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setLeft((v) => {
        if (v <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setVisible(false);
          setOpenedUrl(null);
          return 10;
        }
        return v - 1;
      });
    }, 1000);
  }, [isMe, msg]);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const expired = isImageLocked(msg, isMe);
  const label = msg.image_view_mode === "once" ? "One-time photo" : "24-hour photo";

  return (
    <>
      <Pressable onLongPress={showImage} onPress={showImage} style={[styles.photoBox, { backgroundColor: isMe ? "rgba(255,255,255,0.16)" : colors.surface, borderColor: isMe ? "rgba(255,255,255,0.25)" : colors.border }]}> 
        <View style={styles.photoLocked}>
          <Feather name={expired ? "slash" : "image"} size={28} color={isMe ? "#fff" : colors.primary} />
          <Text style={[styles.photoText, { color: isMe ? "#fff" : colors.foreground }]}>{expired ? "Photo expired" : label}</Text>
          {!expired ? <Text style={[styles.photoSub, { color: isMe ? "rgba(255,255,255,0.7)" : colors.mutedForeground }]}>Tap to open full screen</Text> : null}
        </View>
      </Pressable>
      <Modal visible={visible && Boolean(openedUrl)} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={styles.photoModal}>
          {openedUrl ? <Image source={{ uri: openedUrl }} style={styles.photoFull} resizeMode="contain" /> : null}
          <View style={styles.modalCountPill}><Text style={styles.countText}>{left}s</Text></View>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => {
              setVisible(false);
              setOpenedUrl(null);
            }}
          >
            <Feather name="x" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

function Bubble({ msg, isMe, otherColor }: { msg: DmMessage; isMe: boolean; otherColor: string }) {
  const colors = useColors();
  return (
    <View style={[styles.bubbleRow, { justifyContent: isMe ? "flex-end" : "flex-start" }]}> 
      {!isMe && <View style={[styles.msgAvatar, { backgroundColor: otherColor + "33" }]} />}
      <View style={[styles.bubbleWrap, { maxWidth: "78%" }]}> 
        <View
          style={[
            styles.bubble,
            isMe
              ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
              : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderBottomLeftRadius: 4 },
          ]}
        >
          {msg.message_type === "image" ? (
            <ImageBubble msg={msg} isMe={isMe} />
          ) : msg.message_type === "share" ? (
            <ShareBubble msg={msg} isMe={isMe} />
          ) : (
            <Text style={[styles.bubbleText, { color: isMe ? "#fff" : colors.foreground }]}>{msg.content}</Text>
          )}
        </View>
        <View style={[styles.bubbleMeta, { justifyContent: isMe ? "flex-end" : "flex-start" }]}> 
          <Text style={[styles.bubbleTime, { color: colors.mutedForeground }]}>{msgTime(msg.created_at)}</Text>
          {isMe && <Feather name={msg.is_seen ? "check-circle" : "check"} size={11} color={msg.is_seen ? colors.primary : colors.mutedForeground} />}
        </View>
      </View>
    </View>
  );
}

function TypingIndicator({ name }: { name: string }) {
  const colors = useColors();
  return (
    <View style={styles.typingRow}>
      <View style={[styles.typingDots, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <Text style={[styles.typingText, { color: colors.mutedForeground }]}>{name} is typing…</Text>
      </View>
    </View>
  );
}

export default function ConversationScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string; name: string; color: string; otherId: string; myId: string }>();
  const { id: conversationId, name: otherName, color: colorParam, myId } = params;
  const otherColor = colorParam ?? avatarColor(otherName ?? "?");

  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const flatRef = useRef<FlatList>(null);
  const bottomPad = insets.bottom + (Platform.OS === "web" ? 20 : 0);

  useEffect(() => {
    if (!conversationId) return;
    (async () => {
      await cleanupExpiredImageMessages().catch(() => {});
      const msgs = await getMessages(conversationId);
      setMessages(msgs);
      setLoading(false);
      if (myId) markAsSeen(conversationId, myId).catch(() => {});
    })();
  }, [conversationId, myId]);

  useEffect(() => {
    if (!conversationId) return;
    const sub = supabase
      .channel(`dm:${conversationId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "dm_messages", filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        const newMsg = payload.new as DmMessage;
        setMessages((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [newMsg, ...prev]));
        if (newMsg.sender_id !== myId && myId) markAsSeen(conversationId, myId).catch(() => {});
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "dm_messages", filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        const updated = payload.new as DmMessage;
        setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      })
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [conversationId, myId]);

  useEffect(() => {
    if (!conversationId || !myId) return;
    const ch = supabase.channel(`typing:${conversationId}`);
    typingChannelRef.current = ch;
    ch.on("broadcast", { event: "typing" }, ({ payload }) => {
      if (payload?.userId !== myId) {
        setOtherTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setOtherTyping(false), 3000);
      }
    }).subscribe();
    return () => {
      supabase.removeChannel(ch);
      typingChannelRef.current = null;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [conversationId, myId]);

  const broadcastTyping = useCallback(() => {
    typingChannelRef.current?.send({ type: "broadcast", event: "typing", payload: { userId: myId } });
  }, [myId]);

  const handleTextChange = useCallback((val: string) => {
    setText(val);
    broadcastTyping();
  }, [broadcastTyping]);

  const handleSend = useCallback(async () => {
    const content = text.trim();
    if (!content || !myId || !conversationId) return;
    setText("");
    setSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const optimistic: DmMessage = {
      id: `opt-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: myId,
      content,
      message_type: "text",
      image_url: null,
      image_expires_at: null,
      image_view_mode: null,
      image_viewed_at: null,
      image_storage_path: null,
      shared_kind: null,
      shared_title: null,
      shared_url: null,
      shared_image_url: null,
      is_seen: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [optimistic, ...prev]);
    try {
      const sent = await sendTextMessage(conversationId, myId, content);
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? sent : m)));
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setText(content);
      Alert.alert("Send failed", err instanceof Error ? err.message : "Could not send message");
    } finally {
      setSending(false);
    }
  }, [text, myId, conversationId]);

  const sendPickedPhoto = useCallback(async (viewMode: "once" | "24h") => {
    if (!myId || !conversationId || uploading) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow photo access to send disappearing images.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.72,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    setUploading(true);
    try {
      const upload = await uploadChatImage(conversationId, myId, result.assets[0].uri);
      const sent = await sendImageMessage(conversationId, myId, upload.publicUrl, upload.path, viewMode);
      setMessages((prev) => [sent, ...prev]);
    } catch (err) {
      Alert.alert("Photo failed", err instanceof Error ? err.message : "Could not send photo");
    } finally {
      setUploading(false);
    }
  }, [conversationId, myId, uploading]);

  const handlePickPhoto = useCallback(() => {
    // TODO: connect to image upload backend when storage bucket is configured
    Alert.alert("Image sharing coming soon", "You'll be able to send photos in a future update.");
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          title: otherName ?? "Chat",
          headerRight: () => (
            <View style={styles.onlineHeader}>
              <View style={[styles.onlineHeaderDot, { backgroundColor: "#22c55e" }]} />
              <Text style={[styles.onlineHeaderText, { color: colors.mutedForeground }]}>Online</Text>
            </View>
          ),
        }}
      />

      <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
        ) : (
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={(m) => m.id}
            inverted
            contentContainerStyle={[styles.messageList, { paddingBottom: 8 }]}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={otherTyping ? <TypingIndicator name={otherName ?? "User"} /> : null}
            renderItem={({ item }) => <Bubble msg={item} isMe={item.sender_id === myId} otherColor={otherColor} />}
            ListEmptyComponent={
              <View style={styles.emptyConv}>
                <View style={[styles.emptyConvIcon, { backgroundColor: otherColor + "22" }]}> 
                  <Text style={[styles.emptyConvEmoji, { color: otherColor }]}>{otherName?.[0]?.toUpperCase() ?? "?"}</Text>
                </View>
                <Text style={[styles.emptyConvText, { color: colors.mutedForeground }]}>Say hi to {otherName}!{"\n"}Send text, shared news/reels, or disappearing photos.</Text>
              </View>
            }
            removeClippedSubviews={Platform.OS === "android"}
            maxToRenderPerBatch={14}
            windowSize={8}
          />
        )}

        <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: bottomPad + 8 }]}> 
          <TouchableOpacity style={[styles.attachBtn, { backgroundColor: colors.muted }]} onPress={handlePickPhoto} activeOpacity={0.75}>
            <Feather name="image" size={19} color={colors.mutedForeground} />
          </TouchableOpacity>
          <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder={`Message ${otherName ?? ""}…`}
              placeholderTextColor={colors.mutedForeground}
              value={text}
              onChangeText={handleTextChange}
              multiline
              maxLength={1000}
              returnKeyType="default"
            />
          </View>
          <TouchableOpacity style={[styles.sendBtn, { backgroundColor: text.trim() ? colors.primary : colors.muted }]} onPress={handleSend} disabled={!text.trim() || sending} activeOpacity={0.85}>
            {sending ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="send" size={18} color={text.trim() ? "#fff" : colors.mutedForeground} />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  messageList: { paddingHorizontal: 12, paddingTop: 8 },
  bubbleRow: { flexDirection: "row", alignItems: "flex-end", marginVertical: 2, gap: 6 },
  msgAvatar: { width: 26, height: 26, borderRadius: 13 },
  bubbleWrap: { gap: 2 },
  bubble: { borderRadius: 18, paddingHorizontal: 10, paddingVertical: 8 },
  bubbleText: { fontSize: 15, lineHeight: 22, paddingHorizontal: 4, paddingVertical: 2 },
  bubbleMeta: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 4 },
  bubbleTime: { fontSize: 10 },
  typingRow: { paddingHorizontal: 12, paddingBottom: 4 },
  typingDots: { alignSelf: "flex-start", borderRadius: 16, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  typingText: { fontSize: 12, fontStyle: "italic" },
  emptyConv: { alignItems: "center", paddingTop: 60, paddingHorizontal: 30, gap: 14 },
  emptyConvIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  emptyConvEmoji: { fontSize: 32, fontWeight: "900" },
  emptyConvText: { fontSize: 14, textAlign: "center", lineHeight: 21 },
  inputBar: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 12, paddingTop: 10, gap: 8, borderTopWidth: 1 },
  inputWrap: { flex: 1, borderRadius: 22, borderWidth: 1, paddingHorizontal: 14, paddingVertical: Platform.OS === "ios" ? 10 : 6, maxHeight: 120 },
  input: { fontSize: 15, lineHeight: 22 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  attachBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  photoBox: { width: 208, height: 260, borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  photoPreview: { width: "100%", height: "100%" },
  photoLocked: { flex: 1, alignItems: "center", justifyContent: "center", padding: 14, gap: 8 },
  photoText: { fontSize: 14, fontWeight: "900", textAlign: "center" },
  photoSub: { fontSize: 11, fontWeight: "700", textAlign: "center" },
  countPill: { position: "absolute", top: 8, right: 8, backgroundColor: "rgba(0,0,0,0.65)", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  photoModal: { flex: 1, backgroundColor: "rgba(0,0,0,0.96)", alignItems: "center", justifyContent: "center" },
  photoFull: { width: "100%", height: "100%" },
  modalCountPill: { position: "absolute", top: 54, right: 18, backgroundColor: "rgba(0,0,0,0.68)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  modalClose: { position: "absolute", top: 46, left: 18, width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(0,0,0,0.54)", alignItems: "center", justifyContent: "center" },
  countText: { color: "#fff", fontSize: 11, fontWeight: "900" },
  shareCard: { width: 235, minHeight: 86, borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 10, padding: 10 },
  shareImage: { width: 66, height: 66, borderRadius: 10, backgroundColor: "#ddd" },
  shareKind: { fontSize: 10, fontWeight: "900", textTransform: "uppercase" },
  shareBubbleTitle: { fontSize: 13, fontWeight: "900", lineHeight: 18, marginTop: 2 },
  shareOpen: { fontSize: 11, fontWeight: "900", marginTop: 4 },
  onlineHeader: { flexDirection: "row", alignItems: "center", gap: 5, marginRight: 4 },
  onlineHeaderDot: { width: 7, height: 7, borderRadius: 3.5 },
  onlineHeaderText: { fontSize: 12 },
});
