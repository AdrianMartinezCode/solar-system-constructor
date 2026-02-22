/**
 * SystemRepository port — persistence interface for universe snapshots.
 *
 * This port defines how the application layer persists and retrieves
 * the universe state. Implementations (adapters) live in `src/infra/`.
 */

import type { Star, Group, AsteroidBelt, SmallBodyField, ProtoplanetaryDisk } from '../../types';

/**
 * Shape of the persisted system data.
 * Aligned with the existing localStorage format for backwards compatibility.
 */
export interface PersistedSystemData {
  stars: Record<string, Star>;
  rootIds: string[];
  groups?: Record<string, Group>;
  rootGroupIds?: string[];
  belts?: Record<string, AsteroidBelt>;
  smallBodyFields?: Record<string, SmallBodyField>;
  protoplanetaryDisks?: Record<string, ProtoplanetaryDisk>;
}

/**
 * Repository port for saving/loading the universe.
 */
export interface SystemRepository {
  save(data: PersistedSystemData): void;
  load(): PersistedSystemData | null;
  clear(): void;
}
