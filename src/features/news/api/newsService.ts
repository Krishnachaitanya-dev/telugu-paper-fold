import { fetchNewsRows, fetchNewsRowById } from './newsRepository';
import type { NewsUpdate } from '../model/news.schema';
import type { Result } from '@/core/result/result';

export async function fetchNews(
  category?: string,
  followedReporterIds: string[] = [],
): Promise<Result<NewsUpdate[]>> {
  return fetchNewsRows(category, followedReporterIds);
}

export async function fetchNewsById(id: string): Promise<Result<NewsUpdate | null>> {
  return fetchNewsRowById(id);
}
