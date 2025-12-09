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

  // Protoplanetary disks defaults (disabled by default)
  enableProtoplanetaryDisks: false,
  protoplanetaryDiskPresence: 0,
  protoplanetaryDiskDensity: 0.5,
  protoplanetaryDiskProminence: 0.5,

  // Nebulae regions defaults (disabled by default)
  enableNebulae: false,
  nebulaDensity: 0.5,
  nebulaSizeBias: 'medium',
  nebulaColorStyle: 'random',
  nebulaBrightness: 0.7,

  // Rogue planets defaults (disabled by default)
  enableRoguePlanets: false,
  roguePlanetFrequency: 0,
  roguePlanetOrbitStyle: 'mixed',
  roguePlanetVisibility: 0.5,
  
  // Rogue trajectory defaults (linear only for backwards compatibility)
  rogueTrajectoryMode: 'linearOnly',
  rogueCurvatureMin: 0,
  rogueCurvatureMax: 0,
  rogueTrajectoryShow: true,
  rogueTrajectoryPreviewLength: 0.5,
  
  // Black holes defaults (disabled by default - exotic feature)
  enableBlackHoles: false,
  blackHoleFrequency: 0.5, // Default to 50% when enabled
  blackHoleAccretionIntensity: 0.7,
  blackHoleJetFrequency: 0.6,
  blackHoleVisualComplexity: 'normal',
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

        // Protoplanetary disks - disabled for sparse preset
        enableProtoplanetaryDisks: false,
        protoplanetaryDiskPresence: 0,
        protoplanetaryDiskDensity: 0.3,
        protoplanetaryDiskProminence: 0.3,

        // Nebulae - disabled for sparse preset
        enableNebulae: false,
        nebulaDensity: 0,
        nebulaSizeBias: 'small',
        nebulaColorStyle: 'random',
        nebulaBrightness: 0.5,

        // Rogue planets - disabled for sparse preset
        enableRoguePlanets: false,
        roguePlanetFrequency: 0,
        roguePlanetOrbitStyle: 'slowDrifters',
        roguePlanetVisibility: 0.3,
        
        // Rogue trajectories - linear only for sparse
        rogueTrajectoryMode: 'linearOnly',
        rogueCurvatureMin: 0,
        rogueCurvatureMax: 0,
        rogueTrajectoryShow: false,
        rogueTrajectoryPreviewLength: 0.3,
        
        // Black holes - disabled for sparse preset
        enableBlackHoles: false,
        blackHoleFrequency: 0,
        blackHoleAccretionIntensity: 0.5,
        blackHoleJetFrequency: 0.5,
        blackHoleVisualComplexity: 'minimal',
        
        // Advanced black hole settings (sparse = ultra rare if enabled)
        blackHoleMassProfile: 'stellarOnly',
        blackHoleSpinLevel: 0.3,
        blackHoleDiskThicknessLevel: 0.3,
        blackHoleDiskClumpinessLevel: 0.3,
        blackHoleJetDramaLevel: 0.3,
        blackHoleFxIntensity: 0.2,
        blackHoleRarityStyle: 'ultraRare',
        blackHoleAccretionStyle: 'subtle',
        blackHoleAllowMultiplePerSystem: false,
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

        // Protoplanetary disks - disabled for mature systems (like our solar system)
        enableProtoplanetaryDisks: false,
        protoplanetaryDiskPresence: 0,
        protoplanetaryDiskDensity: 0.5,
        protoplanetaryDiskProminence: 0.5,

        // Nebulae - moderate presence for visual interest
        enableNebulae: true,
        nebulaDensity: 0.2,  // Few nebulae
        nebulaSizeBias: 'small',
        nebulaColorStyle: 'mixed',
        nebulaBrightness: 0.5,

        // Rogue planets - low frequency, slow drifters
        enableRoguePlanets: true,
        roguePlanetFrequency: 0.2,  // Few rogues
        roguePlanetOrbitStyle: 'slowDrifters',
        roguePlanetVisibility: 0.5,
        
        // Rogue trajectories - mostly linear with gentle curves
        rogueTrajectoryMode: 'mixed',
        rogueCurvatureMin: 0,
        rogueCurvatureMax: 0.3,
        rogueTrajectoryShow: true,
        rogueTrajectoryPreviewLength: 0.5,
        
        // Black holes - rare exotic addition
        enableBlackHoles: false,
        blackHoleFrequency: 0,
        blackHoleAccretionIntensity: 0.6,
        blackHoleJetFrequency: 0.4,
        blackHoleVisualComplexity: 'normal',
        
        // Advanced black hole settings (solar-like = rare, realistic)
        blackHoleMassProfile: 'stellarOnly',
        blackHoleSpinLevel: 0.5,
        blackHoleDiskThicknessLevel: 0.4,
        blackHoleDiskClumpinessLevel: 0.5,
        blackHoleJetDramaLevel: 0.4,
        blackHoleFxIntensity: 0.5,
        blackHoleRarityStyle: 'rare',
        blackHoleAccretionStyle: 'normal',
        blackHoleAllowMultiplePerSystem: false,
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

        // Protoplanetary disks - occasional young systems
        enableProtoplanetaryDisks: true,
        protoplanetaryDiskPresence: 0.2,  // 20% chance of young systems
        protoplanetaryDiskDensity: 0.5,
        protoplanetaryDiskProminence: 0.6,

        // Nebulae - moderate to high presence for visual richness
        enableNebulae: true,
        nebulaDensity: 0.2,  // Moderate nebula count
        nebulaSizeBias: 'small',
        nebulaColorStyle: 'mixed',
        nebulaBrightness: 0.5,

        // Rogue planets - medium frequency, mixed styles
        enableRoguePlanets: true,
        roguePlanetFrequency: 0.5,  // Moderate rogues
        roguePlanetOrbitStyle: 'mixed',
        roguePlanetVisibility: 0.6,
        
        // Rogue trajectories - more curved paths
        rogueTrajectoryMode: 'mixed',
        rogueCurvatureMin: 0,
        rogueCurvatureMax: 0.6,
        rogueTrajectoryShow: true,
        rogueTrajectoryPreviewLength: 0.6,
        
        // Black holes - occasional exotic systems
        enableBlackHoles: false,
        blackHoleFrequency: 0,
        blackHoleAccretionIntensity: 0.7,
        blackHoleJetFrequency: 0.6,
        blackHoleVisualComplexity: 'normal',
        
        // Advanced black hole settings (crowded = more variety, dramatic)
        blackHoleMassProfile: 'mixed',
        blackHoleSpinLevel: 0.6,
        blackHoleDiskThicknessLevel: 0.6,
        blackHoleDiskClumpinessLevel: 0.7,
        blackHoleJetDramaLevel: 0.7,
        blackHoleFxIntensity: 0.7,
        blackHoleRarityStyle: 'rare',
        blackHoleAccretionStyle: 'normal',
        blackHoleAllowMultiplePerSystem: false,
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

        // Protoplanetary disks - dramatic visual demo with bright disks
        enableProtoplanetaryDisks: true,
        protoplanetaryDiskPresence: 0.5,  // 50% chance of young systems
        protoplanetaryDiskDensity: 0.8,   // High particle count
        protoplanetaryDiskProminence: 0.9, // Very visible

        // Nebulae - high density for dramatic visual effect
        enableNebulae: true,
        nebulaDensity: 0.2,  // Many overlapping nebulae
        nebulaSizeBias: 'small',
        nebulaColorStyle: 'mixed',
        nebulaBrightness: 0.5,

        // Rogue planets - high frequency, fast intruders, visually distinct
        enableRoguePlanets: true,
        roguePlanetFrequency: 0.8,  // Many rogues
        roguePlanetOrbitStyle: 'fastIntruders',
        roguePlanetVisibility: 0.9,
        
        // Rogue trajectories - highly curved, elliptical paths
        rogueTrajectoryMode: 'curved',
        rogueCurvatureMin: 0.3,
        rogueCurvatureMax: 1.0,
        rogueTrajectoryShow: true,
        rogueTrajectoryPreviewLength: 0.8,
        
        // Black holes - rare but dramatic when present
        enableBlackHoles: false,
        blackHoleFrequency: 0,
        blackHoleAccretionIntensity: 0.9,
        blackHoleJetFrequency: 0.8,
        blackHoleVisualComplexity: 'cinematic',
        
        // Advanced black hole settings (super dense = extreme, varied, dramatic)
        blackHoleMassProfile: 'supermassiveCentres',
        blackHoleSpinLevel: 0.8,
        blackHoleDiskThicknessLevel: 0.7,
        blackHoleDiskClumpinessLevel: 0.8,
        blackHoleJetDramaLevel: 0.9,
        blackHoleFxIntensity: 0.9,
        blackHoleRarityStyle: 'common',
        blackHoleAccretionStyle: 'quasar',
        blackHoleAllowMultiplePerSystem: true,
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

