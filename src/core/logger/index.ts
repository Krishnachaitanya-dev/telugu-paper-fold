import { Logger } from './logger';
import { consoleTransport } from './consoleTransport';

export { Logger } from './logger';
export type { LogTransport } from './logger';

const logger = new Logger();

if (__DEV__) {
  logger.addTransport(consoleTransport);
}

export { logger };
