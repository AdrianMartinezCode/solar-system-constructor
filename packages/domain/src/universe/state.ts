/**
 * UniverseState — the serializable universe snapshot.
 *
 * This type represents "what exists in the universe" and is the single
 * source of truth for all domain data. It is JSON-serializable and
 * contains no UI state (selection, camera, nesting, isolation).
 *
 * Aligned with the persisted shape in localStorage (key: "nested-solar-system").
 */

import type {
  Star,
  Group,
  AsteroidBelt,
  SmallBodyField,
  ProtoplanetaryDisk,
  NebulaRegion,
} from '../types';

export interface UniverseState {
  /** All bodies (stars, planets, moons, asteroids, comets, black holes, etc.) keyed by ID */
  stars: Record<string, Star>;

  /** IDs of root-level bodies (no parent) */
  rootIds: string[];

  /** All groups keyed by ID */
  groups: Record<string, Group>;

  /** IDs of root-level groups (no parent group) */
  rootGroupIds: string[];

  /** Legacy asteroid belt entities keyed by ID */
  belts: Record<string, AsteroidBelt>;

  /** GPU particle-based small body fields keyed by ID */
  smallBodyFields: Record<string, SmallBodyField>;

  /** Protoplanetary disk entities keyed by ID */
  protoplanetaryDisks: Record<string, ProtoplanetaryDisk>;

  /** Nebula region entities keyed by ID */
  nebulae: Record<string, NebulaRegion>;

  /** Simulation time (accumulated seconds) */
  time: number;
}

/**
 * Create an empty UniverseState with sensible defaults.
 */
export function emptyUniverseState(): UniverseState {
  return {
    stars: {},
    rootIds: [],
    groups: {},
    rootGroupIds: [],
    belts: {},
    smallBodyFields: {},
    protoplanetaryDisks: {},
    nebulae: {},
    time: 0,
  };
}
