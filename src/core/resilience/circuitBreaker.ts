import { logger } from '../logger';

export type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitOptions {
  failureThreshold: number;   // trips after this many consecutive failures
  resetTimeoutMs: number;     // time before open -> half-open
  name: string;
}

/**
 * Circuit breaker — prevents hammering a failing dependency.
 * closed: calls pass through. On `failureThreshold` consecutive failures -> open.
 * open: calls rejected immediately for `resetTimeoutMs`, then -> half-open.
 * half-open: one trial call allowed. Success -> closed. Failure -> open again.
 */
export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures = 0;
  private nextAttemptAt = 0;

  constructor(private readonly opts: CircuitOptions) {}

  getState(): CircuitState {
    return this.state;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() < this.nextAttemptAt) {
        throw new Error(`Circuit "${this.opts.name}" is open`);
      }
      this.state = 'half-open';
      logger.warn('circuit half-open', { name: this.opts.name });
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (e) {
      this.onFailure();
      throw e;
    }
  }

  private onSuccess() {
    this.failures = 0;
    if (this.state !== 'closed') {
      this.state = 'closed';
      logger.info('circuit closed', { name: this.opts.name });
    }
  }

  private onFailure() {
    this.failures += 1;
    if (this.state === 'half-open' || this.failures >= this.opts.failureThreshold) {
      this.state = 'open';
      this.nextAttemptAt = Date.now() + this.opts.resetTimeoutMs;
      logger.warn('circuit opened', { name: this.opts.name, failures: this.failures });
    }
  }
}
