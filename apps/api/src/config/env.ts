/**
 * Centralized environment variable parsing.
 * All env access goes through this module — route handlers and infra code
 * import from here rather than reading process.env directly.
 */

export interface AppEnv {
  /** HTTP port the API listens on. */
  PORT: number;

  /** Which DB provider to use at runtime.  Defaults to "noop" (no persistence). */
  DB_PROVIDER: 'noop' | string;

  /** Connection string for the chosen DB (ignored when DB_PROVIDER is "noop"). */
  DATABASE_URL: string | undefined;

  /** Runtime environment hint. */
  NODE_ENV: 'development' | 'production' | 'test';
}

export function loadEnv(): AppEnv {
  return {
    PORT: parseInt(process.env['PORT'] ?? '3001', 10),
    DB_PROVIDER: process.env['DB_PROVIDER'] ?? 'noop',
    DATABASE_URL: process.env['DATABASE_URL'],
    NODE_ENV: (process.env['NODE_ENV'] as AppEnv['NODE_ENV']) ?? 'development',
  };
}
