/**
 * Bridge between UI GenerationConfig and internal procedural-generator
 */

import type { GenerationConfig, GeneratedUniverse } from '../types/generationConfig';
import type { GeneratorConfig } from './procedural-generator';
import { generateSolarSystem, generateMultipleSystems } from './procedural-generator';

/**
 * Small body detail level scale factors.
 * These modify the effective asteroid/KBO counts based on user's quality preference.
 */
const SMALL_BODY_DETAIL_SCALES: Record<GenerationConfig['smallBodyDetail'], {
  countScale: number;
  geometricPAdjust: number;
  minCountScale: number;
  maxCountScale: number;
  label: string;
}> = {
  low: {
    countScale: 0.3,
    geometricPAdjust: 0.2,  // Higher p = fewer objects
    minCountScale: 0.5,
    maxCountScale: 0.3,
    label: 'Low (fast)',
  },
  medium: {
    countScale: 0.6,
    geometricPAdjust: 0,    // No adjustment
    minCountScale: 0.7,
    maxCountScale: 0.6,
    label: 'Medium',
  },
  high: {
    countScale: 1.0,
    geometricPAdjust: -0.1, // Lower p = more objects
    minCountScale: 1.0,
    maxCountScale: 1.0,
    label: 'High',
  },
  ultra: {
    countScale: 1.5,
    geometricPAdjust: -0.15,
    minCountScale: 1.2,
    maxCountScale: 1.5,
    label: 'Ultra (expensive)',
  },
};

/**
 * Convert UI config to internal generator config
 */
