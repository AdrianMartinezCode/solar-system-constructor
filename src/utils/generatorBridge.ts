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
    countScale: 0.5,
    geometricPAdjust: 0.1,  // Higher p = fewer objects
    minCountScale: 1.0,
    maxCountScale: 0.8,
    label: 'Low (fast)',
  },
  medium: {
    countScale: 1.0,
    geometricPAdjust: -0.1,    // Lower p = more objects
    minCountScale: 2.0,        // Much higher for visibility
    maxCountScale: 2.0,
    label: 'Medium',
  },
  high: {
    countScale: 1.5,
    geometricPAdjust: -0.2, // Lower p = more objects
    minCountScale: 3.0,
    maxCountScale: 3.0,
    label: 'High',
  },
  ultra: {
    countScale: 2.0,
    geometricPAdjust: -0.3,
    minCountScale: 4.0,
    maxCountScale: 4.0,
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

    // Protoplanetary disks
    ...mapProtoplanetaryDiskConfig(config),

    // Nebulae regions
    ...mapNebulaConfig(config),

    // Rogue planets
    ...mapRoguePlanetConfig(config),
    
    // Black holes
    ...mapBlackHoleConfig(config),
  };
}

/**
 * Map rogue planet UI config to internal generator config
 */
function mapRoguePlanetConfig(config: GenerationConfig): {
  enableRoguePlanets: boolean;
  roguePlanetCountRange: [number, number];
  roguePlanetDistanceRange: [number, number];
  roguePlanetSpeedRange: [number, number];
  roguePlanetInclinationMax: number;
  roguePlanetColorVariation: number;
  roguePlanetCurvatureRange: [number, number];
  roguePlanetTrajectoryMode: 'linearOnly' | 'mixed' | 'mostlyCurved';
  roguePlanetPathPeriodRange: [number, number];
  roguePlanetEccentricityRange: [number, number];
  roguePlanetSemiMajorAxisRange: [number, number];
  roguePlanetShowTrajectories: boolean;
  roguePlanetTrajectoryPastWindow: number;
  roguePlanetTrajectoryFutureWindow: number;
} {
  const frequency = config.roguePlanetFrequency ?? 0;
  const style = config.roguePlanetOrbitStyle ?? 'mixed';
  const visibility = config.roguePlanetVisibility ?? 0.5;

  // Map frequency (0-1) to count range (very rare - rogues are special events)
  let countRange: [number, number];
  if (frequency === 0) {
    countRange = [0, 0];
  } else if (frequency < 0.4) {
    countRange = [0, 1];  // Rare: 0-1 rogue
  } else if (frequency < 0.7) {
    countRange = [1, 2];  // Few: 1-2 rogues
  } else if (frequency < 0.9) {
    countRange = [2, 3];  // Moderate: 2-3 rogues
  } else {
    countRange = [3, 5];  // Many: 3-5 rogues maximum
  }

  // Map style to speed and inclination
  let speedRange: [number, number];
  let inclinationMax: number;
  switch (style) {
    case 'slowDrifters':
      speedRange = [0.005, 0.02];
      inclinationMax = 10;
      break;
    case 'fastIntruders':
      speedRange = [0.05, 0.15];
      inclinationMax = 45;
      break;
    case 'mixed':
    default:
      speedRange = [0.01, 0.08];
      inclinationMax = 25;
      break;
  }

  // Distance range based on groupPositionSigma (around 50 default)
  const distanceRange: [number, number] = [100, 300];

  // Map visibility to color variation
  const colorVariation = 0.2 + visibility * 0.5; // 0.2 to 0.7

  // ============================================================================
  // Map trajectory configuration (new fields)
  // ============================================================================
  
  const trajectoryMode = config.rogueTrajectoryMode ?? 'linearOnly';
  const curvatureMin = config.rogueCurvatureMin ?? 0;
  const curvatureMax = config.rogueCurvatureMax ?? 0;
  const showTrajectories = config.rogueTrajectoryShow ?? true;
  const previewLength = config.rogueTrajectoryPreviewLength ?? 0.5;
  
  // Map UI trajectory mode to internal mode
  let internalTrajectoryMode: 'linearOnly' | 'mixed' | 'mostlyCurved';
  switch (trajectoryMode) {
    case 'linearOnly':
      internalTrajectoryMode = 'linearOnly';
      break;
    case 'curved':
      internalTrajectoryMode = 'mostlyCurved';
      break;
    case 'mixed':
    default:
      internalTrajectoryMode = 'mixed';
      break;
  }
  
  // Map curvature range
  const curvatureRange: [number, number] = [
    Math.max(0, Math.min(1, curvatureMin)),
    Math.max(0, Math.min(1, curvatureMax)),
  ];
  
  // Path period range (5-13 minutes by default, scaled by curvature)
  const pathPeriodRange: [number, number] = [300, 800];
  
  // Eccentricity range (moderate by default, higher for more curved)
  const eccentricityRange: [number, number] = [0.1, 0.6];
  
  // Semi-major axis range (moderate-sized paths)
  const semiMajorAxisRange: [number, number] = [80, 200];
  
  // Trajectory visualization windows (scaled by preview length)
  const baseWindow = 100; // seconds
  const pastWindow = baseWindow * previewLength;
  const futureWindow = baseWindow * previewLength;

  return {
    enableRoguePlanets: config.enableRoguePlanets ?? false,
    roguePlanetCountRange: countRange,
    roguePlanetDistanceRange: distanceRange,
    roguePlanetSpeedRange: speedRange,
    roguePlanetInclinationMax: inclinationMax,
    roguePlanetColorVariation: colorVariation,
    
    // Curved trajectory parameters
    roguePlanetCurvatureRange: curvatureRange,
    roguePlanetTrajectoryMode: internalTrajectoryMode,
    roguePlanetPathPeriodRange: pathPeriodRange,
    roguePlanetEccentricityRange: eccentricityRange,
    roguePlanetSemiMajorAxisRange: semiMajorAxisRange,
    
    // Trajectory visualization
    roguePlanetShowTrajectories: showTrajectories,
    roguePlanetTrajectoryPastWindow: pastWindow,
    roguePlanetTrajectoryFutureWindow: futureWindow,
  };
}

