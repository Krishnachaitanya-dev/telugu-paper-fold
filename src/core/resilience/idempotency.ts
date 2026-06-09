/**
 * Client-generated idempotency keys.
 * Attaching a stable key to a write lets the server (or a unique constraint)
 * dedupe retries / double-taps. Insert the key into a column with a UNIQUE
 * index so a replayed insert is rejected instead of duplicated.
 */
export function idempotencyKey(): string {
  // RFC4122 v4-ish; crypto.randomUUID when available, else fallback.
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  if (g.crypto?.randomUUID) return g.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * In-memory guard: blocks the same logical action firing twice within a short
 * window (double-tap protection) before the request even leaves the device.
 */
const recent = new Map<string, number>();

export function guardDoubleSubmit(actionKey: string, windowMs = 1500): boolean {
  const now = Date.now();
  const last = recent.get(actionKey);
  if (last && now - last < windowMs) return false; // blocked
  recent.set(actionKey, now);
  // light cleanup
  if (recent.size > 200) {
    for (const [k, t] of recent) if (now - t > 10_000) recent.delete(k);
  }
  return true; // allowed
}
