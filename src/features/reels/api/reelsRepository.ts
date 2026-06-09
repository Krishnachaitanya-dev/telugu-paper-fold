import { env } from '@/core/env/env';
import { requestJson } from '@/core/http/apiClient';
import { ok, err } from '@/core/result/result';
import { fromSupabaseError } from '@/core/errors/errors';
import { zodParse } from '@/core/supabase/parse';
import { reelSchema } from '../model/reel.schema';
import type { Reel } from '../model/reel.schema';
import type { Result } from '@/core/result/result';

const BASE_HEADERS = () => ({
  apikey: env.supabaseAnonKey,
  Authorization: `Bearer ${env.supabaseAnonKey}`,
  'Content-Type': 'application/json',
});

export async function fetchReelRows(): Promise<Result<Reel[]>> {
  try {
    const url = new URL(`${env.supabaseUrl}/rest/v1/reels`);
    url.searchParams.set('select', 'id,video_id,title,channel,tag,category,source_url,sort_order,created_at,is_short,aspect_ratio,duration_seconds,reporter_id,reporter_name,reporter_avatar_url');
    url.searchParams.set('order', 'created_at.desc');
    url.searchParams.set('limit', '120');
    const rows = await requestJson<unknown[]>(url.toString(), { headers: BASE_HEADERS() });
    return zodParse(reelSchema.array(), rows);
  } catch (e: unknown) {
    return err(fromSupabaseError(e as { code?: string; message: string }));
  }
}
