import AsyncStorage from "@react-native-async-storage/async-storage";

type Bucket = { count: number; resetAt: number };

export async function assertClientRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<void> {
  const now = Date.now();
  const storageKey = `rate-limit:${key}`;
  const raw = await AsyncStorage.getItem(storageKey);
  const bucket: Bucket = raw ? JSON.parse(raw) : { count: 0, resetAt: now + windowMs };

  const active = bucket.resetAt > now ? bucket : { count: 0, resetAt: now + windowMs };
  if (active.count >= limit) {
    const wait = Math.ceil((active.resetAt - now) / 1000);
    throw new Error(`Too many actions. Try again in ${wait}s.`);
  }

  await AsyncStorage.setItem(
    storageKey,
    JSON.stringify({ count: active.count + 1, resetAt: active.resetAt })
  );
}
