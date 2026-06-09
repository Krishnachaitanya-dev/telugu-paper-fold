/**
 * Request coalescing (a.k.a. single-flight).
 * Concurrent calls with the same key share one in-flight promise.
 * Stops a thundering herd of identical requests (e.g. tab re-mounts firing
 * the same news fetch). React Query dedupes by queryKey, but this guards the
 * raw HTTP layer too, including non-RQ callers.
 */
const inflight = new Map<string, Promise<unknown>>();

export function coalesce<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;

  const promise = fn().finally(() => {
    inflight.delete(key);
  });
  inflight.set(key, promise);
  return promise;
}
