export interface LogTransport {
  debug(msg: string, ctx?: Record<string, unknown>): void;
  info(msg: string, ctx?: Record<string, unknown>): void;
  warn(msg: string, ctx?: Record<string, unknown>): void;
  error(msg: string, ctx?: Record<string, unknown>): void;
}

const PII_PATTERNS = [
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, // JWT
  /https?:\/\/[^@]+@[^\s]+/g, // URLs with credentials
  /postgresql:\/\/[^\s]+/gi, // PG connection strings
];

function scrubPii(ctx?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!ctx) return ctx;
  const str = JSON.stringify(ctx);
  const scrubbed = PII_PATTERNS.reduce((s, p) => s.replace(p, '[REDACTED]'), str);
  try { return JSON.parse(scrubbed); } catch { return ctx; }
}

export class Logger {
  private transports: LogTransport[] = [];

  addTransport(t: LogTransport) { this.transports.push(t); }

  debug(msg: string, ctx?: Record<string, unknown>) {
    this.transports.forEach(t => t.debug(msg, scrubPii(ctx)));
  }
  info(msg: string, ctx?: Record<string, unknown>) {
    this.transports.forEach(t => t.info(msg, scrubPii(ctx)));
  }
  warn(msg: string, ctx?: Record<string, unknown>) {
    this.transports.forEach(t => t.warn(msg, scrubPii(ctx)));
  }
  error(msg: string, ctx?: Record<string, unknown>) {
    this.transports.forEach(t => t.error(msg, scrubPii(ctx)));
  }
}
