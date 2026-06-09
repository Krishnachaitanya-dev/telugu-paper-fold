/**
 * Auth-backed 1-to-1 chat client using Supabase.
 * Run supabase-chat-schema.sql from the patch zip once before testing chat.
 */
import * as FileSystem from "expo-file-system/legacy";

import { supabase } from "./supabaseClient";
import { assertSafeMessage, sanitizePlainText } from "@/lib/security/inputValidation";
import { assertClientRateLimit } from "@/lib/security/rateLimiter";

export const CHAT_IMAGES_BUCKET = "chat-images";

const AVATAR_COLORS = [
  "#0a9b9a", "#7047c7", "#ff4f87", "#ff9f40",
  "#22c55e", "#3b82f6", "#f59e0b", "#e11d48",
];

export type MessageType = "text" | "image" | "share";
export type SharedKind = "news" | "reel" | "live" | null;

export interface ChatUser {
  id: string;
  username: string;
  display_name: string;
  avatar_color: string;
  is_online: boolean;
  last_seen_at: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  other_user?: ChatUser;
}

export interface DmMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  message_type: MessageType;
  image_url: string | null;
  image_expires_at: string | null;
  image_view_mode?: "once" | "24h" | null;
  image_viewed_at?: string | null;
  image_storage_path?: string | null;
  shared_kind: SharedKind;
  shared_title: string | null;
  shared_url: string | null;
  shared_image_url: string | null;
  is_seen: boolean;
  created_at: string;
}

export interface ShareDraft {
  kind: "news" | "reel" | "live";
  title: string;
  url?: string | null;
  imageUrl?: string | null;
}

const BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function base64ToUint8Array(base64: string) {
  const clean = base64.replace(/=+$/, "");
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;

  for (const char of clean) {
    const value = BASE64_CHARS.indexOf(char);
    if (value < 0) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }

  return new Uint8Array(bytes);
}

export function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export function initials(name?: string | null): string {
  const clean = (name ?? "User").trim();
  return clean
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "U";
}

export function formatTimeShort(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return "now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function normalizeUsername(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);
}

export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function getMyProfile(): Promise<ChatUser | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const { data, error } = await supabase
    .from("chat_users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) return null;
  return (data as ChatUser | null) ?? null;
}

