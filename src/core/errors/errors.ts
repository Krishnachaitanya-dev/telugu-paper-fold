export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AuthError extends AppError {}
export class NetworkError extends AppError {}
export class NotFoundError extends AppError {}
export class ValidationError extends AppError {
  constructor(message: string, public readonly issues?: unknown[], cause?: unknown) {
    super('validation_error', message, cause);
  }
}
export class RateLimitError extends AppError {
  constructor(public readonly retryAfterMs: number) {
    super('rate_limit', `Rate limit exceeded. Retry in ${Math.ceil(retryAfterMs / 1000)}s`);
  }
}

export function fromSupabaseError(e: { code?: string; message: string }): AppError {
  if (e.code === 'PGRST116') return new NotFoundError('not_found', e.message, e);
  if (e.code === 'PGRST301' || e.code === '42501') return new AuthError('forbidden', e.message, e);
  if (e.code === 'PGRST200') return new ValidationError(e.message, undefined, e);
  // Server rate-limit trigger raises P0001 with a 'rate_limit_exceeded:' message.
  if (e.code === 'P0001' && e.message.includes('rate_limit_exceeded')) {
    return new RateLimitError(60_000);
  }
  // Unique-violation on a client_tag means a duplicate (idempotent) write — treat
  // as a benign conflict the caller can ignore.
  if (e.code === '23505') return new AppError('duplicate', e.message, e);
  return new NetworkError('supabase_error', e.message, e);
}
