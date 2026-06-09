import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { idempotencyKey, guardDoubleSubmit } from './idempotency';

describe('idempotencyKey', () => {
  it('returns a uuid-shaped string', () => {
    const k = idempotencyKey();
    expect(k).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('returns unique values', () => {
    expect(idempotencyKey()).not.toBe(idempotencyKey());
  });
});

describe('guardDoubleSubmit', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('allows first submit, blocks rapid repeat', () => {
    const key = `act:${Math.random()}`;
    expect(guardDoubleSubmit(key, 1500)).toBe(true);
    expect(guardDoubleSubmit(key, 1500)).toBe(false);
  });

  it('allows again after the window passes', () => {
    const key = `act:${Math.random()}`;
    expect(guardDoubleSubmit(key, 1500)).toBe(true);
    vi.advanceTimersByTime(1600);
    expect(guardDoubleSubmit(key, 1500)).toBe(true);
  });
});
