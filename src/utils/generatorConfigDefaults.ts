import type { GenerationConfig } from '../types/generationConfig';

/**
 * Default configuration values
 */
export const defaultConfig: GenerationConfig = {
  seed: undefined,
  maxSystems: 5,
  maxStarsPerSystem: 3,
  maxDepth: 3,
  
  stylePreset: "solarLike",
  enableNarySystems: true,
  scaleMode: "realistic",
  
  planetDensity: 0.6,
  moonDensity: 0.7,
  
  orbitEccentricityStyle: "circular",
  orbitInclinationMax: 0,
  orbitOffsetEnabled: false,
  
  enableGroups: false,
  targetGalaxyCount: 3,
  groupStructureMode: "flat",
  
  // Small Body Belts - global quality control
  smallBodyDetail: "medium", // Balanced default
  
  // Asteroid belt defaults (main belt, inner)
  enableAsteroidBelts: false,
  beltDensity: 0.5,
  maxBeltsPerSystem: 2,
  beltPlacementMode: "betweenPlanets",
  beltStylePreset: "none",

  // Kuiper belt defaults (outer, icy)
  enableKuiperBelt: false,
  kuiperBeltDensity: 0.5,
  kuiperBeltDistanceStyle: "classical",
  kuiperBeltInclination: 0.3,

  // Planetary rings defaults
  enablePlanetaryRings: false,
  ringFrequency: 0.2,
  ringProminence: 0.6,
  ringStylePreset: "none",

  // Comet defaults
  enableComets: false,
  cometFrequency: 0.2,
  cometOrbitStyle: "rareLong",
  cometActivity: 0.6,

  // Lagrange points / Trojans defaults
  enableLagrangePoints: false,
  lagrangeMarkerMode: "stableOnly",
  trojanFrequency: 0.3,
  trojanRichness: 0.5,
  lagrangePairScope: "starPlanet",
};

/**
 * Get preset configuration based on style
 */
