/**
 * PostgreSQL adapter for UniverseRepository.
 *
 * Persists universes in a `universes` table with a JSONB `state` column.
 * All queries use parameterized statements (no SQL injection risk).
 */

import type pg from 'pg';
import type { UniverseState } from '@solar/domain';
import type {
  UniverseRepository,
  PersistedUniverse,
  CreateUniverseInput,
  UpdateUniverseInput,
} from '../../app/ports/universeRepository.js';

// ---------------------------------------------------------------------------
// Row → domain mapping
// ---------------------------------------------------------------------------

interface UniverseRow {
  id: string;
  name: string;
  state: UniverseState;
  created_at: string | Date;
  updated_at: string | Date;
}

function mapRow(row: UniverseRow): PersistedUniverse {
  return {
    id: row.id,
    name: row.name,
    state: row.state, // pg auto-parses JSONB to object
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createPostgresUniverseRepository(
  pool: pg.Pool,
): UniverseRepository {
  return {
    async create(input: CreateUniverseInput): Promise<PersistedUniverse> {
      const { rows } = await pool.query<UniverseRow>(
        `INSERT INTO universes (name, state)
         VALUES ($1, $2)
         RETURNING id, name, state, created_at, updated_at`,
        [input.name, JSON.stringify(input.state)],
      );
      return mapRow(rows[0]);
    },

    async getById(id: string): Promise<PersistedUniverse | null> {
      const { rows } = await pool.query<UniverseRow>(
        `SELECT id, name, state, created_at, updated_at
         FROM universes WHERE id = $1`,
        [id],
      );
      return rows.length > 0 ? mapRow(rows[0]) : null;
    },

    async list(): Promise<PersistedUniverse[]> {
      const { rows } = await pool.query<UniverseRow>(
        `SELECT id, name, state, created_at, updated_at
         FROM universes ORDER BY created_at DESC`,
      );
      return rows.map(mapRow);
    },

    async update(
      id: string,
      input: UpdateUniverseInput,
    ): Promise<PersistedUniverse | null> {
      const { rows } = await pool.query<UniverseRow>(
        `UPDATE universes
         SET name       = COALESCE($2, name),
             state      = COALESCE($3, state),
             updated_at = NOW()
         WHERE id = $1
         RETURNING id, name, state, created_at, updated_at`,
        [
          id,
          input.name ?? null,
          input.state !== undefined ? JSON.stringify(input.state) : null,
        ],
      );
      return rows.length > 0 ? mapRow(rows[0]) : null;
    },

    async delete(id: string): Promise<boolean> {
      const result = await pool.query(
        `DELETE FROM universes WHERE id = $1`,
        [id],
      );
      return (result.rowCount ?? 0) > 0;
    },
  };
}
