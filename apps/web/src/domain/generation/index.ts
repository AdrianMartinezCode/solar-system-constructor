/**
 * Domain Generation — barrel export.
 *
 * Canonical location for all procedural universe generation types and logic.
 */

// Types
export type { GenerationConfig, GeneratedUniverse } from './types';

// Procedural generator
export type { GeneratorConfig } from './proceduralGenerator';
export { generateSolarSystem, generateMultipleSystems, DEFAULT_CONFIG } from './proceduralGenerator';

// Config defaults & presets
export { defaultConfig, getPresetConfig, generateRandomSeed } from './configDefaults';

// Config mapper (UI → internal)
export { mapConfigToInternal, getSmallBodyDetailLabel, mapBlackHoleConfig } from './configMapper';

// Generation orchestrator
export { generateUniverse } from './generateUniverse';

// Stats computation
export type { GenerationStats, RawGenerationResult } from './stats';
export { computeGenerationStats } from './stats';
