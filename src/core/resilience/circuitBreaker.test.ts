import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CircuitBreaker } from './circuitBreaker';

describe('CircuitBreaker', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const make = () =>
    new CircuitBreaker({ name: 'test', failureThreshold: 3, resetTimeoutMs: 30_000 });

  it('starts closed', () => {
    expect(make().getState()).toBe('closed');
  });

  it('passes through successful calls', async () => {
    const cb = make();
    const r = await cb.execute(() => Promise.resolve('ok'));
    expect(r).toBe('ok');
    expect(cb.getState()).toBe('closed');
  });

  it('opens after threshold consecutive failures', async () => {
    const cb = make();
    const fail = () => cb.execute(() => Promise.reject(new Error('x'))).catch(() => {});
    await fail(); await fail(); await fail();
    expect(cb.getState()).toBe('open');
  });

  it('rejects immediately while open', async () => {
    const cb = make();
    const fail = () => cb.execute(() => Promise.reject(new Error('x'))).catch(() => {});
    await fail(); await fail(); await fail();
    await expect(cb.execute(() => Promise.resolve('should not run'))).rejects.toThrow(/is open/);
  });

  it('transitions to half-open after reset timeout, then closed on success', async () => {
    const cb = make();
    const fail = () => cb.execute(() => Promise.reject(new Error('x'))).catch(() => {});
    await fail(); await fail(); await fail();
    expect(cb.getState()).toBe('open');

    vi.advanceTimersByTime(30_001);
    const r = await cb.execute(() => Promise.resolve('recovered'));
    expect(r).toBe('recovered');
    expect(cb.getState()).toBe('closed');
  });

  it('success resets failure count', async () => {
    const cb = make();
    await cb.execute(() => Promise.reject(new Error('x'))).catch(() => {});
    await cb.execute(() => Promise.reject(new Error('x'))).catch(() => {});
    await cb.execute(() => Promise.resolve('ok')); // resets
    await cb.execute(() => Promise.reject(new Error('x'))).catch(() => {});
    expect(cb.getState()).toBe('closed'); // only 1 failure since reset
  });
});
