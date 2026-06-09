import * as FileSystem from "expo-file-system/legacy";

import { supabase } from "./supabaseClient";
import { sanitizePlainText } from "@/lib/security/inputValidation";
import { assertClientRateLimit } from "@/lib/security/rateLimiter";

export const REPORTER_NEWS_IMAGES_BUCKET = "reporter-news-images";

export interface ReporterProfile {
  id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  created_at?: string;
  updated_at?: string;
}

async function getSessionUserId(): Promise<string | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session?.user.id) return sessionData.session.user.id;

  const { data: userData } = await supabase.auth.getUser();
  return userData.user?.id ?? null;
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

export async function getMyReporterProfile(): Promise<ReporterProfile | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const { data } = await supabase
    .from("reporter_profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  return (data as ReporterProfile | null) ?? null;
}

export async function upsertReporterProfile(profile: {
  displayName: string;
  bio?: string;
  avatarUrl?: string | null;
}): Promise<ReporterProfile> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const userId = userData.user?.id;
  if (!userId) throw new Error("Login required");

  const { data, error } = await supabase
    .from("reporter_profiles")
    .upsert(
      {
        id: userId,
        display_name: sanitizePlainText(profile.displayName, 80),
        bio: profile.bio ? sanitizePlainText(profile.bio, 280) : null,
        avatar_url: profile.avatarUrl || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select()
    .single();
  if (error) throw error;
  return data as ReporterProfile;
}

export async function uploadReporterNewsImage(uri: string): Promise<string> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const userId = userData.user?.id;
  if (!userId) throw new Error("Login required");

  await assertClientRateLimit(`reporter-image:${userId}`, 8, 60_000);
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: "base64",
  });
  const ext = uri.split("?")[0].split(".").pop()?.toLowerCase() === "png" ? "png" : "jpg";
  const contentType = ext === "png" ? "image/png" : "image/jpeg";
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(REPORTER_NEWS_IMAGES_BUCKET)
    .upload(path, base64ToUint8Array(base64), { contentType, upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from(REPORTER_NEWS_IMAGES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function getReporterFollowState(reporterId: string) {
  const userId = await getSessionUserId();
  if (!userId || userId === reporterId) {
    const { count } = await supabase
      .from("reporter_follows")
      .select("*", { count: "exact", head: true })
      .eq("reporter_id", reporterId);
    return { following: false, followerCount: count ?? 0, canFollow: false, isSelf: userId === reporterId };
  }

  const [{ data }, { count }] = await Promise.all([
    supabase
      .from("reporter_follows")
      .select("reporter_id")
      .eq("reporter_id", reporterId)
      .eq("follower_id", userId)
      .maybeSingle(),
    supabase
      .from("reporter_follows")
      .select("*", { count: "exact", head: true })
      .eq("reporter_id", reporterId),
  ]);

  return { following: Boolean(data), followerCount: count ?? 0, canFollow: true, isSelf: false };
}

export async function getFollowedReporterIds(): Promise<string[]> {
  const userId = await getSessionUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("reporter_follows")
    .select("reporter_id")
    .eq("follower_id", userId);
  if (error) return [];
  return (data ?? []).map((row) => row.reporter_id as string).filter(Boolean);
}

export async function toggleReporterFollow(reporterId: string, following: boolean) {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("Login required");
  if (userId === reporterId) throw new Error("You cannot follow your own reporter profile.");

  if (following) {
    const { error } = await supabase
      .from("reporter_follows")
      .delete()
      .eq("reporter_id", reporterId)
      .eq("follower_id", userId);
    if (error) throw error;
    return;
  }

  await assertClientRateLimit(`reporter-follow:${userId}`, 20, 60_000);
  const { error } = await supabase
    .from("reporter_follows")
    .insert({ reporter_id: reporterId, follower_id: userId });
  if (error) throw error;
}
