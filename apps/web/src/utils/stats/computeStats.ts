/**
 * Stats computation utilities for analytics dashboard
 * Pure functions for computing population stats, distributions, and metrics
 */

import { Star, Group, GroupChild, ProtoplanetaryDisk, SmallBodyField, NebulaRegion } from '../../types';

export interface PopulationCounts {
  total: number;
  stars: number;
  planets: number;
  moons: number;
  asteroids: number;
  comets: number;
  lagrangePoints: number;
  trojans: number;
  blackHoles: number;
  roguePlanets: number;
  ringedPlanets: number;
  groups: number;
  protoplanetaryDisks: number;
  smallBodyFields: number;
  nebulae: number;
  // Particle totals
  totalDiskParticles: number;
  totalFieldParticles: number;
  totalParticles: number;
}

export interface BlackHoleStats {
  total: number;
  withDisks: number;
  withJets: number;
  withPhotonRings: number;
  avgSpin: number;
  minSpin: number;
  maxSpin: number;
  stellarMass: number;
  intermediateMass: number;
  supermassiveMass: number;
}

export interface DistributionBucket {
  min: number;
  max: number;
  count: number;
  label: string;
}

export interface ScatterPoint {
  x: number;
  y: number;
  label?: string;
}

/**
 * Compute population counts from system data
 */
export function computePopulationCounts(
  stars: Record<string, Star>,
  groups: Record<string, Group>,
  protoplanetaryDisks: Record<string, ProtoplanetaryDisk>,
  smallBodyFields: Record<string, SmallBodyField>,
  nebulae: Record<string, NebulaRegion>,
  filterIds?: Set<string> // Optional filter for isolated view
): PopulationCounts {
  const starArray = Object.values(stars);
  const filtered = filterIds 
    ? starArray.filter(s => filterIds.has(s.id))
    : starArray;

  const starsCount = filtered.filter(s => 
    s.bodyType === 'star' || (s.parentId === null && !s.bodyType && !s.isRoguePlanet)
  ).length;

  const planetsCount = filtered.filter(s => s.bodyType === 'planet' && !s.isRoguePlanet).length;
  const moonsCount = filtered.filter(s => s.bodyType === 'moon').length;
  const asteroidsCount = filtered.filter(s => s.bodyType === 'asteroid').length;
  const cometsCount = filtered.filter(s => s.bodyType === 'comet').length;
  const lagrangePointsCount = filtered.filter(s => s.bodyType === 'lagrangePoint').length;
  const trojansCount = filtered.filter(s => s.lagrangeHostId).length;
  const blackHolesCount = filtered.filter(s => s.bodyType === 'blackHole' || s.blackHole).length;
  const roguePlanetsCount = filtered.filter(s => s.isRoguePlanet === true).length;
  const ringedPlanetsCount = filtered.filter(s => 
    (s.bodyType === 'planet' || !s.bodyType) && s.ring
  ).length;

  const disksCount = Object.keys(protoplanetaryDisks).length;
  const fieldsCount = Object.keys(smallBodyFields).length;
  const nebulaeCount = Object.keys(nebulae).length;
  const groupsCount = Object.keys(groups).length;

  const totalDiskParticles = Object.values(protoplanetaryDisks).reduce(
    (sum, disk) => sum + disk.particleCount, 0
  );
  const totalFieldParticles = Object.values(smallBodyFields).reduce(
    (sum, field) => sum + field.particleCount, 0
  );

  return {
    total: filtered.length + disksCount + fieldsCount + nebulaeCount,
    stars: starsCount,
    planets: planetsCount,
    moons: moonsCount,
    asteroids: asteroidsCount,
    comets: cometsCount,
    lagrangePoints: lagrangePointsCount,
    trojans: trojansCount,
    blackHoles: blackHolesCount,
    roguePlanets: roguePlanetsCount,
    ringedPlanets: ringedPlanetsCount,
    groups: groupsCount,
    protoplanetaryDisks: disksCount,
    smallBodyFields: fieldsCount,
    nebulae: nebulaeCount,
    totalDiskParticles,
    totalFieldParticles,
    totalParticles: totalDiskParticles + totalFieldParticles,
  };
}

/**
 * Compute black hole statistics
 */