function mapConfigToInternal(config: GenerationConfig): Partial<GeneratorConfig> {
  // Map density to geometric distribution parameter
  // Lower density (0) → higher p (fewer bodies)
  // Higher density (1) → lower p (more bodies)
  const planetGeometricP = 0.8 - (config.planetDensity * 0.6); // Range: 0.2-0.8
  const moonGeometricP = 0.8 - (config.moonDensity * 0.6);     // Range: 0.2-0.8
  
  // Map maxStarsPerSystem to probabilities
  const starProbabilities = mapStarProbabilities(config.maxStarsPerSystem, config.enableNarySystems);
  
  // Map scaleMode to orbital parameters
  const { orbitBase, orbitGrowth, orbitK } = mapScaleMode(config.scaleMode);
  
  // Map orbit eccentricity style
  const { eccentricityMin, eccentricityMax } = mapEccentricityStyle(config.orbitEccentricityStyle);
  
  // Map orbit inclination
  const inclinationMax = config.orbitInclinationMax ?? 0;
  
  // Map orbit offset
  const orbitOffsetMagnitude = config.orbitOffsetEnabled ? 2.0 : 0;
  
  // Map grouping
  const enableGrouping = config.enableGroups;
  const numGroups = mapGroupCount(config.targetGalaxyCount, config.groupStructureMode);
  const nestingProbability = mapNestingProbability(config.groupStructureMode);
  
  // Get small body detail scale factors
  const detailScale = SMALL_BODY_DETAIL_SCALES[config.smallBodyDetail];
  
  // Map asteroid belt parameters (scaled by smallBodyDetail)
  const enableAsteroidBelts = config.enableAsteroidBelts;
  const baseBeltGeometricP = 0.8 - (config.beltDensity * 0.6);
  const beltAsteroidGeometricP = Math.min(0.9, Math.max(0.1, baseBeltGeometricP + detailScale.geometricPAdjust));
  const { beltMinCount: baseBeltMinCount, beltMaxCount: baseBeltMaxCount } = mapBeltDensityToCounts(config.beltDensity);
  const beltMinCount = Math.floor(baseBeltMinCount * detailScale.minCountScale);
  const beltMaxCount = Math.floor(baseBeltMaxCount * detailScale.maxCountScale);
  const maxBeltsPerSystem = config.maxBeltsPerSystem;
  const beltPlacementMode = config.beltPlacementMode;
  
  // Map planetary ring parameters
  const enablePlanetaryRings = config.enablePlanetaryRings;
  const ringedPlanetProbability = 0.05 + config.ringFrequency * 0.45; // 0.05 - 0.5
  const {
    ringThicknessRange,
    ringOpacityRange,
    ringDensityRange,
    ringAlbedoRange,
    ringColorVariation,
  } = mapRingProminence(config.ringProminence);
  const ringInnerRadiusRange: [number, number] = [1.3, 1.8];
  const ringOuterRadiusRange: [number, number] = [2.3, 3.8];

  // Map comet parameters
  const enableComets = config.enableComets;
  const cometCountRange = mapCometFrequencyToCount(config.cometFrequency);
  const {
    cometEccentricityRange,
    cometSemiMajorAxisRange,
    shortPeriodCometFraction,
  } = mapCometOrbitStyle(config.cometOrbitStyle);
  const {
    cometActivityDistanceRange,
    cometTailLengthRange,
    cometTailOpacityRange,
  } = mapCometActivity(config.cometActivity);
  const cometInclinationMax = 45; // Comets can have wild inclinations

  // Map Kuiper belt parameters (scaled by smallBodyDetail)
  const enableKuiperBelt = config.enableKuiperBelt;
  const baseKuiperGeometricP = 0.8 - (config.kuiperBeltDensity * 0.65);
  const kuiperBeltAsteroidGeometricP = Math.min(0.9, Math.max(0.1, baseKuiperGeometricP + detailScale.geometricPAdjust));
  const { kuiperBeltMinCount: baseKuiperMinCount, kuiperBeltMaxCount: baseKuiperMaxCount } = mapKuiperDensityToCounts(config.kuiperBeltDensity);
  const kuiperBeltMinCount = Math.floor(baseKuiperMinCount * detailScale.minCountScale);
  const kuiperBeltMaxCount = Math.floor(baseKuiperMaxCount * detailScale.maxCountScale);
  const kuiperBeltRadialRange = mapKuiperDistanceStyle(config.kuiperBeltDistanceStyle);
  const kuiperBeltInclinationSigma = mapKuiperInclination(config.kuiperBeltInclination);
  const kuiperBeltEccentricityRange: [number, number] = [0.0, 0.15]; // Slightly eccentric
  
  return {
    starProbabilities,
    planetGeometricP,
    moonGeometricP,
    maxDepth: config.maxDepth,
    orbitBase,
    orbitGrowth,
    orbitK,
    eccentricityMin,
    eccentricityMax,
    inclinationMax,
    orbitOffsetMagnitude,
    enableGrouping,
    numGroups,
    nestingProbability,
    enableAsteroidBelts,
    maxBeltsPerSystem,
    beltPlacementMode,
    beltAsteroidGeometricP,
    beltMinCount,
    beltMaxCount,
    // Use reasonable defaults for other belt parameters
    beltThickness: 0.5,
    beltColorVariation: 0.2,
    beltInnerGapScale: 0.4,
    beltOuterGapScale: 0.6,
    beltOuterMultiplier: 1.5,
    beltEccentricityRange: [0, 0.1],

    // Planetary rings
    enablePlanetaryRings,
    ringedPlanetProbability,
    ringMassBiasThreshold: 20,
    ringOuterOrbitBias: 0.5,
    ringInnerRadiusRange,
    ringOuterRadiusRange,
    ringThicknessRange,
    ringOpacityRange,
    ringAlbedoRange,
    ringColorVariation,
    ringDensityRange,

    // Comets
    enableComets,
    cometCountRange,
    cometEccentricityRange,
    cometInclinationMax,
    cometSemiMajorAxisRange,
    shortPeriodCometFraction,
    cometActivityDistanceRange,
    cometTailLengthRange,
    cometTailOpacityRange,

    // Kuiper belt
    enableKuiperBelt,
    kuiperBeltDensity: config.kuiperBeltDensity,
    kuiperBeltRadialRange,
    kuiperBeltInclinationSigma,
    kuiperBeltEccentricityRange,
    kuiperBeltAsteroidGeometricP,
    kuiperBeltMinCount,
    kuiperBeltMaxCount,

    // Lagrange points / Trojans
    enableLagrangePoints: config.enableLagrangePoints,
    lagrangePairTypes: config.lagrangePairScope === 'both' ? 'both' : config.lagrangePairScope,
    generateL1L2L3Markers: config.lagrangeMarkerMode === 'all',
    generateL4L5Markers: config.lagrangeMarkerMode !== 'none',
    enableTrojans: mapTrojanFrequencyToEnable(config.trojanFrequency),
    trojanBodyType: 'asteroid', // Default to asteroid Trojans
    trojanCountRange: mapTrojanFrequencyToCountRange(config.trojanFrequency),
    ...mapTrojanRichnessToMassScaleAndVariation(config.trojanRichness),
  };
}

