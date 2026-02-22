/**
 * Top-level generation orchestrator.
 *
 * Wires together: config mapping → procedural generator → stats aggregation.
 */

import type { GenerationConfig, GeneratedUniverse } from './types';
import { mapConfigToInternal } from './configMapper';
import { generateSolarSystem, generateMultipleSystems } from './proceduralGenerator';
import { computeGenerationStats } from './stats';

/**
 * Main generation function — domain-pure.
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
  const seed = config.seed || undefined;

  let result;
  if (config.maxSystems === 1) {
    result = generateSolarSystem(seed, internalConfig);
  } else {
    result = generateMultipleSystems(config.maxSystems, seed, internalConfig);
  }

  // Compute stats
  const stats = computeGenerationStats(result);

  console.log('[generateUniverse] Small body field stats:', {
    totalFields: (stats.totalMainBelts + stats.totalKuiperBelts),
    totalMainBelts: stats.totalMainBelts,
    totalKuiperBelts: stats.totalKuiperBelts,
    totalSmallBodyParticles: stats.totalSmallBodyParticles,
    totalMainBeltParticles: stats.totalMainBeltParticles,
    totalKuiperBeltParticles: stats.totalKuiperBeltParticles,
  });

  return {
    ...result,
    ...stats,
    protoplanetaryDisks: result.protoplanetaryDisks,
    nebulae: result.nebulae,
    smallBodyFields: result.smallBodyFields,
    generatedAt: new Date(),
  };
}
