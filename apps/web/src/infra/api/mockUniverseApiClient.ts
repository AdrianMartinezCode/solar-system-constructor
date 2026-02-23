/**
 * Mock in-memory adapter for the UniverseApiClient port.
 *
 * Returns realistic stubbed data and simulates network latency.
 * Used when the app is running in "online" mode before a real HTTP adapter exists.
 */

import type {
  UniverseApiClient,
  ApiUniverse,
  CreateUniverseInput,
  UpdateUniverseInput,
} from '../../app/ports/universeApiClient';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Simulate network latency (100–300 ms). */
function delay(ms = 150): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Generate a simple unique ID without pulling in an extra dependency. */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

function createSeedData(): Map<string, ApiUniverse> {
  const now = nowISO();
  const seeds: ApiUniverse[] = [
    {
      id: 'mock-alpha-centauri',
      name: 'Alpha Centauri System',
      state: { stars: {}, rootIds: [], groups: {}, rootGroupIds: [], belts: {} },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'mock-trappist-1',
      name: 'Trappist-1 Cluster',
      state: { stars: {}, rootIds: [], groups: {}, rootGroupIds: [], belts: {} },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'mock-kepler-442',
      name: 'Kepler-442 Neighborhood',
      state: { stars: {}, rootIds: [], groups: {}, rootGroupIds: [], belts: {} },
      createdAt: now,
      updatedAt: now,
    },
  ];

  const map = new Map<string, ApiUniverse>();
  for (const s of seeds) {
    map.set(s.id, s);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createMockUniverseApiClient(): UniverseApiClient {
  const store = createSeedData();

  return {
    async list(): Promise<ApiUniverse[]> {
      await delay();
      // Most-recently-created first
      return Array.from(store.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    },

    async getById(id: string): Promise<ApiUniverse | null> {
      await delay();
      return store.get(id) ?? null;
    },

    async create(input: CreateUniverseInput): Promise<ApiUniverse> {
      await delay();
      const now = nowISO();
      const universe: ApiUniverse = {
        id: generateId(),
        name: input.name,
        state: input.state,
        createdAt: now,
        updatedAt: now,
      };
      store.set(universe.id, universe);
      return universe;
    },

    async update(id: string, input: UpdateUniverseInput): Promise<ApiUniverse | null> {
      await delay();
      const existing = store.get(id);
      if (!existing) return null;

      const updated: ApiUniverse = {
        ...existing,
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.state !== undefined ? { state: input.state } : {}),
        updatedAt: nowISO(),
      };
      store.set(id, updated);
      return updated;
    },

    async delete(id: string): Promise<boolean> {
      await delay();
      return store.delete(id);
    },
  };
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

/** Default mock instance for use across the app. */
export const mockUniverseApiClient = createMockUniverseApiClient();
