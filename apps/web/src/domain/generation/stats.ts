/**
 * Generation stats computation — pure function that aggregates
 * totals from raw procedural-generator output.
 */

import type { Star, SmallBodyField, ProtoplanetaryDisk, NebulaRegion, Group, AsteroidBelt } from '../../types';

// ============================================================================
// Types
// ============================================================================

/** Raw generator output shape (subset used by stats) */
export interface RawGenerationResult {
  stars: Record<string, Star>;
  rootIds: string[];
  groups: Record<string, Group>;
  rootGroupIds: string[];
  belts: Record<string, AsteroidBelt>;
  smallBodyFields?: Record<string, SmallBodyField>;
  protoplanetaryDisks?: Record<string, ProtoplanetaryDisk>;
  nebulae?: Record<string, NebulaRegion>;
}

/** All computed stats returned alongside the raw result */
export interface GenerationStats {
  totalStars: number;
  totalGroups: number;
  totalBelts: number;
  totalAsteroids: number;
  totalRingedPlanets: number;
  totalRings: number;
  totalComets: number;
  totalLagrangePoints: number;
  totalLagrangeMarkers: number;
  totalTrojanBodies: number;
  totalKuiperObjects: number;

  // Unified Small Body Stats
  totalSmallBodyBelts: number;
  totalSmallBodies: number;
  totalMainBelts: number;
  totalKuiperBelts: number;
  totalMainBeltAsteroids: number;
  totalSmallBodyParticles: number;
  totalMainBeltParticles: number;
  totalKuiperBeltParticles: number;

  // Protoplanetary Disks
  totalProtoplanetaryDisks: number;
  totalProtoplanetaryDiskParticles: number;

  // Nebulae
  totalNebulae: number;

  // Rogue Planets
  roguePlanetIds: string[];
  totalRoguePlanets: number;

  // Black Holes
  totalBlackHoles: number;
  totalBlackHolesWithDisks: number;
  totalBlackHolesWithJets: number;
  totalBlackHolesByType: {
    stellar: number;
    intermediate: number;
    supermassive: number;
  };
  avgBlackHoleSpin: number;
  minBlackHoleSpin: number;
  maxBlackHoleSpin: number;
  blackHolesWithPhotonRings: number;
  blackHolesWithQuasarAccretion: number;
}

// ============================================================================
// Pure computation
// ============================================================================

export function computeGenerationStats(result: RawGenerationResult): GenerationStats {
  const allStars = Object.values(result.stars);

  const totalRingedPlanets = allStars.filter(
    (star) => star.bodyType === 'planet' && star.ring,
  ).length;
  const totalRings = totalRingedPlanets;
  const totalComets = allStars.filter((star) => star.bodyType === 'comet').length;
  const totalLagrangePoints = allStars.filter((star) => star.bodyType === 'lagrangePoint').length;
  const totalLagrangeMarkers = totalLagrangePoints;
  const totalTrojanBodies = allStars.filter((star) => star.lagrangeHostId !== undefined).length;

  // Black hole stats
  const blackHoles = allStars.filter((star) => star.bodyType === 'blackHole');
  const totalBlackHoles = blackHoles.length;
  const totalBlackHolesWithDisks = blackHoles.filter(
    (bh) => bh.blackHole?.hasAccretionDisk,
  ).length;
  const totalBlackHolesWithJets = blackHoles.filter(
    (bh) => bh.blackHole?.hasRelativisticJet,
  ).length;

  const blackHolesByType = { stellar: 0, intermediate: 0, supermassive: 0 };
  let totalSpin = 0;
  let minSpin = Infinity;
  let maxSpin = -Infinity;
  let blackHolesWithPhotonRings = 0;

  blackHoles.forEach((bh) => {
    if (!bh.blackHole) return;
    if (bh.mass < 50) {
      blackHolesByType.stellar++;
    } else if (bh.mass < 10000) {
      blackHolesByType.intermediate++;
    } else {
      blackHolesByType.supermassive++;
    }
    const spin = bh.blackHole.spin;
    totalSpin += spin;
    minSpin = Math.min(minSpin, spin);
    maxSpin = Math.max(maxSpin, spin);
    if (bh.blackHole.hasPhotonRing) {
      blackHolesWithPhotonRings++;
    }
  });

  const avgBlackHoleSpin = totalBlackHoles > 0 ? totalSpin / totalBlackHoles : 0;
  const finalMinSpin = totalBlackHoles > 0 ? minSpin : 0;
  const finalMaxSpin = totalBlackHoles > 0 ? maxSpin : 0;

  // Legacy asteroid/KBO counts
  const totalKuiperObjects = allStars.filter((star) => star.asteroidSubType === 'kuiperBelt').length;
  const totalMainBeltAsteroidsLegacy = allStars.filter((star) => star.asteroidSubType === 'mainBelt').length;
  const totalAsteroids = totalMainBeltAsteroidsLegacy + totalKuiperObjects;

  // Unified Small Body Stats (Particle Field Version)
  const allFields = Object.values(result.smallBodyFields || {});
  const totalMainBelts = allFields.filter((field) => field.beltType === 'main').length;
  const totalKuiperBelts = allFields.filter((field) => field.beltType === 'kuiper').length;
  const totalSmallBodyBelts = totalMainBelts + totalKuiperBelts;

  const totalSmallBodyParticles = allFields.reduce((sum, field) => sum + field.particleCount, 0);
  const totalMainBeltParticles = allFields
    .filter((field) => field.beltType === 'main')
    .reduce((sum, field) => sum + field.particleCount, 0);
  const totalKuiperBeltParticles = allFields
    .filter((field) => field.beltType === 'kuiper')
    .reduce((sum, field) => sum + field.particleCount, 0);

  const totalSmallBodies =
    totalSmallBodyParticles > 0
      ? totalSmallBodyParticles
      : totalMainBeltAsteroidsLegacy + totalKuiperObjects;

  // Protoplanetary Disk Stats
  const allDisks = Object.values(result.protoplanetaryDisks || {});
  const totalProtoplanetaryDisks = allDisks.length;
  const totalProtoplanetaryDiskParticles = allDisks.reduce((sum, disk) => sum + disk.particleCount, 0);

  // Nebula Stats
  const allNebulae = Object.values(result.nebulae || {});
  const totalNebulae = allNebulae.length;

  // Rogue Planet Stats
  const roguePlanetIds = allStars
    .filter((star) => star.isRoguePlanet === true)
    .map((star) => star.id);
  const totalRoguePlanets = roguePlanetIds.length;

  return {
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
    totalSmallBodyBelts,
    totalSmallBodies,
    totalMainBelts,
    totalKuiperBelts,
    totalMainBeltAsteroids: totalMainBeltParticles > 0 ? totalMainBeltParticles : totalMainBeltAsteroidsLegacy,
    totalSmallBodyParticles,
    totalMainBeltParticles,
    totalKuiperBeltParticles,
    totalProtoplanetaryDisks,
    totalProtoplanetaryDiskParticles,
    totalNebulae,
    roguePlanetIds,
    totalRoguePlanets,
    totalBlackHoles,
    totalBlackHolesWithDisks,
    totalBlackHolesWithJets,
    totalBlackHolesByType: blackHolesByType,
    avgBlackHoleSpin,
    minBlackHoleSpin: finalMinSpin,
    maxBlackHoleSpin: finalMaxSpin,
    blackHolesWithPhotonRings,
    blackHolesWithQuasarAccretion: 0,
  };
}
