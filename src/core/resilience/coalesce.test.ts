import { describe, it, expect, vi } from 'vitest';
import { coalesce } from './coalesce';

describe('coalesce', () => {
  it('shares one in-flight promise for the same key', async () => {
    const fn = vi.fn(() => new Promise((res) => setTimeout(() => res('value'), 20)));
    const [a, b] = await Promise.all([coalesce('k', fn), coalesce('k', fn)]);
    expect(a).toBe('value');
    expect(b).toBe('value');
    expect(fn).toHaveBeenCalledTimes(1); // deduped
  });

  it('runs separate calls for different keys', async () => {
    const fn = vi.fn(() => Promise.resolve('v'));
    await Promise.all([coalesce('a', fn), coalesce('b', fn)]);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('allows a new call after the previous settles', async () => {
    const fn = vi.fn(() => Promise.resolve('v'));
    await coalesce('k', fn);
    await coalesce('k', fn);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
