/**
 * User-facing configuration for procedural universe generation
 */

import type { Star, Group, AsteroidBelt, ProtoplanetaryDisk, SmallBodyField, NebulaRegion } from '../../types';

export interface GenerationConfig {
  seed?: string | number;
  maxSystems: number;
  maxStarsPerSystem: number;
  maxDepth: number;

  stylePreset: "sparse" | "solarLike" | "crowded" | "superDenseExperimental";
  
  /**
   * Topology/Grammar preset controlling system hierarchy generation.
   * - "classic": Standard L-system (1-3 stars, geometric planet/moon distribution)
   * - "compact": Fewer planets (max 4) with many moons each
   * - "multiStarHeavy": Favors binary (50%) and ternary (35%) systems
   * - "moonRich": Many moons per planet (up to 12)
   * - "sparseOutpost": Minimal systems (1 star, 1-3 planets)
   * - "deepHierarchy": Allows sub-moons (moons of moons)
   */
  topologyPreset?: "classic" | "compact" | "multiStarHeavy" | "moonRich" | "sparseOutpost" | "deepHierarchy";
  
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
  
  // Advanced Protoplanetary Disk Controls
  protoplanetaryDiskStyleBias?: 'mostlyThin' | 'balanced' | 'mostlyThick' | 'extremeShowcase'; // Style preset distribution
  protoplanetaryDiskBandingLevel?: number;     // 0..1 controls band strength and frequency
  protoplanetaryDiskGapSharpnessLevel?: number; // 0..1 controls gap sharpness
  protoplanetaryDiskSpiralLevel?: number;      // 0..1 controls spiral strength and arm count
  protoplanetaryDiskNoiseLevel?: number;       // 0..1 controls noise scale and strength

  // Nebulae Regions (galaxy-scale visual-only volumetric clouds)
  enableNebulae: boolean;                      // Master switch for nebula generation
  nebulaDensity: number;                       // 0..1 slider controlling nebula count/frequency
  nebulaSizeBias?: 'small' | 'medium' | 'giant'; // Optional size bias control
  nebulaColorStyle?: 'random' | 'warm' | 'cool' | 'mixed'; // Optional color palette filter
  nebulaBrightness?: number;                   // 0..1 optional brightness slider (if exposed)

  // Rogue Planets (unbound planets traversing the universe)
  enableRoguePlanets: boolean;                 // Master switch for rogue planet generation
  roguePlanetFrequency: number;                // 0..1 slider controlling rogue planet count
  roguePlanetOrbitStyle?: 'slowDrifters' | 'mixed' | 'fastIntruders'; // Movement style
  roguePlanetVisibility?: number;              // 0..1 visual emphasis (color/brightness distinction)
  
  // Rogue Planet Trajectory Configuration
  rogueTrajectoryMode?: 'linearOnly' | 'mixed' | 'curved'; // Path type distribution
  rogueCurvatureMin?: number;                  // 0..1 minimum path curvature
  rogueCurvatureMax?: number;                  // 0..1 maximum path curvature
  rogueTrajectoryShow?: boolean;               // Master toggle for rogue path rendering
  rogueTrajectoryPreviewLength?: number;       // 0..1, how much of path is visualized
  
  // ============================================================================
  // Black Holes (extremely dense central objects with accretion disks and jets)
  // ============================================================================
  
  /** Master switch for black hole generation */
  enableBlackHoles?: boolean;
  
  /** 0..1 slider controlling how frequently black holes appear in systems */
  blackHoleFrequency?: number;
  
  /** 0..1 slider controlling accretion disk intensity (brightness/density) */
  blackHoleAccretionIntensity?: number;
  
  /** 0..1 slider controlling how often black holes have relativistic jets */
  blackHoleJetFrequency?: number;
  
  /** Visual complexity preset for black hole rendering */
  blackHoleVisualComplexity?: 'minimal' | 'normal' | 'cinematic';
  
  // ============================================================================
  // Advanced Black Hole Controls
  // ============================================================================
  
  /** Mass profile distribution for black holes */
  blackHoleMassProfile?: 'stellarOnly' | 'mixed' | 'supermassiveCentres';
  
  /** 0..1 spin level (low → slow rotation, high → near-maximum Kerr spin) */
  blackHoleSpinLevel?: number;
  
  /** 0..1 disk thickness level */
  blackHoleDiskThicknessLevel?: number;
  
  /** 0..1 disk clumpiness/density variation level */
  blackHoleDiskClumpinessLevel?: number;
  
  /** 0..1 jet drama level (affects jet length and brightness) */
  blackHoleJetDramaLevel?: number;
  
  /** 0..1 relativistic FX intensity (scales Doppler beaming and lensing) */
  blackHoleFxIntensity?: number;
  
  /** Rarity style for black holes */
  blackHoleRarityStyle?: 'ultraRare' | 'rare' | 'common';
  
  /** Accretion style preset */
  blackHoleAccretionStyle?: 'subtle' | 'normal' | 'quasar';
  
  /** Allow multiple black holes per system (binary black holes, etc.) */
  blackHoleAllowMultiplePerSystem?: boolean;
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
  
  // ============================================================================
  // Nebulae Regions (galaxy-scale volumetric clouds)
  // ============================================================================
  
  /** All nebula regions keyed by ID */
  nebulae?: Record<string, NebulaRegion>;
  
  /** Total number of nebula regions generated */
  totalNebulae?: number;
  
  // ============================================================================
  // Rogue Planets (unbound planets freely traversing the universe)
  // ============================================================================
  
  /** IDs of all rogue planets (subset of stars keys) */
  roguePlanetIds?: string[];
  
  /** Total number of rogue planets generated */
  totalRoguePlanets?: number;
  
  // ============================================================================
  // Black Holes
  // ============================================================================
  
  /** Total number of black holes generated */
  totalBlackHoles?: number;
  
  /** Number of black holes with accretion disks */
  totalBlackHolesWithDisks?: number;
  
  /** Number of black holes with relativistic jets */
  totalBlackHolesWithJets?: number;
  
  /** Black holes by mass class */
  totalBlackHolesByType?: {
    stellar: number;
    intermediate: number;
    supermassive: number;
  };
  
  /** Average black hole spin parameter */
  avgBlackHoleSpin?: number;
  
  /** Minimum black hole spin */
  minBlackHoleSpin?: number;
  
  /** Maximum black hole spin */
  maxBlackHoleSpin?: number;
  
  /** Number of black holes with photon rings */
  blackHolesWithPhotonRings?: number;
  
  /** Number of black holes with quasar-style accretion */
  blackHolesWithQuasarAccretion?: number;
  
  generatedAt: Date;
}
