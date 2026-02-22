/**
 * In-memory adapter for UniverseRepository.
 *
 * Stores universes in a Map — useful for local development and testing
 * without a running database. Data is ephemeral (lost on restart).
 */

import type {
  UniverseRepository,
  PersistedUniverse,
  CreateUniverseInput,
  UpdateUniverseInput,
} from '../../app/ports/universeRepository.js';
import { randomUUID } from 'node:crypto';

export function createInMemoryUniverseRepository(): UniverseRepository {
  const store = new Map<string, PersistedUniverse>();

  return {
    async create(input: CreateUniverseInput): Promise<PersistedUniverse> {
      const now = new Date();
      const record: PersistedUniverse = {
        id: randomUUID(),
        name: input.name,
        state: input.state,
        createdAt: now,
        updatedAt: now,
      };
      store.set(record.id, record);
      return record;
    },

    async getById(id: string): Promise<PersistedUniverse | null> {
      return store.get(id) ?? null;
    },

    async list(): Promise<PersistedUniverse[]> {
      return Array.from(store.values()).sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
    },

    async update(
      id: string,
      input: UpdateUniverseInput,
    ): Promise<PersistedUniverse | null> {
      const existing = store.get(id);
      if (!existing) return null;

      const updated: PersistedUniverse = {
        ...existing,
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.state !== undefined ? { state: input.state } : {}),
        updatedAt: new Date(),
      };
      store.set(id, updated);
      return updated;
    },

    async delete(id: string): Promise<boolean> {
      return store.delete(id);
    },
  };
}
