import * as Sentry from '@sentry/react-native';
import type { LogTransport } from './logger';
import type { AppError } from '../errors/errors';

export const sentryTransport: LogTransport = {
  debug: () => {},
  info:  (msg, ctx) => Sentry.addBreadcrumb({ message: msg, data: ctx, level: 'info' }),
  warn:  (msg, ctx) => Sentry.addBreadcrumb({ message: msg, data: ctx, level: 'warning' }),
  error: (msg, ctx) => {
    const e = ctx?.error;
    if (e instanceof Error) {
      Sentry.captureException(e, {
        tags: { code: (e as AppError).code },
        extra: ctx,
      });
    } else {
      Sentry.captureMessage(msg, { level: 'error', extra: ctx });
    }
  },
};
