/**
 * User-facing configuration for procedural universe generation
 */

export interface GenerationConfig {
  seed?: string | number;
  maxSystems: number;
  maxStarsPerSystem: number;
  maxDepth: number;

  stylePreset: "sparse" | "solarLike" | "crowded" | "superDenseExperimental";
  enableNarySystems: boolean;
  scaleMode: "realistic" | "compressed" | "toy";

  // Distribution params
  planetDensity: number; // 0..1
  moonDensity: number;   // 0..1

  // Grouping
  enableGroups: boolean;
  targetGalaxyCount: number;
  groupStructureMode: "flat" | "galaxyCluster" | "deepHierarchy";
}

export interface GeneratedUniverse {
  stars: Record<string, Star>;
  rootIds: string[];
  groups: Record<string, Group>;
  rootGroupIds: string[];
  totalStars: number;
  totalGroups: number;
  generatedAt: Date;
}

// Re-export types from main types file
import type { Star, Group } from './index';

