import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '@/core/supabase/supabaseClient';
import { assertClientRateLimit } from '@/lib/security/rateLimiter';
import { ok, err } from '@/core/result/result';
import { AuthError, NetworkError } from '@/core/errors/errors';
import { REPORTER_NEWS_IMAGES_BUCKET } from '../model/reporter.schema';
import type { Result } from '@/core/result/result';

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function base64ToUint8Array(base64: string): Uint8Array {
  const clean = base64.replace(/=+$/, '');
  const bytes: number[] = [];
  let buffer = 0, bits = 0;
  for (const char of clean) {
    const value = BASE64_CHARS.indexOf(char);
    if (value < 0) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) { bits -= 8; bytes.push((buffer >> bits) & 0xff); }
  }
  return new Uint8Array(bytes);
}

export async function uploadReporterNewsImage(uri: string): Promise<Result<string>> {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) return err(new AuthError('auth_failed', userError.message, userError));
    const userId = userData.user?.id;
    if (!userId) return err(new AuthError('no_user', 'Login required'));

    await assertClientRateLimit(`reporter-image:${userId}`, 8, 60_000);

    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
    const ext = uri.split('?')[0].split('.').pop()?.toLowerCase() === 'png' ? 'png' : 'jpg';
    const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
    const path = `${userId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from(REPORTER_NEWS_IMAGES_BUCKET)
      .upload(path, base64ToUint8Array(base64), { contentType, upsert: false });
    if (error) return err(new NetworkError('upload_failed', error.message, error));

    const { data } = supabase.storage.from(REPORTER_NEWS_IMAGES_BUCKET).getPublicUrl(path);
    return ok(data.publicUrl);
  } catch (e) {
    return err(new NetworkError('unknown', String(e), e));
  }
}
