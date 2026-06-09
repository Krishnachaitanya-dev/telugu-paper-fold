import { describe, it, expect } from 'vitest';
import { ok, err, unwrapOrThrow, mapResult } from './result';

describe('Result', () => {
  it('ok() sets ok:true and value', () => {
    const r = ok(42);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe(42);
  });

  it('err() sets ok:false and error', () => {
    const e = new Error('fail');
    const r = err(e);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe(e);
  });

  it('unwrapOrThrow returns value on ok', () => {
    expect(unwrapOrThrow(ok('hello'))).toBe('hello');
  });

  it('unwrapOrThrow throws on err', () => {
    const e = new Error('boom');
    expect(() => unwrapOrThrow(err(e))).toThrow('boom');
  });

  it('mapResult transforms value on ok', () => {
    const r = mapResult(ok(5), (v) => v * 2);
    expect(unwrapOrThrow(r)).toBe(10);
  });

  it('mapResult passes error through on err', () => {
    const e = new Error('pass-through');
    const r = mapResult(err(e), () => 99);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe(e);
  });
});
