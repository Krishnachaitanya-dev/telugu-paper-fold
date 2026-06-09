import { fetchReelRows } from './reelsRepository';
import type { Reel } from '../model/reel.schema';
import type { Result } from '@/core/result/result';

export async function fetchReels(): Promise<Result<Reel[]>> {
  return fetchReelRows();
}
