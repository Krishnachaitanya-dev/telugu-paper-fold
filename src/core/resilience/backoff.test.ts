import { describe, it, expect, vi, afterEach } from 'vitest';
import { backoffWithJitter } from './backoff';

describe('backoffWithJitter', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns 0 when random is 0', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(backoffWithJitter(0, 300, 10_000)).toBe(0);
  });

  it('caps the exponential ceiling', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999999);
    // attempt 10 -> base*2^10 = 307200, capped to 10000
    expect(backoffWithJitter(10, 300, 10_000)).toBeLessThanOrEqual(10_000);
  });

  it('grows with attempt number', () => {
    vi.spyOn(Math, 'random').mockReturnValue(1);
    const a0 = backoffWithJitter(0, 300, 100_000);
    const a3 = backoffWithJitter(3, 300, 100_000);
    expect(a3).toBeGreaterThan(a0);
  });
});
