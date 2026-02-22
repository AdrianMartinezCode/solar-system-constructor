/**
 * PostgreSQL database provider.
 *
 * Implements the DbProvider interface using node-postgres (pg).
 * Also exposes `getPool()` so downstream consumers (e.g. repositories)
 * can obtain the connection pool.
 */

import pg from 'pg';
import type { DbProvider } from './types.js';

const { Pool } = pg;

export interface PostgresDbProvider extends DbProvider {
  /** Access the underlying pg.Pool for repository adapters. */
  getPool(): pg.Pool;
}

export function createPostgresProvider(databaseUrl: string): PostgresDbProvider {
  const pool = new Pool({ connectionString: databaseUrl });

  return {
    name: 'postgres',

    async connect() {
      const client = await pool.connect();
      try {
        await client.query('SELECT 1');
        console.log('[db] postgres provider connected');
      } finally {
        client.release();
      }
    },

    async disconnect() {
      await pool.end();
      console.log('[db] postgres provider disconnected');
    },

    async ping() {
      try {
        await pool.query('SELECT 1');
        return true;
      } catch {
        return false;
      }
    },

    getPool() {
      return pool;
    },
  };
}
