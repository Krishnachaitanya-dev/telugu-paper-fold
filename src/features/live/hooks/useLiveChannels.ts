import { useQuery } from '@tanstack/react-query';
import { unwrapOrThrow } from '@/core/result/result';
import { fetchLiveChannels } from '../api/liveService';

export const liveKeys = {
  all: ['live'] as const,
  channels: () => ['live', 'channels'] as const,
};

export function useLiveChannels() {
  return useQuery({
    queryKey: liveKeys.channels(),
    queryFn: async () => unwrapOrThrow(await fetchLiveChannels()),
    staleTime: 2 * 60_000,
    retry: 1,
  });
}
