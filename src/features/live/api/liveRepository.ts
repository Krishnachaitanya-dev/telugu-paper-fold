import { env } from '@/core/env/env';
import { requestJson } from '@/core/http/apiClient';
import { ok, err } from '@/core/result/result';
import { fromSupabaseError } from '@/core/errors/errors';
import { zodParse } from '@/core/supabase/parse';
import { liveChannelSchema } from '../model/liveChannel.schema';
import type { LiveChannel } from '../model/liveChannel.schema';
import type { Result } from '@/core/result/result';

const BASE_HEADERS = () => ({
  apikey: env.supabaseAnonKey,
  Authorization: `Bearer ${env.supabaseAnonKey}`,
  'Content-Type': 'application/json',
});

export async function fetchLiveChannelRows(): Promise<Result<LiveChannel[]>> {
  try {
    const url = new URL(`${env.supabaseUrl}/rest/v1/live_channels`);
    url.searchParams.set('select', 'id,channel_name,badge,description,video_id,official_url,logo_url,is_active,sort_order');
    url.searchParams.set('order', 'sort_order.asc');
    url.searchParams.set('limit', '30');
    const rows = await requestJson<unknown[]>(url.toString(), { headers: BASE_HEADERS() });
    return zodParse(liveChannelSchema.array(), rows);
  } catch (e: unknown) {
    return err(fromSupabaseError(e as { code?: string; message: string }));
  }
}