export function computeBlackHoleStats(
  stars: Record<string, Star>,
  filterIds?: Set<string>
): BlackHoleStats {
  const starArray = Object.values(stars);
  const filtered = filterIds 
    ? starArray.filter(s => filterIds.has(s.id))
    : starArray;

  const blackHoles = filtered.filter(s => s.bodyType === 'blackHole' || s.blackHole);
  
  let totalSpin = 0;
  let minSpin = Infinity;
  let maxSpin = -Infinity;
  let withDisks = 0;
  let withJets = 0;
  let withPhotonRings = 0;
  let stellarMass = 0;
  let intermediateMass = 0;
  let supermassiveMass = 0;

  blackHoles.forEach(bh => {
    if (!bh.blackHole) return;
    
    const spin = bh.blackHole.spin;
    totalSpin += spin;
    minSpin = Math.min(minSpin, spin);
    maxSpin = Math.max(maxSpin, spin);

    if (bh.blackHole.hasAccretionDisk) withDisks++;
    if (bh.blackHole.hasRelativisticJet) withJets++;
    if (bh.blackHole.hasPhotonRing) withPhotonRings++;

    // Mass classification
    if (bh.mass < 50) stellarMass++;
    else if (bh.mass < 10000) intermediateMass++;
    else supermassiveMass++;
  });

  return {
    total: blackHoles.length,
    withDisks,
    withJets,
    withPhotonRings,
    avgSpin: blackHoles.length > 0 ? totalSpin / blackHoles.length : 0,
    minSpin: blackHoles.length > 0 ? minSpin : 0,
    maxSpin: blackHoles.length > 0 ? maxSpin : 0,
    stellarMass,
    intermediateMass,
    supermassiveMass,
  };
}

/**
 * Create histogram buckets for a numeric property
 */
export function createHistogram(
  values: number[],
  bucketCount: number = 10,
  minVal?: number,
  maxVal?: number
): DistributionBucket[] {
  if (values.length === 0) return [];

  const min = minVal ?? Math.min(...values);
  const max = maxVal ?? Math.max(...values);
  const range = max - min;
  const bucketSize = range / bucketCount;

  const buckets: DistributionBucket[] = [];
  for (let i = 0; i < bucketCount; i++) {
    const bucketMin = min + i * bucketSize;
    const bucketMax = min + (i + 1) * bucketSize;
    buckets.push({
      min: bucketMin,
      max: bucketMax,
      count: 0,
      label: `${bucketMin.toFixed(1)}-${bucketMax.toFixed(1)}`,
    });
  }

  values.forEach(val => {
    const bucketIndex = Math.min(
      Math.floor((val - min) / bucketSize),
      bucketCount - 1
    );
    if (bucketIndex >= 0) {
      buckets[bucketIndex].count++;
    }
  });

  return buckets;
}

/**
 * Compute semi-major axis distribution
 */
export function computeSemiMajorAxisDistribution(
  stars: Record<string, Star>,
  filterIds?: Set<string>,
  bucketCount: number = 10
): DistributionBucket[] {
  const starArray = Object.values(stars);
  const filtered = filterIds 
    ? starArray.filter(s => filterIds.has(s.id))
    : starArray;

  const values = filtered
    .filter(s => s.parentId !== null && !s.isRoguePlanet) // Only orbiting bodies
    .map(s => s.semiMajorAxis ?? s.orbitalDistance)
    .filter(v => v > 0);

  return createHistogram(values, bucketCount);
}

/**
 * Compute eccentricity distribution
 */
export function computeEccentricityDistribution(
  stars: Record<string, Star>,
  filterIds?: Set<string>,
  bucketCount: number = 10
): DistributionBucket[] {
  const starArray = Object.values(stars);
  const filtered = filterIds 
    ? starArray.filter(s => filterIds.has(s.id))
    : starArray;

  const values = filtered
    .filter(s => s.parentId !== null && s.eccentricity !== undefined)
    .map(s => s.eccentricity!);

  return createHistogram(values, bucketCount, 0, 1);
}

/**
 * Compute inclination distribution (using orbitRotX as proxy)
 */
export function computeInclinationDistribution(
  stars: Record<string, Star>,
  filterIds?: Set<string>,
  bucketCount: number = 10
): DistributionBucket[] {
  const starArray = Object.values(stars);
  const filtered = filterIds 
    ? starArray.filter(s => filterIds.has(s.id))
    : starArray;

  const values = filtered
    .filter(s => s.parentId !== null && s.orbitRotX !== undefined)
    .map(s => Math.abs(s.orbitRotX!));

  return createHistogram(values, bucketCount, 0, 90);
}

/**
 * Compute mass distribution
 */