/**
 * Map ring prominence (0-1) to geometry/visual ranges
 */
function mapRingProminence(prominence: number): {
  ringThicknessRange: [number, number];
  ringOpacityRange: [number, number];
  ringDensityRange: [number, number];
  ringAlbedoRange: [number, number];
  ringColorVariation: number;
} {
  const p = Math.max(0, Math.min(1, prominence));

  // Thicker, brighter rings at higher prominence
  const ringThicknessRange: [number, number] = [
    0.03 + p * 0.04,
    0.08 + p * 0.08,
  ];

  const ringOpacityRange: [number, number] = [
    0.2 + p * 0.2,
    0.5 + p * 0.4,
  ];

  const ringDensityRange: [number, number] = [
    0.2 + p * 0.3,
    0.6 + p * 0.4,
  ];

  const ringAlbedoRange: [number, number] = [
    0.4,
    0.7 + p * 0.3,
  ];

  const ringColorVariation = 0.15 + p * 0.25;

  return {
    ringThicknessRange,
    ringOpacityRange,
    ringDensityRange,
    ringAlbedoRange,
    ringColorVariation,
  };
}

/**
 * Map maxStarsPerSystem to probability distribution
 */
function mapStarProbabilities(
  maxStars: number, 
  enableNary: boolean
): [number, number, number] {
  if (!enableNary) {
    return [1.0, 0.0, 0.0]; // Only single stars
  }
  
  switch (maxStars) {
    case 1:
      return [1.0, 0.0, 0.0];
    case 2:
      return [0.6, 0.4, 0.0];
    case 3:
    default:
      return [0.65, 0.25, 0.10];
  }
}

/**
 * Map scaleMode to orbital parameters
 */
function mapScaleMode(mode: GenerationConfig["scaleMode"]) {
  switch (mode) {
    case "toy":
      return { orbitBase: 3.0, orbitGrowth: 1.5, orbitK: 15 };
    case "compressed":
      return { orbitBase: 5.0, orbitGrowth: 1.6, orbitK: 18 };
    case "realistic":
    default:
      return { orbitBase: 8.0, orbitGrowth: 1.8, orbitK: 20 };
  }
}

/**
 * Map group structure mode to group count range
 */
function mapGroupCount(
  targetCount: number,
  mode: GenerationConfig["groupStructureMode"]
): [number, number] {
  switch (mode) {
    case "flat":
      return [targetCount, targetCount];
    case "galaxyCluster":
      return [Math.max(2, Math.floor(targetCount * 0.7)), targetCount];
    case "deepHierarchy":
      return [Math.floor(targetCount * 0.5), Math.ceil(targetCount * 1.5)];
    default:
      return [targetCount, targetCount];
  }
}

/**
 * Map group structure mode to nesting probability
 */
function mapNestingProbability(mode: GenerationConfig["groupStructureMode"]): number {
  switch (mode) {
    case "flat":
      return 0.0;
    case "galaxyCluster":
      return 0.2;
    case "deepHierarchy":
      return 0.5;
    default:
      return 0.2;
  }
}

/**
 * Map orbit eccentricity style to min/max values
 */
function mapEccentricityStyle(style?: GenerationConfig["orbitEccentricityStyle"]): {
  eccentricityMin: number;
  eccentricityMax: number;
} {
  switch (style) {
    case "circular":
    default:
      return { eccentricityMin: 0, eccentricityMax: 0 };
    case "mixed":
      return { eccentricityMin: 0, eccentricityMax: 0.3 };
    case "eccentric":
      return { eccentricityMin: 0.1, eccentricityMax: 0.7 };
  }
}

/**
 * Map belt density (0-1) to min/max asteroid counts
 */