/**
 * Map nebula UI config to internal generator config
 */
function mapNebulaConfig(config: GenerationConfig): {
  enableNebulae: boolean;
  nebulaDensity: number;
  nebulaCountRange: [number, number];
  nebulaSizeRange: [number, number];
  nebulaThicknessRange: [number, number];
  nebulaDistanceFromGroups: [number, number];
  nebulaColorPalettes: Array<{ base: string; accent: string }>;
  nebulaBrightnessRange: [number, number];
  nebulaDensityRange: [number, number];
  nebulaNoiseScaleRange: [number, number];
  nebulaNoiseDetailRange: [number, number];
} {
  const density = config.nebulaDensity ?? 0.5;
  const sizeBias = config.nebulaSizeBias ?? 'medium';
  const colorStyle = config.nebulaColorStyle ?? 'random';
  const brightness = config.nebulaBrightness ?? 0.7;

  // Map density (0-1) to count range
  // Low density: 1-3 nebulae, High density: 5-12 nebulae
  const nebulaCountRange: [number, number] = [
    Math.max(1, Math.floor(1 + density * 4)),
    Math.max(2, Math.floor(3 + density * 9)),
  ];

  // Map size bias to radius range
  let nebulaSizeRange: [number, number];
  switch (sizeBias) {
    case 'small':
      nebulaSizeRange = [40, 100];
      break;
    case 'giant':
      nebulaSizeRange = [120, 250];
      break;
    case 'medium':
    default:
      nebulaSizeRange = [80, 200];
      break;
  }

  // Filter color palettes based on style
  const allPalettes = [
    // HII regions (emission nebulae, pinkish-red)
    { base: '#FF6B9D', accent: '#FFB3D9' },
    { base: '#FF4D88', accent: '#FF99CC' },
    // Blue reflection nebulae
    { base: '#4DA6FF', accent: '#99CCFF' },
    { base: '#3399FF', accent: '#66B2FF' },
    // Dark / mixed nebulae (dust + emission)
    { base: '#9966CC', accent: '#CC99FF' },
    { base: '#FF8C42', accent: '#FFB380' },
    // Greenish (rare, oxygen lines)
    { base: '#5BC95B', accent: '#99E699' },
  ];

  let nebulaColorPalettes: Array<{ base: string; accent: string }>;
  switch (colorStyle) {
    case 'warm':
      // HII + mixed warm
      nebulaColorPalettes = [
        { base: '#FF6B9D', accent: '#FFB3D9' },
        { base: '#FF4D88', accent: '#FF99CC' },
        { base: '#FF8C42', accent: '#FFB380' },
      ];
      break;
    case 'cool':
      // Blue reflection + greenish
      nebulaColorPalettes = [
        { base: '#4DA6FF', accent: '#99CCFF' },
        { base: '#3399FF', accent: '#66B2FF' },
        { base: '#5BC95B', accent: '#99E699' },
        { base: '#9966CC', accent: '#CC99FF' },
      ];
      break;
    case 'mixed':
      // Balanced mix
      nebulaColorPalettes = [
        { base: '#FF6B9D', accent: '#FFB3D9' },
        { base: '#4DA6FF', accent: '#99CCFF' },
        { base: '#9966CC', accent: '#CC99FF' },
        { base: '#FF8C42', accent: '#FFB380' },
      ];
      break;
    case 'random':
    default:
      nebulaColorPalettes = allPalettes;
      break;
  }

  // Map brightness slider to brightness range (boosted for far distance visibility)
  const nebulaBrightnessRange: [number, number] = [
    0.7 + brightness * 0.3,  // Boosted minimum
    0.9 + brightness * 0.1,  // Near maximum
  ];

  return {
    enableNebulae: config.enableNebulae ?? false,
    nebulaDensity: density,
    nebulaCountRange,
    nebulaSizeRange,
    nebulaThicknessRange: [0.6, 1.4],
    nebulaDistanceFromGroups: [800, 2000],  // VERY far - pure galactic background
    nebulaColorPalettes,
    nebulaBrightnessRange,
    nebulaDensityRange: [0.7, 0.95],  // Higher density for visibility at distance
    nebulaNoiseScaleRange: [0.8, 2.5],
    nebulaNoiseDetailRange: [3, 6],
  };
}

