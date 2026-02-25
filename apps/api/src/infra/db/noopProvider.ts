import type { DbProvider } from './types.js';
import { logger } from '../../config/logger.js';

const log = logger.child({ component: 'database' });

/**
 * No-op database provider.
 *
 * Satisfies the DbProvider interface without doing anything.
 * Used as the default when no real database is configured,
 * so the API can always boot and serve /health.
 */
export function createNoopProvider(): DbProvider {
  return {
    name: 'noop',

    async connect() {
      log.info('noop provider connected (no real database)');
    },

    async disconnect() {
      log.info('noop provider disconnected');
    },

    async ping() {
      return true;
    },
  };
}
