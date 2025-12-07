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

  // Orbit style parameters
  orbitEccentricityStyle?: "circular" | "mixed" | "eccentric"; // Overall eccentricity distribution
  orbitInclinationMax?: number; // Maximum inclination/tilt in degrees (0 = all co-planar)
  orbitOffsetEnabled?: boolean; // Whether to enable orbit center offsets

  // Grouping
  enableGroups: boolean;
  targetGalaxyCount: number;
  groupStructureMode: "flat" | "galaxyCluster" | "deepHierarchy";
  
  // Asteroid Belts
  enableAsteroidBelts: boolean;
  beltDensity: number; // 0..1 (controls asteroid count per belt)
  maxBeltsPerSystem: number;
  beltPlacementMode: "none" | "betweenPlanets" | "outerBelt" | "both";
  beltStylePreset?: "none" | "mainBelt" | "kuiper" | "heavyDebris";

  // Planetary Rings
  enablePlanetaryRings: boolean;
  ringFrequency: number;  // 0..1 likelihood of planets having rings
  ringProminence: number; // 0..1 visual prominence (thickness/opacity)
  ringStylePreset?: "none" | "rare" | "solarLike" | "dramatic";

  // Comets
  enableComets: boolean;
  cometFrequency: number;      // 0..1; maps to per-system comet count / probabilities
  cometOrbitStyle: "rareLong" | "mixed" | "manyShort";
  cometActivity: number;       // 0..1; maps to tail length/opacity ranges

  // Lagrange Points / Trojans
  enableLagrangePoints: boolean;
  lagrangeMarkerMode: "none" | "stableOnly" | "all"; // L4/L5 only vs L1-L5
  trojanFrequency: number;     // 0..1 slider controlling how often Trojans appear
  trojanRichness: number;      // 0..1 slider controlling how many Trojans per L4/L5
  lagrangePairScope: "starPlanet" | "planetMoon" | "both"; // Which pairs to consider
}

export interface GeneratedUniverse {
  stars: Record<string, Star>;
  rootIds: string[];
  groups: Record<string, Group>;
  rootGroupIds: string[];
  belts: Record<string, AsteroidBelt>;
  totalStars: number;
  totalGroups: number;
  totalBelts: number;
  totalAsteroids: number;
  totalRingedPlanets: number;
  totalRings: number;
  totalComets: number;
  totalLagrangePoints?: number;      // Total number of Lagrange point markers
  totalLagrangeMarkers?: number;     // Same as totalLagrangePoints (for clarity)
  totalTrojanBodies?: number;        // Number of Trojan bodies at L4/L5
  generatedAt: Date;
}

// Re-export types from main types file
import type { Star, Group, AsteroidBelt } from './index';

