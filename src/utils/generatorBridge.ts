/**
 * Bridge between UI GenerationConfig and internal procedural-generator
 */

import type { GenerationConfig, GeneratedUniverse } from '../types/generationConfig';
import type { GeneratorConfig } from './procedural-generator';
import { generateSolarSystem, generateMultipleSystems } from './procedural-generator';

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
  
  // Map asteroid belt parameters
  const enableAsteroidBelts = config.enableAsteroidBelts;
  const beltAsteroidGeometricP = 0.8 - (config.beltDensity * 0.6); // Same pattern as planets/moons
  const { beltMinCount, beltMaxCount } = mapBeltDensityToCounts(config.beltDensity);
  const maxBeltsPerSystem = config.maxBeltsPerSystem;
  const beltPlacementMode = config.beltPlacementMode;
  
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
  
  // Count total asteroids
  const totalAsteroids = Object.values(result.belts).reduce((sum, belt) => sum + belt.asteroidCount, 0);
  
  return {
    ...result,
    totalStars: Object.keys(result.stars).length,
    totalGroups: Object.keys(result.groups).length,
    totalBelts: Object.keys(result.belts).length,
    totalAsteroids,
    generatedAt: new Date(),
  };
}

