import { fetchLiveChannelRows } from './liveRepository';
import type { LiveChannel } from '../model/liveChannel.schema';
import type { Result } from '@/core/result/result';

export async function fetchLiveChannels(): Promise<Result<LiveChannel[]>> {
  return fetchLiveChannelRows();
}