export function getPresetConfig(preset: GenerationConfig["stylePreset"]): GenerationConfig {
  const base = { ...defaultConfig, stylePreset: preset };
  
  switch (preset) {
    case "sparse":
      return {
        ...base,
        maxSystems: 3,
        maxStarsPerSystem: 1,
        maxDepth: 2,
        planetDensity: 0.8,
        moonDensity: 0.8,
        enableNarySystems: false,
        orbitEccentricityStyle: "circular",
        orbitInclinationMax: 5, // Slight tilt
        
        // Small Body Belts - disabled for sparse preset
        smallBodyDetail: "low",
        enableAsteroidBelts: false,
        beltDensity: 0,
        maxBeltsPerSystem: 0,
        enableKuiperBelt: false,
        kuiperBeltDensity: 0,
        kuiperBeltDistanceStyle: "classical",
        kuiperBeltInclination: 0.2,

        enablePlanetaryRings: false,
        ringFrequency: 0,
        ringProminence: 0.3,
        ringStylePreset: "none",

        enableComets: false,
        cometFrequency: 0,
        cometOrbitStyle: "rareLong",
        cometActivity: 0.3,

        enableLagrangePoints: false,
        lagrangeMarkerMode: "none",
        trojanFrequency: 0,
        trojanRichness: 0.3,
        lagrangePairScope: "starPlanet",
      };
      
    case "solarLike":
      return {
        ...base,
        maxSystems: 5,
        maxStarsPerSystem: 2,
        maxDepth: 3,
        planetDensity: 0.5,
        moonDensity: 0.6,
        enableNarySystems: true,
        orbitEccentricityStyle: "circular",
        orbitInclinationMax: 10, // Low inclinations like our solar system
        orbitOffsetEnabled: false,
        
        // Small Body Belts - moderate detail, realistic solar system
        smallBodyDetail: "medium",
        enableAsteroidBelts: true,
        beltDensity: 0.4, // Moderate asteroid density
        maxBeltsPerSystem: 1,
        beltPlacementMode: "betweenPlanets",
        beltStylePreset: "mainBelt",
        enableKuiperBelt: true,
        kuiperBeltDensity: 0.3,     // Moderate KBO density
        kuiperBeltDistanceStyle: "classical",
        kuiperBeltInclination: 0.3, // Classical scattered disc

        enablePlanetaryRings: true,
        ringFrequency: 0.3,   // Occasional ringed planets
        ringProminence: 0.7,  // Fairly visible like Saturn
        ringStylePreset: "solarLike",

        enableComets: true,
        cometFrequency: 0.3,  // Few long-period comets
        cometOrbitStyle: "rareLong",
        cometActivity: 0.5,

        enableLagrangePoints: true,
        lagrangeMarkerMode: "all",  // Show all L1-L5 markers
        trojanFrequency: 0.3,
        trojanRichness: 0.4,
        lagrangePairScope: "starPlanet",
      };
      
    case "crowded":
      return {
        ...base,
        maxSystems: 15,
        maxStarsPerSystem: 3,
        maxDepth: 3,
        planetDensity: 0.3,
        moonDensity: 0.4,
        enableNarySystems: true,
        orbitEccentricityStyle: "mixed",
        orbitInclinationMax: 25, // More variety
        orbitOffsetEnabled: false,
        
        // Small Body Belts - higher detail for more systems
        smallBodyDetail: "high",
        enableAsteroidBelts: true,
        beltDensity: 0.6,
        maxBeltsPerSystem: 2,
        beltPlacementMode: "both",
        beltStylePreset: "mainBelt",
        enableKuiperBelt: true,
        kuiperBeltDensity: 0.5,     // Higher KBO density
        kuiperBeltDistanceStyle: "wide",
        kuiperBeltInclination: 0.5, // More scattered

        enablePlanetaryRings: true,
        ringFrequency: 0.6,   // Many ringed worlds
        ringProminence: 0.6,
        ringStylePreset: "dramatic",

        enableComets: true,
        cometFrequency: 0.5,  // Moderate number of comets
        cometOrbitStyle: "mixed",
        cometActivity: 0.7,

        enableLagrangePoints: true,
        lagrangeMarkerMode: "all",
        trojanFrequency: 0.6,
        trojanRichness: 0.7,
        lagrangePairScope: "starPlanet",
      };
      
    case "superDenseExperimental":
      return {
        ...base,
        maxSystems: 50,
        maxStarsPerSystem: 3,
        maxDepth: 4,
        planetDensity: 0.2,
        moonDensity: 0.3,
        enableNarySystems: true,
        enableGroups: true,
        targetGalaxyCount: 8,
        groupStructureMode: "deepHierarchy",
        orbitEccentricityStyle: "eccentric",
        orbitInclinationMax: 45, // Wild, chaotic orbits
        orbitOffsetEnabled: true,
        
        // Small Body Belts - ultra detail but clamped for performance
        smallBodyDetail: "ultra",
        enableAsteroidBelts: true,
        beltDensity: 0.7, // High asteroid density
        maxBeltsPerSystem: 3,
        beltPlacementMode: "both",
        beltStylePreset: "heavyDebris",
        enableKuiperBelt: true,
        kuiperBeltDensity: 0.7,     // Dense Kuiper belt
        kuiperBeltDistanceStyle: "wide",
        kuiperBeltInclination: 0.8, // Highly scattered

        enablePlanetaryRings: true,
        ringFrequency: 0.9,
        ringProminence: 0.9,
        ringStylePreset: "dramatic",

        enableComets: true,
        cometFrequency: 0.8,   // Many comets
        cometOrbitStyle: "manyShort",
        cometActivity: 0.9,    // Very active tails

        enableLagrangePoints: true,
        lagrangeMarkerMode: "all",
        trojanFrequency: 0.8,
        trojanRichness: 0.9,
        lagrangePairScope: "both",  // Star-planet AND planet-moon pairs
      };
      
    default:
      return base;
  }
}

/**
 * Generate a random seed string
 */
export function generateRandomSeed(): string {
  return Math.random().toString(36).substring(2, 11);
}