export async function registerOrUpdateUser(
  userId: string,
  displayName: string,
  username: string
): Promise<ChatUser> {
  const cleanUsername = normalizeUsername(username || displayName);
  const color = avatarColor(displayName || cleanUsername);
  const { data, error } = await supabase
    .from("chat_users")
    .upsert(
      {
        id: userId,
        username: cleanUsername,
        display_name: displayName.trim() || cleanUsername,
        avatar_color: color,
        is_online: true,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select()
    .single();
  if (error) throw error;
  return data as ChatUser;
}

export async function fetchAvailableUsers(excludeId: string): Promise<ChatUser[]> {
  const { data, error } = await supabase
    .from("chat_users")
    .select("*")
    .neq("id", excludeId)
    .order("last_seen_at", { ascending: false, nullsFirst: false })
    .limit(100);
  if (error) return [];
  return (data as ChatUser[]) ?? [];
}

export async function searchUsers(query: string, excludeId: string): Promise<ChatUser[]> {
  const q = query.trim();
  if (!q) return fetchAvailableUsers(excludeId);
  const { data } = await supabase
    .from("chat_users")
    .select("*")
    .neq("id", excludeId)
    .or(`display_name.ilike.%${q}%,username.ilike.%${q}%`)
    .limit(50);
  return (data as ChatUser[]) ?? [];
}

export async function setOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
  await supabase
    .from("chat_users")
    .update({ is_online: isOnline, last_seen_at: new Date().toISOString() })
    .eq("id", userId);
}

export async function getOrCreateConversation(myId: string, otherId: string): Promise<Conversation> {
  const [u1, u2] = [myId, otherId].sort();

  const { data: existing } = await supabase
    .from("conversations")
    .select("*")
    .eq("user1_id", u1)
    .eq("user2_id", u2)
    .maybeSingle();

  if (existing) return existing as Conversation;

  const { data, error } = await supabase
    .from("conversations")
    .insert({ user1_id: u1, user2_id: u2 })
    .select()
    .single();
  if (error) throw error;
  return data as Conversation;
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*, user1:user1_id(*), user2:user2_id(*)")
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (error) return [];

  return ((data ?? []) as (Conversation & { user1: ChatUser; user2: ChatUser })[]).map(
    (conv) => ({ ...conv, other_user: conv.user1_id === userId ? conv.user2 : conv.user1 })
  );
}

export async function getMessages(conversationId: string, limit = 80): Promise<DmMessage[]> {
  const { data } = await supabase
    .from("dm_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as DmMessage[]) ?? [];
}

async function updateConversationLast(conversationId: string, lastMessage: string) {
  await supabase
    .from("conversations")
    .update({ last_message: lastMessage, last_message_at: new Date().toISOString() })
    .eq("id", conversationId);
}

export async function sendTextMessage(conversationId: string, senderId: string, content: string): Promise<DmMessage> {
  const safeContent = assertSafeMessage(content);
  await assertClientRateLimit(`chat-text:${senderId}`, 20, 60_000);
  const { data, error } = await supabase
    .from("dm_messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, content: safeContent, message_type: "text" })
    .select()
    .single();
  if (error) throw error;
  updateConversationLast(conversationId, safeContent.slice(0, 120)).catch(() => {});
  return data as DmMessage;
}

export async function sendShareMessage(
  conversationId: string,
  senderId: string,
  draft: ShareDraft
): Promise<DmMessage> {
  await assertClientRateLimit(`chat-share:${senderId}`, 12, 60_000);
  const label = draft.kind === "reel" ? "Shared reel" : draft.kind === "live" ? "Shared live channel" : "Shared news";
  const safeTitle = sanitizePlainText(draft.title, 280);
  const { data, error } = await supabase
    .from("dm_messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content: label,
      message_type: "share",
      shared_kind: draft.kind,
      shared_title: safeTitle,
      shared_url: draft.url ?? null,
      shared_image_url: draft.imageUrl ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  updateConversationLast(conversationId, `${label}: ${safeTitle}`.slice(0, 120)).catch(() => {});
  return data as DmMessage;
}

export async function sendImageMessage(
  conversationId: string,
  senderId: string,
  imageUrl: string,
  imageStoragePath: string,
  viewMode: "once" | "24h"
): Promise<DmMessage> {
  await assertClientRateLimit(`chat-image:${senderId}`, 6, 60_000);
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("dm_messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content: viewMode === "once" ? "One-time photo" : "24-hour photo",
      message_type: "image",
      image_url: imageUrl,
      image_expires_at: expires,
      image_view_mode: viewMode,
      image_storage_path: imageStoragePath,
    })
    .select()
    .single();
  if (error) throw error;
  updateConversationLast(conversationId, viewMode === "once" ? "One-time photo" : "24-hour photo").catch(() => {});
  return data as DmMessage;
}

export async function markAsSeen(conversationId: string, myId: string): Promise<void> {
  await supabase
    .from("dm_messages")
    .update({ is_seen: true })
    .eq("conversation_id", conversationId)
    .neq("sender_id", myId)
    .eq("is_seen", false);
}

export async function markImageMessageOpened(messageId: string): Promise<DmMessage | null> {
  const { data, error } = await supabase.rpc("mark_dm_image_opened", { message_id: messageId });
  if (error) return null;
  return (Array.isArray(data) ? data[0] : data) as DmMessage | null;
}

export async function cleanupExpiredImageMessages(): Promise<void> {
  await supabase.rpc("cleanup_expired_dm_images");
}

export async function uploadChatImage(
  conversationId: string,
  senderId: string,
  uri: string
): Promise<{ publicUrl: string; path: string }> {
  const ext = uri.split("?")[0].split(".").pop()?.toLowerCase() || "jpg";
  const contentType = ext === "png" ? "image/png" : "image/jpeg";
  const path = `${conversationId}/${senderId}-${Date.now()}.${ext === "png" ? "png" : "jpg"}`;

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: "base64",
  });

  const { error } = await supabase.storage
    .from(CHAT_IMAGES_BUCKET)
    .upload(path, base64ToUint8Array(base64), { contentType, upsert: false });
  if (error) throw error;

  const { data, error: signError } = await supabase.storage
    .from(CHAT_IMAGES_BUCKET)
    .createSignedUrl(path, 24 * 60 * 60);
  if (signError || !data?.signedUrl) throw signError ?? new Error("Could not create signed URL");
  return { publicUrl: data.signedUrl, path };
}


export async function getSignedChatImageUrl(path: string, expiresInSeconds = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage.from(CHAT_IMAGES_BUCKET).createSignedUrl(path, expiresInSeconds);
  if (error) return null;
  return data?.signedUrl ?? null;
}
