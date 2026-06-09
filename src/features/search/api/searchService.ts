import { env } from '@/core/env/env';
import { requestJson } from '@/core/http/apiClient';
import { ok, err } from '@/core/result/result';
import { fromSupabaseError } from '@/core/errors/errors';
import { zodParse } from '@/core/supabase/parse';
import { newsUpdateSchema } from '@/features/news/model/news.schema';
import type { NewsUpdate } from '@/features/news/model/news.schema';
import type { Result } from '@/core/result/result';

const BASE_HEADERS = () => ({
  apikey: env.supabaseAnonKey,
  Authorization: `Bearer ${env.supabaseAnonKey}`,
  'Content-Type': 'application/json',
});

export async function searchNews(query: string, limit = 30): Promise<Result<NewsUpdate[]>> {
  const q = query.trim();
  if (!q) return ok([]);

  try {
    const url = new URL(`${env.supabaseUrl}/rest/v1/news_updates`);
    url.searchParams.set('select', 'id,title,description,category,image_url,source_url,source_name,created_at,reporter_id,reporter_name');
    url.searchParams.set('search_vector', `wfts.${q}`);
    url.searchParams.set('order', 'created_at.desc');
    url.searchParams.set('limit', String(limit));

    const rows = await requestJson<unknown[]>(url.toString(), { headers: BASE_HEADERS() });
    return zodParse(newsUpdateSchema.array(), rows);
  } catch (e: unknown) {
    return err(fromSupabaseError(e as { code?: string; message: string }));
  }
}
