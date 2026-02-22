/**
 * DB provider factory.
 *
 * Resolves the correct DbProvider implementation based on the DB_PROVIDER env
 * variable.  New providers are registered by adding a case to the switch.
 */

import type { AppEnv } from '../../config/env.js';
import type { DbProvider } from './types.js';
import { createNoopProvider } from './noopProvider.js';
import { createPostgresProvider } from './postgresProvider.js';

export type { DbProvider } from './types.js';
export type { PostgresDbProvider } from './postgresProvider.js';

export function createDbProvider(env: AppEnv): DbProvider {
  switch (env.DB_PROVIDER) {
    case 'noop':
      return createNoopProvider();

    case 'postgres': {
      if (!env.DATABASE_URL) {
        throw new Error(
          '[db] DB_PROVIDER is "postgres" but DATABASE_URL is not set',
        );
      }
      return createPostgresProvider(env.DATABASE_URL);
    }

    // -----------------------------------------------------------------
    // TODO: add more providers here as they are implemented, e.g.:
    //
    // case 'sqlite':
    //   return createSqliteProvider(env.DATABASE_URL!);
    //
    // case 'mongo':
    //   return createMongoProvider(env.DATABASE_URL!);
    // -----------------------------------------------------------------

    default:
      throw new Error(`[db] unknown DB_PROVIDER: "${env.DB_PROVIDER}"`);
  }
}
