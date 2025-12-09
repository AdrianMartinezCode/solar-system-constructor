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
  
  // ============================================================================
  // Small Body Belts (unified control for Asteroid Belts + Kuiper Belt Objects)
  // ============================================================================
  
  /**
   * Global quality/performance control for all small body belts (asteroids + KBOs).
   * This scales the effective count of objects across all belt types.
   * - "low": Fast rendering, minimal objects (~100-300 per belt)
   * - "medium": Balanced quality/performance (~300-600 per belt)
   * - "high": Dense belts, more detail (~600-1000 per belt)
   * - "ultra": Maximum density, expensive (~1000-1500+ per belt)
   */
  smallBodyDetail: "low" | "medium" | "high" | "ultra";
  
  // Asteroid Belts (main belt, rocky, inner)
  enableAsteroidBelts: boolean;
  beltDensity: number; // 0..1 (controls asteroid count per belt, scaled by smallBodyDetail)
  maxBeltsPerSystem: number;
  beltPlacementMode: "none" | "betweenPlanets" | "outerBelt" | "both";
  beltStylePreset?: "none" | "mainBelt" | "kuiper" | "heavyDebris";

  // Kuiper Belt Objects (outer, icy)
  enableKuiperBelt: boolean;
  kuiperBeltDensity: number;          // 0..1 slider controlling KBO count, scaled by smallBodyDetail
  kuiperBeltDistanceStyle: "tight" | "classical" | "wide"; // Maps to radial range
  kuiperBeltInclination: number;      // 0..1 slider mapping to inclination sigma

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

  // Protoplanetary Disks (visual-only particle fields)
  enableProtoplanetaryDisks: boolean;          // Master switch for disk generation
  protoplanetaryDiskPresence: number;          // 0..1 slider mapping to probability of having a disk
  protoplanetaryDiskDensity: number;           // 0..1 slider mapping to particle count
  protoplanetaryDiskProminence: number;        // 0..1 slider mapping to opacity/brightness/thickness
}

export interface GeneratedUniverse {
  stars: Record<string, Star>;
  rootIds: string[];
  groups: Record<string, Group>;
  rootGroupIds: string[];
  belts: Record<string, AsteroidBelt>;  // Legacy, kept for backwards compat
  smallBodyFields?: Record<string, SmallBodyField>;  // New particle-based belts
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
  totalKuiperObjects?: number;       // Number of Kuiper Belt Objects (legacy entity count)
  
  // ============================================================================
  // Unified Small Body Stats (particle-field based)
  // ============================================================================
  
  /** Total number of small body belt fields (main belts + Kuiper belts) */
  totalSmallBodyBelts?: number;
  
  /** Total approximate particle count in all belt fields */
  totalSmallBodies?: number;
  
  /** Breakdown: number of main asteroid belt fields */
  totalMainBelts?: number;
  
  /** Breakdown: number of Kuiper belt fields */
  totalKuiperBelts?: number;
  
  /** Breakdown: approximate particle count in main belts */
  totalMainBeltAsteroids?: number;
  
  /** Total approximate particles across all small body fields */
  totalSmallBodyParticles?: number;
  
  /** Approximate particle count in main belt fields */
  totalMainBeltParticles?: number;
  
  /** Approximate particle count in Kuiper belt fields */
  totalKuiperBeltParticles?: number;
  
  // ============================================================================
  // Protoplanetary Disks (visual-only particle fields)
  // ============================================================================
  
  /** All protoplanetary disks keyed by ID */
  protoplanetaryDisks?: Record<string, ProtoplanetaryDisk>;
  
  /** Total number of protoplanetary disks generated */
  totalProtoplanetaryDisks?: number;
  
  /** Approximate total visual particles across all disks (after LOD scaling) */
  totalProtoplanetaryDiskParticles?: number;
  
  generatedAt: Date;
}

// Re-export types from main types file
import type { Star, Group, AsteroidBelt, ProtoplanetaryDisk, SmallBodyField } from '../types';

