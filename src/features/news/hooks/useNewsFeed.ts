import { useQuery } from '@tanstack/react-query';
import { unwrapOrThrow } from '@/core/result/result';
import { fetchNews } from '../api/newsService';

export const newsKeys = {
  all: ['news'] as const,
  feed: (category?: string, reporterIds?: string[]) =>
    ['news', 'feed', category, reporterIds] as const,
  detail: (id: string) => ['news', 'detail', id] as const,
};

export function useNewsFeed(category?: string, followedReporterIds: string[] = []) {
  return useQuery({
    queryKey: newsKeys.feed(category, followedReporterIds),
    queryFn: async () => unwrapOrThrow(await fetchNews(category, followedReporterIds)),
    staleTime: 60_000,
    retry: 1,
  });
}