function mapBeltDensityToCounts(density: number): {
  beltMinCount: number;
  beltMaxCount: number;
} {
  // Scale asteroid counts based on density
  // Low density: 50-500 asteroids
  // High density: 200-1000 asteroids
  const minCount = Math.floor(50 + density * 150);
  const maxCount = Math.floor(500 + density * 500);
  
  return { beltMinCount: minCount, beltMaxCount: maxCount };
}

/**
 * Map comet frequency (0-1) to per-system comet count range
 */
function mapCometFrequencyToCount(frequency: number): [number, number] {
  if (frequency === 0) return [0, 0];
  
  // Low frequency: 1-2 comets
  // Medium frequency: 1-4 comets
  // High frequency: 2-6 comets
  const minCount = Math.floor(1 + frequency * 1);
  const maxCount = Math.floor(2 + frequency * 4);
  
  return [minCount, maxCount];
}

/**
 * Map comet orbit style to orbital parameters
 */
function mapCometOrbitStyle(style: GenerationConfig["cometOrbitStyle"]): {
  cometEccentricityRange: [number, number];
  cometSemiMajorAxisRange: [number, number];
  shortPeriodCometFraction: number;
} {
  switch (style) {
    case "rareLong":
      return {
        cometEccentricityRange: [0.7, 0.99],
        cometSemiMajorAxisRange: [2.0, 3.5],
        shortPeriodCometFraction: 0.1, // Mostly long-period
      };
    case "mixed":
      return {
        cometEccentricityRange: [0.6, 0.95],
        cometSemiMajorAxisRange: [1.5, 3.0],
        shortPeriodCometFraction: 0.4, // Mix of both
      };
    case "manyShort":
      return {
        cometEccentricityRange: [0.5, 0.9],
        cometSemiMajorAxisRange: [1.2, 2.5],
        shortPeriodCometFraction: 0.7, // Mostly short-period
      };
    default:
      return {
        cometEccentricityRange: [0.7, 0.99],
        cometSemiMajorAxisRange: [2.0, 3.5],
        shortPeriodCometFraction: 0.1,
      };
  }
}

/**
 * Map comet activity (0-1) to tail parameters
 */
function mapCometActivity(activity: number): {
  cometActivityDistanceRange: [number, number];
  cometTailLengthRange: [number, number];
  cometTailOpacityRange: [number, number];
} {
  const a = Math.max(0, Math.min(1, activity));
  
  // Higher activity = longer tails, more opacity, larger active zone
  return {
    cometActivityDistanceRange: [
      3 + a * 3,  // Active from 3-6 units
      15 + a * 15, // Up to 15-30 units
    ],
    cometTailLengthRange: [
      1 + a * 2,   // 1-3 base length
      4 + a * 6,   // 4-10 max length
    ],
    cometTailOpacityRange: [
      0.2 + a * 0.2, // 0.2-0.4 min opacity
      0.4 + a * 0.4, // 0.4-0.8 max opacity
    ],
  };
}

/**
 * Map trojan frequency (0-1) to enable boolean
 */
function mapTrojanFrequencyToEnable(frequency: number): boolean {
  return frequency > 0.05; // Enable if frequency > 5%
}

/**
 * Map Kuiper belt density (0-1) to min/max KBO counts
 */
function mapKuiperDensityToCounts(density: number): {
  kuiperBeltMinCount: number;
  kuiperBeltMaxCount: number;
} {
  // Scale KBO counts based on density
  // Low density: 100-800 KBOs
  // High density: 300-1500 KBOs
  const minCount = Math.floor(100 + density * 200);
  const maxCount = Math.floor(800 + density * 700);
  
  return { kuiperBeltMinCount: minCount, kuiperBeltMaxCount: maxCount };
}

/**
 * Map Kuiper belt distance style to radial range multipliers
 */
function mapKuiperDistanceStyle(style: GenerationConfig["kuiperBeltDistanceStyle"]): [number, number] {
  switch (style) {
    case "tight":
      return [1.5, 2.5];  // Closer to outermost planet
    case "classical":
      return [2.0, 3.5];  // Classical Kuiper belt range
    case "wide":
      return [2.5, 4.5];  // Wide/scattered disk
    default:
      return [2.0, 3.5];
  }
}

