import { z } from 'zod';
import { ok, err } from '../result/result';
import { ValidationError } from '../errors/errors';
import type { Result } from '../result/result';

export function zodParse<T>(
  schema: z.ZodType<T>,
  data: unknown,
): Result<T, ValidationError> {
  const result = schema.safeParse(data);
  if (result.success) return ok(result.data);
  return err(
    new ValidationError(
      'Schema validation failed',
      result.error.issues,
      result.error,
    ),
  );
}