/**
 * Map protoplanetary disk UI config to internal generator config
 */
function mapProtoplanetaryDiskConfig(config: GenerationConfig): {
  enableProtoplanetaryDisks: boolean;
  protoplanetaryDiskProbability: number;
  protoplanetaryDiskInnerRadiusRange: [number, number];
  protoplanetaryDiskOuterRadiusRange: [number, number];
  protoplanetaryDiskThicknessRange: [number, number];
  protoplanetaryDiskParticleCountRange: [number, number];
  protoplanetaryDiskOpacityRange: [number, number];
  protoplanetaryDiskBrightnessRange: [number, number];
  protoplanetaryDiskClumpinessRange: [number, number];
  protoplanetaryDiskRotationSpeedMultiplierRange: [number, number];
} {
  const presence = config.protoplanetaryDiskPresence ?? 0;
  const density = config.protoplanetaryDiskDensity ?? 0.5;
  const prominence = config.protoplanetaryDiskProminence ?? 0.5;

  // Map presence (0-1) to probability (0-0.7)
  // 0 → 0.0, 0.5 → 0.3, 1.0 → 0.7
  const probability = presence * 0.7;

  // Map density (0-1) to particle count range
  // Low density: 3k-8k, High density: 15k-40k
  const baseParticleMin = 3000 + density * 12000;
  const baseParticleMax = 8000 + density * 32000;

  // Map prominence (0-1) to visual parameters
  const thicknessRange: [number, number] = [
    0.15 + prominence * 0.15,
    0.4 + prominence * 0.5,
  ];
  const opacityRange: [number, number] = [
    0.2 + prominence * 0.2,
    0.5 + prominence * 0.4,
  ];
  const brightnessRange: [number, number] = [
    0.2 + prominence * 0.2,
    0.5 + prominence * 0.5,
  ];
  const clumpinessRange: [number, number] = [
    0.2 + prominence * 0.1,
    0.5 + prominence * 0.3,
  ];

  return {
    enableProtoplanetaryDisks: config.enableProtoplanetaryDisks ?? false,
    protoplanetaryDiskProbability: probability,
    protoplanetaryDiskInnerRadiusRange: [0.5, 1.5],
    protoplanetaryDiskOuterRadiusRange: [3.0, 8.0],
    protoplanetaryDiskThicknessRange: thicknessRange,
    protoplanetaryDiskParticleCountRange: [baseParticleMin, baseParticleMax],
    protoplanetaryDiskOpacityRange: opacityRange,
    protoplanetaryDiskBrightnessRange: brightnessRange,
    protoplanetaryDiskClumpinessRange: clumpinessRange,
    protoplanetaryDiskRotationSpeedMultiplierRange: [0.1, 0.5],
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
  // Scale asteroid counts based on density (increased for better visibility)
  // Low density: 300-1000 particles
  // High density: 600-2500 particles
  const minCount = Math.floor(300 + density * 300);
  const maxCount = Math.floor(1000 + density * 1500);
  
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
  // Scale KBO counts based on density (increased for better visibility)
  // Low density: 500-1500 particles
  // High density: 1000-3500 particles
  const minCount = Math.floor(500 + density * 500);
  const maxCount = Math.floor(1500 + density * 2000);
  
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
 * Map black hole UI config to internal generator config
 */
export function mapBlackHoleConfig(config: GenerationConfig): {
  enableBlackHoles: boolean;
  blackHoleSystemProbability: number;
  blackHoleAsCompanionProbability: number;
  blackHoleMassRange: [number, number];
  blackHoleAccretionDiskProbability: number;
  blackHoleJetProbability: number;
  blackHolePhotonRingEnabled: boolean;
  blackHoleDopplerBeamingStrengthRange: [number, number];
  blackHoleLensingStrengthRange: [number, number];
  blackHoleShadowRadiusRange: [number, number];
  blackHoleAccretionInnerRadiusMultiplier: [number, number];
  blackHoleAccretionOuterRadiusMultiplier: [number, number];
  blackHoleDiskThicknessRange: [number, number];
  blackHoleJetLengthRange: [number, number];
  blackHoleJetOpeningAngleRange: [number, number];
  blackHoleSpinRange: [number, number];
  blackHoleMassClassWeights?: { stellar: number; intermediate: number; supermassive: number };
  blackHoleMultiplePerSystemProbability?: number;
  blackHoleCenterBias?: number;
  blackHoleSpinDistribution?: 'uniform' | 'highSpinBiased' | 'lowSpinBiased';
  blackHoleTiltRange?: [number, number];
  blackHoleShadowRadiusScaleMode?: 'physicalish' | 'cinematic';
  blackHoleAccretionStyle?: 'subtle' | 'normal' | 'quasar';
  blackHoleDiskBrightnessRange?: [number, number];
  blackHoleDiskOpacityRange?: [number, number];
  blackHoleDiskTemperatureRange?: [number, number];
  blackHoleDiskClumpinessRange?: [number, number];
  blackHoleJetBrightnessRange?: [number, number];
  blackHoleSecondaryRingProbability?: number;
  blackHoleRotationSpeedMultiplierRange?: [number, number];
} {
  const enabled = config.enableBlackHoles ?? false;
  const frequency = config.blackHoleFrequency ?? 0;
  const accretionIntensity = config.blackHoleAccretionIntensity ?? 0.5;
  const jetFrequency = config.blackHoleJetFrequency ?? 0.5;
  const complexity = config.blackHoleVisualComplexity ?? 'normal';
  
  // Advanced controls (optional)
  const massProfile = config.blackHoleMassProfile;
  const spinLevel = config.blackHoleSpinLevel;
  const diskThicknessLevel = config.blackHoleDiskThicknessLevel;
  const diskClumpinessLevel = config.blackHoleDiskClumpinessLevel;
  const jetDramaLevel = config.blackHoleJetDramaLevel;
  const fxIntensity = config.blackHoleFxIntensity;
  const rarityStyle = config.blackHoleRarityStyle;
  const accretionStyle = config.blackHoleAccretionStyle;
  const allowMultiple = config.blackHoleAllowMultiplePerSystem ?? false;
  
  // ============================================================================
  // Basic Mapping (same as before)
  // ============================================================================
  
  // Map frequency (0-1) to system probability (override by rarityStyle if set)
  let systemProbability: number;
  let companionProbability: number;
  
  if (rarityStyle) {
    // Rarity style overrides frequency slider
    switch (rarityStyle) {
      case 'ultraRare':
        systemProbability = enabled ? 0.01 : 0; // 1%
        companionProbability = enabled ? 0.005 : 0; // 0.5%
        break;
      case 'rare':
        systemProbability = enabled ? 0.05 : 0; // 5%
        companionProbability = enabled ? 0.02 : 0; // 2%
        break;
      case 'common':
        systemProbability = enabled ? 0.3 : 0; // 30%
        companionProbability = enabled ? 0.1 : 0; // 10%
        break;
    }
  } else {
    // Default frequency-based mapping (backward compatible)
    systemProbability = enabled ? Math.max(0.05, frequency * 0.5) : 0; // 5-50% chance
    companionProbability = enabled ? frequency * 0.1 : 0; // 0-10% chance
  }
  
  // Map accretion intensity to disk parameters
  const diskProbability = enabled ? 0.5 + accretionIntensity * 0.4 : 0; // 50-90%
  const jetProbability = jetFrequency; // Direct mapping
  
  // Map complexity to visual effect strengths (can be overridden by fxIntensity)
  let dopplerStrength: [number, number];
  let lensingStrength: [number, number];
  let photonRingEnabled: boolean;
  
  if (fxIntensity !== undefined) {
    // fxIntensity overrides complexity for FX settings
    dopplerStrength = [0.1 + fxIntensity * 0.3, 0.4 + fxIntensity * 0.6]; // 0.1-0.4 to 0.4-1.0
    lensingStrength = [0.2 + fxIntensity * 0.3, 0.5 + fxIntensity * 0.5]; // 0.2-0.5 to 0.5-1.0
    photonRingEnabled = fxIntensity > 0.3; // Show photon ring if FX intensity > 30%
  } else {
    // Use complexity preset (backward compatible)
    switch (complexity) {
      case 'minimal':
        dopplerStrength = [0.1, 0.3];
        lensingStrength = [0.1, 0.3];
        photonRingEnabled = false;
        break;
      case 'cinematic':
        dopplerStrength = [0.7, 1.0];
        lensingStrength = [0.7, 1.0];
        photonRingEnabled = true;
        break;
      case 'normal':
      default:
        dopplerStrength = [0.3, 0.7];
        lensingStrength = [0.4, 0.8];
        photonRingEnabled = true;
        break;
    }
  }
  
  // ============================================================================
  // Advanced Mapping (new fields)
  // ============================================================================
  
  // Mass Profile → Mass Class Weights
  let massClassWeights: { stellar: number; intermediate: number; supermassive: number } | undefined;
  if (massProfile) {
    switch (massProfile) {
      case 'stellarOnly':
        massClassWeights = { stellar: 1.0, intermediate: 0.0, supermassive: 0.0 };
        break;
      case 'mixed':
        massClassWeights = { stellar: 0.7, intermediate: 0.25, supermassive: 0.05 };
        break;
      case 'supermassiveCentres':
        massClassWeights = { stellar: 0.3, intermediate: 0.2, supermassive: 0.5 };
        break;
    }
  }
  
  // Spin Level → Spin Range and Distribution
  let spinRange: [number, number];
  let spinDistribution: 'uniform' | 'highSpinBiased' | 'lowSpinBiased' | undefined;
  if (spinLevel !== undefined) {
    if (spinLevel < 0.33) {
      // Low spin: mostly slow rotators
      spinRange = [0.0, 0.4];
      spinDistribution = 'lowSpinBiased';
    } else if (spinLevel < 0.67) {
      // Medium spin: balanced
      spinRange = [0.2, 0.8];
      spinDistribution = 'uniform';
    } else {
      // High spin: mostly fast rotators (near-extremal Kerr)
      spinRange = [0.6, 0.99];
      spinDistribution = 'highSpinBiased';
    }
  } else {
    // Default (backward compatible)
    spinRange = [0.3, 0.95];
    spinDistribution = undefined;
  }
  
  // Disk Thickness Level → Thickness Range
  let diskThicknessRange: [number, number];
  if (diskThicknessLevel !== undefined) {
    // Map 0-1 to thickness range
    const minThickness = 0.1 + diskThicknessLevel * 0.2; // 0.1-0.3
    const maxThickness = 0.3 + diskThicknessLevel * 0.5; // 0.3-0.8
    diskThicknessRange = [minThickness, maxThickness];
  } else {
    // Default (backward compatible)
    diskThicknessRange = [0.2, 0.5];
  }
  
  // Disk Clumpiness Level → Clumpiness Range
  let diskClumpinessRange: [number, number] | undefined;
  if (diskClumpinessLevel !== undefined) {
    const minClumpiness = 0.1 + diskClumpinessLevel * 0.2; // 0.1-0.3
    const maxClumpiness = 0.4 + diskClumpinessLevel * 0.6; // 0.4-1.0
    diskClumpinessRange = [minClumpiness, maxClumpiness];
  }
  
  // Jet Drama Level → Jet Length and Brightness Ranges
  let jetLengthRange: [number, number];
  let jetBrightnessRange: [number, number] | undefined;
  if (jetDramaLevel !== undefined) {
    const minLength = 10 + jetDramaLevel * 30; // 10-40
    const maxLength = 30 + jetDramaLevel * 70; // 30-100
    jetLengthRange = [minLength, maxLength];
    
    const minBrightness = 0.5 + jetDramaLevel * 0.3; // 0.5-0.8
    const maxBrightness = 0.8 + jetDramaLevel * 0.2; // 0.8-1.0
    jetBrightnessRange = [minBrightness, maxBrightness];
  } else {
    // Default (backward compatible)
    jetLengthRange = [20, 50];
    jetBrightnessRange = undefined;
  }
  
  // Accretion Style → Disk Brightness, Opacity, Temperature Ranges
  let diskBrightnessRange: [number, number] | undefined;
  let diskOpacityRange: [number, number] | undefined;
  let diskTemperatureRange: [number, number] | undefined;
  if (accretionStyle) {
    switch (accretionStyle) {
      case 'subtle':
        diskBrightnessRange = [0.3, 0.6];
        diskOpacityRange = [0.3, 0.6];
        diskTemperatureRange = [3000, 10000];
        break;
      case 'normal':
        diskBrightnessRange = [0.6, 0.9];
        diskOpacityRange = [0.6, 0.9];
        diskTemperatureRange = [5000, 20000];
        break;
      case 'quasar':
        diskBrightnessRange = [0.9, 1.0];
        diskOpacityRange = [0.8, 1.0];
        diskTemperatureRange = [15000, 50000];
        break;
    }
  }
  
  // Multiple per system
  const multiplePerSystemProbability = allowMultiple ? 0.15 : undefined; // 15% chance when enabled
  
  // Secondary ring probability (based on FX intensity if set)
  const secondaryRingProbability = fxIntensity !== undefined ? fxIntensity : undefined;
  
  return {
    enableBlackHoles: enabled,
    blackHoleSystemProbability: systemProbability,
    blackHoleAsCompanionProbability: companionProbability,
    blackHoleMassRange: [5, 50], // Base range, modified by mass class weights
    blackHoleAccretionDiskProbability: diskProbability,
    blackHoleJetProbability: jetProbability,
    blackHolePhotonRingEnabled: photonRingEnabled,
    blackHoleDopplerBeamingStrengthRange: dopplerStrength,
    blackHoleLensingStrengthRange: lensingStrength,
    // More compact shadow radius for better proportions (Interstellar-like scale)
    blackHoleShadowRadiusRange: [0.5, 1.2],
    // Disk radii: more compact, cinematic proportions (inner ~2.5×, outer ~6-10×)
    blackHoleAccretionInnerRadiusMultiplier: [2.0, 3.0],
    blackHoleAccretionOuterRadiusMultiplier: [6, 10],
    blackHoleDiskThicknessRange: diskThicknessRange,
    blackHoleJetLengthRange: jetLengthRange,
    // Narrower jets for more realistic appearance
    blackHoleJetOpeningAngleRange: [2, 6],
    blackHoleSpinRange: spinRange,
    
    // Default tilt for interesting viewing angle (15-35 degrees)
    blackHoleTiltRange: [15, 35],
    
    // Advanced parameters (optional, only set if user configured them)
    blackHoleMassClassWeights: massClassWeights,
    blackHoleMultiplePerSystemProbability: multiplePerSystemProbability,
    blackHoleCenterBias: undefined, // Not exposed in UI yet
    blackHoleSpinDistribution: spinDistribution,
    blackHoleShadowRadiusScaleMode: undefined, // Not exposed in UI yet (always cinematic for now)
    blackHoleAccretionStyle: accretionStyle,
    blackHoleDiskBrightnessRange: diskBrightnessRange,
    blackHoleDiskOpacityRange: diskOpacityRange,
    blackHoleDiskTemperatureRange: diskTemperatureRange,
    blackHoleDiskClumpinessRange: diskClumpinessRange,
    blackHoleJetBrightnessRange: jetBrightnessRange,
    blackHoleSecondaryRingProbability: secondaryRingProbability,
    blackHoleRotationSpeedMultiplierRange: [0.8, 1.5], // Moderate rotation speed
  };
}

/**
 * Main generation function - bridge to internal generator
 */
export function generateUniverse(config: GenerationConfig): GeneratedUniverse {
  console.log('[generateUniverse] Called with config:', {
    enableBlackHoles: config.enableBlackHoles,
    blackHoleFrequency: config.blackHoleFrequency,
    enableAsteroidBelts: config.enableAsteroidBelts,
    beltDensity: config.beltDensity,
    enableKuiperBelt: config.enableKuiperBelt,
    kuiperBeltDensity: config.kuiperBeltDensity,
    smallBodyDetail: config.smallBodyDetail,
    maxBeltsPerSystem: config.maxBeltsPerSystem,
    beltPlacementMode: config.beltPlacementMode,
  });
  
  const internalConfig = mapConfigToInternal(config);
  
  console.log('[generateUniverse] Internal config belt settings:', {
    enableAsteroidBelts: internalConfig.enableAsteroidBelts,
    beltPlacementMode: internalConfig.beltPlacementMode,
    beltAsteroidGeometricP: internalConfig.beltAsteroidGeometricP,
    beltMinCount: internalConfig.beltMinCount,
    beltMaxCount: internalConfig.beltMaxCount,
    enableKuiperBelt: internalConfig.enableKuiperBelt,
    kuiperBeltDensity: internalConfig.kuiperBeltDensity,
    kuiperBeltMinCount: internalConfig.kuiperBeltMinCount,
    kuiperBeltMaxCount: internalConfig.kuiperBeltMaxCount,
  });
  
  console.log('[generateUniverse] Black hole config:', {
    enableBlackHoles: internalConfig.enableBlackHoles,
    blackHoleSystemProbability: internalConfig.blackHoleSystemProbability,
    blackHoleAsCompanionProbability: internalConfig.blackHoleAsCompanionProbability,
  });
  
  // Use seed for deterministic generation
  const seed = config.seed || undefined; // Convert empty string to undefined
  
  let result;
  if (config.maxSystems === 1) {
    result = generateSolarSystem(seed, internalConfig);
  } else {
    result = generateMultipleSystems(config.maxSystems, seed, internalConfig);
  }
  
  // Count totals
  const allStars = Object.values(result.stars);
  const totalRingedPlanets = allStars.filter(
    (star) => star.bodyType === 'planet' && star.ring
  ).length;
  const totalRings = totalRingedPlanets; // One ring system per planet for now
  const totalComets = allStars.filter((star) => star.bodyType === 'comet').length;
  const totalLagrangePoints = allStars.filter((star) => star.bodyType === 'lagrangePoint').length;
  const totalLagrangeMarkers = totalLagrangePoints; // Same count
  const totalTrojanBodies = allStars.filter((star) => star.lagrangeHostId !== undefined).length;
  
  // Black hole stats
  const blackHoles = allStars.filter((star) => star.bodyType === 'blackHole');
  const totalBlackHoles = blackHoles.length;
  const totalBlackHolesWithDisks = blackHoles.filter(
    (bh) => bh.blackHole?.hasAccretionDisk
  ).length;
  const totalBlackHolesWithJets = blackHoles.filter(
    (bh) => bh.blackHole?.hasRelativisticJet
  ).length;
  
  // Enhanced black hole stats
  const blackHolesByType = { stellar: 0, intermediate: 0, supermassive: 0 };
  let totalSpin = 0;
  let minSpin = Infinity;
  let maxSpin = -Infinity;
  let blackHolesWithPhotonRings = 0;
  
  blackHoles.forEach((bh) => {
    if (!bh.blackHole) return;
    
    // Mass classification
    if (bh.mass < 50) {
      blackHolesByType.stellar++;
    } else if (bh.mass < 10000) {
      blackHolesByType.intermediate++;
    } else {
      blackHolesByType.supermassive++;
    }
    
    // Spin stats
    const spin = bh.blackHole.spin;
    totalSpin += spin;
    minSpin = Math.min(minSpin, spin);
    maxSpin = Math.max(maxSpin, spin);
    
    // Photon rings
    if (bh.blackHole.hasPhotonRing) {
      blackHolesWithPhotonRings++;
    }
  });
  
  const avgBlackHoleSpin = totalBlackHoles > 0 ? totalSpin / totalBlackHoles : 0;
  const finalMinSpin = totalBlackHoles > 0 ? minSpin : 0;
  const finalMaxSpin = totalBlackHoles > 0 ? maxSpin : 0;
  
  // Legacy asteroid/KBO counts from Star entities (for backwards compatibility)
  const totalKuiperObjects = allStars.filter((star) => star.asteroidSubType === 'kuiperBelt').length;
  const totalMainBeltAsteroids = allStars.filter((star) => star.asteroidSubType === 'mainBelt').length;
  const totalAsteroids = totalMainBeltAsteroids + totalKuiperObjects;
  
  // ============================================================================
  // Unified Small Body Stats (Particle Field Version)
  // ============================================================================
  const allFields = Object.values(result.smallBodyFields || {});
  const totalMainBelts = allFields.filter((field) => field.beltType === 'main').length;
  const totalKuiperBelts = allFields.filter((field) => field.beltType === 'kuiper').length;
  const totalSmallBodyBelts = totalMainBelts + totalKuiperBelts;
  
  // Calculate particle counts from fields
  const totalSmallBodyParticles = allFields.reduce((sum, field) => sum + field.particleCount, 0);
  const totalMainBeltParticles = allFields
    .filter((field) => field.beltType === 'main')
    .reduce((sum, field) => sum + field.particleCount, 0);
  const totalKuiperBeltParticles = allFields
    .filter((field) => field.beltType === 'kuiper')
    .reduce((sum, field) => sum + field.particleCount, 0);
  
  // Use particle counts as "total small bodies" (replaces entity counts)
  const totalSmallBodies = totalSmallBodyParticles > 0 ? totalSmallBodyParticles : (totalMainBeltAsteroids + totalKuiperObjects);
  
  console.log('[generateUniverse] Small body field stats:', {
    totalFields: allFields.length,
    totalMainBelts,
    totalKuiperBelts,
    totalSmallBodyParticles,
    totalMainBeltParticles,
    totalKuiperBeltParticles,
  });
  
  // ============================================================================
  // Protoplanetary Disk Stats
  // ============================================================================
  const allDisks = Object.values(result.protoplanetaryDisks || {});
  const totalProtoplanetaryDisks = allDisks.length;
  const totalProtoplanetaryDiskParticles = allDisks.reduce((sum, disk) => sum + disk.particleCount, 0);
  
  // ============================================================================
  // Nebula Stats
  // ============================================================================
  const allNebulae = Object.values(result.nebulae || {});
  const totalNebulae = allNebulae.length;
  
  // ============================================================================
  // Rogue Planet Stats
  // ============================================================================
  const roguePlanetIds = allStars
    .filter((star) => star.isRoguePlanet === true)
    .map((star) => star.id);
  const totalRoguePlanets = roguePlanetIds.length;
  
  return {
    ...result,
    totalStars: Object.keys(result.stars).length,
    totalGroups: Object.keys(result.groups).length,
    totalBelts: Object.keys(result.belts).length,  // Legacy
    totalAsteroids,  // Legacy entity count
    totalRingedPlanets,
    totalRings,
    totalComets,
    totalLagrangePoints,
    totalLagrangeMarkers,
    totalTrojanBodies,
    totalKuiperObjects,  // Legacy entity count
    // Unified small body stats (particle-based)
    totalSmallBodyBelts,
    totalSmallBodies,  // Now uses particle counts
    totalMainBelts,
    totalKuiperBelts,
    totalMainBeltAsteroids: totalMainBeltParticles > 0 ? totalMainBeltParticles : totalMainBeltAsteroids,
    totalSmallBodyParticles,
    totalMainBeltParticles,
    totalKuiperBeltParticles,
    // Protoplanetary disk stats
    protoplanetaryDisks: result.protoplanetaryDisks,
    totalProtoplanetaryDisks,
    totalProtoplanetaryDiskParticles,
    // Nebula stats
    nebulae: result.nebulae,
    totalNebulae,
    // Rogue planet stats
    roguePlanetIds,
    totalRoguePlanets,
    // Black hole stats
    totalBlackHoles,
    totalBlackHolesWithDisks,
    totalBlackHolesWithJets,
    totalBlackHolesByType: blackHolesByType,
    avgBlackHoleSpin: avgBlackHoleSpin,
    minBlackHoleSpin: finalMinSpin,
    maxBlackHoleSpin: finalMaxSpin,
    blackHolesWithPhotonRings: blackHolesWithPhotonRings,
    blackHolesWithQuasarAccretion: 0, // Can't detect from current data, would need style flag
    // Small body fields (new)
    smallBodyFields: result.smallBodyFields,
    generatedAt: new Date(),
  };
}

/**
 * Get the label for a small body detail level
 */
export function getSmallBodyDetailLabel(detail: GenerationConfig['smallBodyDetail']): string {
  return SMALL_BODY_DETAIL_SCALES[detail].label;
}

