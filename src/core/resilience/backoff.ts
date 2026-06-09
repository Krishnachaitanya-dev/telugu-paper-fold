/**
 * Exponential backoff with full jitter.
 * Prevents "retry storms" — many clients retrying in lockstep after an outage.
 * delay = random(0, min(cap, base * 2^attempt))
 */
export function backoffWithJitter(
  attempt: number,
  baseMs = 300,
  capMs = 10_000,
): number {
  const exp = Math.min(capMs, baseMs * 2 ** attempt);
  return Math.floor(Math.random() * exp);
}