/**
 * Map Kuiper belt inclination slider (0-1) to sigma value
 */
function mapKuiperInclination(inclination: number): number {
  // Map 0-1 to inclination sigma
  // 0 = thin disc (0.5), 1 = highly scattered (3.0)
  return 0.5 + inclination * 2.5;
}

/**
 * Map trojan frequency (0-1) to per-L-point trojan count range
 */
function mapTrojanFrequencyToCountRange(frequency: number): [number, number] {
  if (frequency === 0) return [0, 0];
  
  // Low frequency: 0-2 Trojans
  // Medium frequency: 1-4 Trojans
  // High frequency: 2-6 Trojans
  const minCount = Math.floor(frequency * 2);
  const maxCount = Math.floor(2 + frequency * 4);
  
  return [minCount, maxCount];
}

/**
 * Map trojan richness (0-1) to mass scale and color variation
 */
function mapTrojanRichnessToMassScaleAndVariation(richness: number): {
  trojanMassScale: number;
  trojanColorVariation: number;
} {
  const r = Math.max(0, Math.min(1, richness));
  
  // Higher richness = larger, more prominent Trojans with more variety
  return {
    trojanMassScale: 0.3 + r * 0.5,  // 0.3 to 0.8
    trojanColorVariation: 0.2 + r * 0.3, // 0.2 to 0.5
  };
}

/**
 * Main generation function - bridge to internal generator
 */
export function generateUniverse(config: GenerationConfig): GeneratedUniverse {
  const internalConfig = mapConfigToInternal(config);
  
  // Use seed for deterministic generation
  const seed = config.seed || undefined; // Convert empty string to undefined
  
  let result;
  if (config.maxSystems === 1) {
    result = generateSolarSystem(seed, internalConfig);
  } else {
    result = generateMultipleSystems(config.maxSystems, seed, internalConfig);
  }
  
  // Count totals
  const totalAsteroids = Object.values(result.belts).reduce((sum, belt) => sum + belt.asteroidCount, 0);
  const allStars = Object.values(result.stars);
  const totalRingedPlanets = allStars.filter(
    (star) => star.bodyType === 'planet' && star.ring
  ).length;
  const totalRings = totalRingedPlanets; // One ring system per planet for now
  const totalComets = allStars.filter((star) => star.bodyType === 'comet').length;
  const totalLagrangePoints = allStars.filter((star) => star.bodyType === 'lagrangePoint').length;
  const totalLagrangeMarkers = totalLagrangePoints; // Same count
  const totalTrojanBodies = allStars.filter((star) => star.lagrangeHostId !== undefined).length;
  const totalKuiperObjects = allStars.filter((star) => star.asteroidSubType === 'kuiperBelt').length;
  const totalMainBeltAsteroids = allStars.filter((star) => star.asteroidSubType === 'mainBelt').length;
  
  // ============================================================================
  // Unified Small Body Stats
  // ============================================================================
  const allBelts = Object.values(result.belts);
  const totalMainBelts = allBelts.filter((belt) => belt.beltType === 'main' || !belt.beltType).length;
  const totalKuiperBelts = allBelts.filter((belt) => belt.beltType === 'kuiper').length;
  const totalSmallBodyBelts = totalMainBelts + totalKuiperBelts;
  const totalSmallBodies = totalMainBeltAsteroids + totalKuiperObjects;
  
  return {
    ...result,
    totalStars: Object.keys(result.stars).length,
    totalGroups: Object.keys(result.groups).length,
    totalBelts: Object.keys(result.belts).length,
    totalAsteroids,
    totalRingedPlanets,
    totalRings,
    totalComets,
    totalLagrangePoints,
    totalLagrangeMarkers,
    totalTrojanBodies,
    totalKuiperObjects,
    // Unified small body stats
    totalSmallBodyBelts,
    totalSmallBodies,
    totalMainBelts,
    totalKuiperBelts,
    totalMainBeltAsteroids,
    generatedAt: new Date(),
  };
}

/**
 * Get the label for a small body detail level
 */
export function getSmallBodyDetailLabel(detail: GenerationConfig['smallBodyDetail']): string {
  return SMALL_BODY_DETAIL_SCALES[detail].label;
}

