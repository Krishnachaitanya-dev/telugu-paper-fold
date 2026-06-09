import { env } from '@/core/env/env';
import { requestJson } from '@/core/http/apiClient';
import { ok, err } from '@/core/result/result';
import { fromSupabaseError } from '@/core/errors/errors';
import { zodParse } from '@/core/supabase/parse';
import { newsUpdateSchema } from '../model/news.schema';
import type { NewsUpdate } from '../model/news.schema';
import type { Result } from '@/core/result/result';

const BASE_HEADERS = () => ({
  apikey: env.supabaseAnonKey,
  Authorization: `Bearer ${env.supabaseAnonKey}`,
  'Content-Type': 'application/json',
});

async function selectRows<T>(table: string, params: Record<string, string>): Promise<T[]> {
  const url = new URL(`${env.supabaseUrl}/rest/v1/${table}`);
  url.searchParams.set('select', '*');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return requestJson<T[]>(url.toString(), { headers: BASE_HEADERS() });
}

export async function fetchNewsRows(
  category?: string,
  followedReporterIds: string[] = [],
): Promise<Result<NewsUpdate[]>> {
  try {
    const isReporterFilter = category === 'Reporters';
    const isFollowingFilter = category === 'Following';
    if (isFollowingFilter && followedReporterIds.length === 0) return ok([]);

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const rows = await selectRows<unknown>('news_updates', {
      select: 'id,title,description,category,image_url,source_url,source_name,created_at,reporter_id,reporter_name,reporter_avatar_url,fact_check_status',
      order: 'created_at.desc',
      limit: category && category !== 'All' ? '100' : '150',
      created_at: `gte.${cutoff}`,
      ...(isReporterFilter
        ? { reporter_id: 'not.is.null' }
        : isFollowingFilter
          ? { reporter_id: `in.(${followedReporterIds.join(',')})` }
          : category && category !== 'All'
            ? { category: `ilike.${category}` }
            : {}),
    });

    return zodParse(newsUpdateSchema.array(), rows);
  } catch (e: unknown) {
    return err(fromSupabaseError(e as { code?: string; message: string }));
  }
}

export async function fetchNewsRowById(id: string): Promise<Result<NewsUpdate | null>> {
  try {
    const rows = await selectRows<unknown>('news_updates', {
      select: 'id,title,description,category,image_url,source_url,source_name,created_at,reporter_id,reporter_name,reporter_avatar_url',
      id: `eq.${id}`,
      limit: '1',
    });
    const result = zodParse(newsUpdateSchema.array(), rows);
    if (!result.ok) return result;
    return ok(result.value[0] ?? null);
  } catch (e: unknown) {
    return err(fromSupabaseError(e as { code?: string; message: string }));
  }
}
