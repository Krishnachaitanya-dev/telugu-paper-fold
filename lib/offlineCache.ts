import AsyncStorage from "@react-native-async-storage/async-storage";
import type { NewsUpdate, Reel } from "./supabase";
import { filterNewsByCategory } from "./newsCategories";

const CACHE_KEY = "offline_news_v2";
const CACHE_TS_KEY = "offline_news_ts_v2";
const REELS_CACHE_KEY = "offline_reels_v1";
const REELS_CACHE_TS_KEY = "offline_reels_ts_v1";
const MAX_ARTICLES = 200;
const MAX_REELS = 80;

export interface CacheResult {
  articles: NewsUpdate[];
  cachedAt: Date | null;
}

export interface ReelsCacheResult {
  reels: Reel[];
  cachedAt: Date | null;
}

const NEWS_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function getCachedNews(): Promise<CacheResult> {
  try {
    const [json, tsStr] = await Promise.all([
      AsyncStorage.getItem(CACHE_KEY),
      AsyncStorage.getItem(CACHE_TS_KEY),
    ]);
    const raw: NewsUpdate[] = json ? JSON.parse(json) : [];
    const cutoff = Date.now() - NEWS_MAX_AGE_MS;
    // Strip articles older than 24h — never show yesterday's news from cache
    const articles = raw.filter((a) => new Date(a.created_at).getTime() > cutoff);
    const cachedAt = tsStr ? new Date(tsStr) : null;
    return { articles, cachedAt };
  } catch {
    return { articles: [], cachedAt: null };
  }
}

export async function cacheNews(articles: NewsUpdate[]): Promise<void> {
  try {
    const toStore = articles.slice(0, MAX_ARTICLES);
    await Promise.all([
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(toStore)),
      AsyncStorage.setItem(CACHE_TS_KEY, new Date().toISOString()),
    ]);
  } catch {
    // silently fail — offline cache is best-effort
  }
}

export async function getCachedReels(): Promise<ReelsCacheResult> {
  try {
    const [json, tsStr] = await Promise.all([
      AsyncStorage.getItem(REELS_CACHE_KEY),
      AsyncStorage.getItem(REELS_CACHE_TS_KEY),
    ]);
    const reels: Reel[] = json ? JSON.parse(json) : [];
    const cachedAt = tsStr ? new Date(tsStr) : null;
    return { reels, cachedAt };
  } catch {
    return { reels: [], cachedAt: null };
  }
}

export async function cacheReels(reels: Reel[]): Promise<void> {
  try {
    const toStore = reels.slice(0, MAX_REELS);
    await Promise.all([
      AsyncStorage.setItem(REELS_CACHE_KEY, JSON.stringify(toStore)),
      AsyncStorage.setItem(REELS_CACHE_TS_KEY, new Date().toISOString()),
    ]);
  } catch {
    // silently fail — offline cache is best-effort
  }
}

export function filterCached(articles: NewsUpdate[], category: string): NewsUpdate[] {
  return filterNewsByCategory(articles, category);
}

export function formatCacheAge(cachedAt: Date | null): string {
  if (!cachedAt) return "unknown";
  const diff = Date.now() - cachedAt.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
