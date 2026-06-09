import { useQuery } from '@tanstack/react-query';
import { unwrapOrThrow } from '@/core/result/result';
import { fetchReels } from '../api/reelsService';

export const reelKeys = {
  all: ['reels'] as const,
  list: () => ['reels', 'list'] as const,
};

export function useReels() {
  return useQuery({
    queryKey: reelKeys.list(),
    queryFn: async () => unwrapOrThrow(await fetchReels()),
    staleTime: 5 * 60_000,
    retry: 1,
  });
}
