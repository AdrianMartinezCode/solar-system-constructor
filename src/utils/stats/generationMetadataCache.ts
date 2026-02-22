/**
 * Lightweight cache for last generation metadata
 * Stores the most recent generation config and totals for display in stats
 */

import type { GenerationConfig, GeneratedUniverse } from '../../domain/generation';

interface GenerationMetadata {
  config: GenerationConfig;
  totals: {
    totalStars: number;
    totalGroups: number;
    totalBlackHoles: number;
    totalBlackHolesWithDisks: number;
    totalBlackHolesWithJets: number;
    totalBlackHolesByType: { stellar: number; intermediate: number; supermassive: number };
    avgBlackHoleSpin: number;
    minBlackHoleSpin: number;
    maxBlackHoleSpin: number;
    blackHolesWithPhotonRings: number;
    totalProtoplanetaryDisks: number;
    totalProtoplanetaryDiskParticles: number;
    totalNebulae: number;
    totalRoguePlanets: number;
    totalSmallBodyBelts: number;
    totalSmallBodyParticles: number;
    totalMainBeltParticles: number;
    totalKuiperBeltParticles: number;
    totalRingedPlanets: number;
    totalComets: number;
    totalLagrangePoints: number;
    totalTrojanBodies: number;
  };
  generatedAt: Date;
}

let cachedMetadata: GenerationMetadata | null = null;

/**
 * Store generation metadata
 */
export function cacheGenerationMetadata(config: GenerationConfig, result: GeneratedUniverse): void {
  cachedMetadata = {
    config,
    totals: {
      totalStars: result.totalStars,
      totalGroups: result.totalGroups,
      totalBlackHoles: result.totalBlackHoles || 0,
      totalBlackHolesWithDisks: result.totalBlackHolesWithDisks || 0,
      totalBlackHolesWithJets: result.totalBlackHolesWithJets || 0,
      totalBlackHolesByType: result.totalBlackHolesByType || { stellar: 0, intermediate: 0, supermassive: 0 },
      avgBlackHoleSpin: result.avgBlackHoleSpin || 0,
      minBlackHoleSpin: result.minBlackHoleSpin || 0,
      maxBlackHoleSpin: result.maxBlackHoleSpin || 0,
      blackHolesWithPhotonRings: result.blackHolesWithPhotonRings || 0,
      totalProtoplanetaryDisks: result.totalProtoplanetaryDisks || 0,
      totalProtoplanetaryDiskParticles: result.totalProtoplanetaryDiskParticles || 0,
      totalNebulae: result.totalNebulae || 0,
      totalRoguePlanets: result.totalRoguePlanets || 0,
      totalSmallBodyBelts: result.totalSmallBodyBelts || 0,
      totalSmallBodyParticles: result.totalSmallBodyParticles || 0,
      totalMainBeltParticles: result.totalMainBeltParticles || 0,
      totalKuiperBeltParticles: result.totalKuiperBeltParticles || 0,
      totalRingedPlanets: result.totalRingedPlanets || 0,
      totalComets: result.totalComets || 0,
      totalLagrangePoints: result.totalLagrangePoints || 0,
      totalTrojanBodies: result.totalTrojanBodies || 0,
    },
    generatedAt: result.generatedAt || new Date(),
  };
}

/**
 * Get cached generation metadata
 */
export function getGenerationMetadata(): GenerationMetadata | null {
  return cachedMetadata;
}

/**
 * Clear cached metadata
 */
export function clearGenerationMetadata(): void {
  cachedMetadata = null;
}

