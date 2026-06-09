import type { LogTransport } from './logger';

export const consoleTransport: LogTransport = {
  debug: (msg, ctx) => console.debug(`[DEBUG] ${msg}`, ctx ?? ''),
  info:  (msg, ctx) => console.info(`[INFO]  ${msg}`, ctx ?? ''),
  warn:  (msg, ctx) => console.warn(`[WARN]  ${msg}`, ctx ?? ''),
  error: (msg, ctx) => console.error(`[ERROR] ${msg}`, ctx ?? ''),
};
