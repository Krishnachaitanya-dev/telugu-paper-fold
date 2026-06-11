import { logger } from '../logger';
import { CircuitBreaker } from '../resilience/circuitBreaker';
import { coalesce } from '../resilience/coalesce';

const DEFAULT_TIMEOUT_MS = 12_000;

// One breaker per host keeps a failing Supabase from hanging every screen.
const breakers = new Map<string, CircuitBreaker>();

function breakerFor(url: string): CircuitBreaker {
  let host: string;
  try {
    host = new URL(url).host;
  } catch {
    host = 'default';
  }
  let b = breakers.get(host);
  if (!b) {
    b = new CircuitBreaker({ name: host, failureThreshold: 8, resetTimeoutMs: 5_000 });
    breakers.set(host, b);
  }
  return b;
}

async function doFetch<T>(url: string, init: RequestInit, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()) as T;
  } catch (error) {
    logger.warn('API request failed', {
      url,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function requestJson<T>(
  url: string,
  init: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase();
  const breaker = breakerFor(url);

  // Coalesce only idempotent GETs — never dedupe writes.
  if (method === 'GET') {
    const key = `${method}:${url}`;
    return coalesce(key, () => breaker.execute(() => doFetch<T>(url, init, timeoutMs)));
  }

  return breaker.execute(() => doFetch<T>(url, init, timeoutMs));
}
