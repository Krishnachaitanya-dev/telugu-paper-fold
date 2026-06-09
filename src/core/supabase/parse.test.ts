import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { zodParse } from './parse';
import { ValidationError } from '../errors/errors';

const schema = z.object({ id: z.string(), name: z.string() });

describe('zodParse', () => {
  it('returns ok on valid data', () => {
    const r = zodParse(schema, { id: '1', name: 'test' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.name).toBe('test');
  });

  it('returns err(ValidationError) on invalid data', () => {
    const r = zodParse(schema, { id: 123 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBeInstanceOf(ValidationError);
  });

  it('parses arrays', () => {
    const r = zodParse(schema.array(), [{ id: '1', name: 'a' }, { id: '2', name: 'b' }]);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toHaveLength(2);
  });
});
