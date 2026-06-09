import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '@/core/supabase/supabaseClient';
import { CHAT_IMAGES_BUCKET } from '../model/chat.schema';

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function base64ToUint8Array(base64: string): Uint8Array {
  const clean = base64.replace(/=+$/, '');
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

export async function uploadChatImage(
  conversationId: string,
  senderId: string,
  uri: string,
): Promise<{ publicUrl: string; path: string }> {
  const ext = uri.split('?')[0].split('.').pop()?.toLowerCase() || 'jpg';
  const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
  const path = `${conversationId}/${senderId}-${Date.now()}.${ext === 'png' ? 'png' : 'jpg'}`;

  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });

  const { error } = await supabase.storage
    .from(CHAT_IMAGES_BUCKET)
    .upload(path, base64ToUint8Array(base64), { contentType, upsert: false });
  if (error) throw error;

  const { data, error: signError } = await supabase.storage
    .from(CHAT_IMAGES_BUCKET)
    .createSignedUrl(path, 24 * 60 * 60);
  if (signError || !data?.signedUrl) throw signError ?? new Error('Could not create signed URL');
  return { publicUrl: data.signedUrl, path };
}

export async function getSignedChatImageUrl(
  path: string,
  expiresInSeconds = 3600,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(CHAT_IMAGES_BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error) return null;
  return data?.signedUrl ?? null;
}
