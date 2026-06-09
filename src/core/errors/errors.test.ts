import { describe, it, expect } from 'vitest';
import { fromSupabaseError, AuthError, NetworkError, NotFoundError, ValidationError, RateLimitError } from './errors';

describe('fromSupabaseError', () => {
  it('maps PGRST116 to NotFoundError', () => {
    const e = fromSupabaseError({ code: 'PGRST116', message: 'not found' });
    expect(e).toBeInstanceOf(NotFoundError);
    expect(e.code).toBe('not_found');
  });

  it('maps 42501 to AuthError', () => {
    const e = fromSupabaseError({ code: '42501', message: 'forbidden' });
    expect(e).toBeInstanceOf(AuthError);
  });

  it('maps unknown code to NetworkError', () => {
    const e = fromSupabaseError({ code: 'UNKNOWN', message: 'err' });
    expect(e).toBeInstanceOf(NetworkError);
    expect(e.code).toBe('supabase_error');
  });

  it('RateLimitError includes retryAfterMs', () => {
    const e = new RateLimitError(5000);
    expect(e.retryAfterMs).toBe(5000);
    expect(e.code).toBe('rate_limit');
  });

  it('ValidationError includes issues array', () => {
    const e = new ValidationError('bad input', [{ path: 'title', message: 'required' }]);
    expect(e.issues).toHaveLength(1);
  });
});
