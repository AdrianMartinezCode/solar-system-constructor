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
  
  enableGroups: false,
  targetGalaxyCount: 3,
  groupStructureMode: "flat",
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

