// Backward-compat re-export — canonical location: src/domain/generation/types.ts
export type { GenerationConfig, GeneratedUniverse } from '../domain/generation/types';

// Re-export types from main types file (preserved for consumers that import them from here)
import type { Star, Group, AsteroidBelt, ProtoplanetaryDisk, SmallBodyField, NebulaRegion } from '../types';
export type { Star, Group, AsteroidBelt, ProtoplanetaryDisk, SmallBodyField, NebulaRegion };