export function computeMassDistribution(
  stars: Record<string, Star>,
  filterIds?: Set<string>,
  bucketCount: number = 10
): DistributionBucket[] {
  const starArray = Object.values(stars);
  const filtered = filterIds 
    ? starArray.filter(s => filterIds.has(s.id))
    : starArray;

  const values = filtered.map(s => s.mass);
  
  // Use log scale for mass since it varies by orders of magnitude
  const logValues = values.map(v => Math.log10(v + 1));
  const buckets = createHistogram(logValues, bucketCount);
  
  // Convert labels back to linear scale
  buckets.forEach(bucket => {
    bucket.label = `${Math.pow(10, bucket.min).toFixed(1)}-${Math.pow(10, bucket.max).toFixed(1)}`;
  });

  return buckets;
}

/**
 * Create scatter plot data: semi-major axis vs eccentricity
 */
export function createOrbitalScatterData(
  stars: Record<string, Star>,
  filterIds?: Set<string>,
  maxPoints: number = 200
): ScatterPoint[] {
  const starArray = Object.values(stars);
  const filtered = filterIds 
    ? starArray.filter(s => filterIds.has(s.id))
    : starArray;

  const points = filtered
    .filter(s => 
      s.parentId !== null && 
      !s.isRoguePlanet &&
      s.eccentricity !== undefined &&
      (s.semiMajorAxis || s.orbitalDistance)
    )
    .map(s => ({
      x: s.semiMajorAxis ?? s.orbitalDistance,
      y: s.eccentricity!,
      label: s.name,
    }));

  // Downsample if needed
  if (points.length > maxPoints) {
    const step = Math.ceil(points.length / maxPoints);
    return points.filter((_, i) => i % step === 0);
  }

  return points;
}

/**
 * Compute rogue planet statistics
 */
export function computeRoguePlanetStats(
  stars: Record<string, Star>,
  filterIds?: Set<string>
): {
  total: number;
  linearTrajectories: number;
  curvedTrajectories: number;
  avgSpeed: number;
  avgCurvature: number;
} {
  const starArray = Object.values(stars);
  const filtered = filterIds 
    ? starArray.filter(s => filterIds.has(s.id))
    : starArray;

  const rogues = filtered.filter(s => s.isRoguePlanet);
  
  let linearCount = 0;
  let curvedCount = 0;
  let totalSpeed = 0;
  let totalCurvature = 0;

  rogues.forEach(rogue => {
    if (!rogue.roguePlanet) return;

    const curvature = rogue.roguePlanet.pathCurvature ?? 0;
    if (curvature > 0.1) {
      curvedCount++;
    } else {
      linearCount++;
    }
    totalCurvature += curvature;

    const vel = rogue.roguePlanet.velocity;
    const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z);
    totalSpeed += speed;
  });

  return {
    total: rogues.length,
    linearTrajectories: linearCount,
    curvedTrajectories: curvedCount,
    avgSpeed: rogues.length > 0 ? totalSpeed / rogues.length : 0,
    avgCurvature: rogues.length > 0 ? totalCurvature / rogues.length : 0,
  };
}

/**
 * Compute group metrics
 */
export function computeGroupMetrics(
  groups: Record<string, Group>,
  _stars: Record<string, Star>
): {
  totalGroups: number;
  avgSystemsPerGroup: number;
  maxDepth: number;
  largestGroupSize: number;
} {
  const groupArray = Object.values(groups);
  
  if (groupArray.length === 0) {
    return {
      totalGroups: 0,
      avgSystemsPerGroup: 0,
      maxDepth: 0,
      largestGroupSize: 0,
    };
  }

  let totalSystems = 0;
  let maxDepth = 0;
  let largestSize = 0;

  groupArray.forEach(group => {
    const systemCount = group.children.filter((c: GroupChild) => c.type === 'system').length;
    totalSystems += systemCount;
    largestSize = Math.max(largestSize, group.children.length);
  });

  // Compute max depth by traversing hierarchy
  const computeDepth = (groupId: string, currentDepth: number = 0): number => {
    const group = groups[groupId];
    if (!group) return currentDepth;
    
    let maxChildDepth = currentDepth;
    group.children.forEach((child: GroupChild) => {
      if (child.type === 'group') {
        const childDepth = computeDepth(child.id, currentDepth + 1);
        maxChildDepth = Math.max(maxChildDepth, childDepth);
      }
    });
    return maxChildDepth;
  };

  groupArray.forEach(group => {
    if (!group.parentGroupId) {
      const depth = computeDepth(group.id);
      maxDepth = Math.max(maxDepth, depth);
    }
  });

  return {
    totalGroups: groupArray.length,
    avgSystemsPerGroup: totalSystems / groupArray.length,
    maxDepth,
    largestGroupSize: largestSize,
  };
}

