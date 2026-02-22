import type { DbProvider } from './types.js';

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
      console.log('[db] noop provider connected (no real database)');
    },

    async disconnect() {
      console.log('[db] noop provider disconnected');
    },

    async ping() {
      return true;
    },
  };
}
