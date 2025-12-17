/**
 * Example usage and testing utilities for the procedural generator
 */

import { generateSolarSystem, generateMultipleSystems, DEFAULT_CONFIG, GeneratorConfig } from './procedural-generator';

// ============================================================================
// Preset Configurations
// ============================================================================

/**
 * Simple single-star system (high probability)
 */
export const SIMPLE_SYSTEM_CONFIG: Partial<GeneratorConfig> = {
  starProbabilities: [0.9, 0.08, 0.02],
  planetGeometricP: 0.5,
  moonGeometricP: 0.4,
  orbitGrowth: 1.6,
  enableGrouping: false,
};

/**
 * Multi-star heavy configuration (lots of binaries and ternaries)
 */
export const MULTI_STAR_CONFIG: Partial<GeneratorConfig> = {
  starProbabilities: [0.3, 0.5, 0.2],
  planetGeometricP: 0.35,
  moonGeometricP: 0.25,
  enableGrouping: false,
};

/**
 * Dense system with many moons
 */
export const MOON_RICH_CONFIG: Partial<GeneratorConfig> = {
  starProbabilities: [0.7, 0.25, 0.05],
  planetGeometricP: 0.3,
  moonGeometricP: 0.15, // Lower p = more moons
  orbitGrowth: 1.5,
  enableGrouping: false,
};

/**
 * Sparse, wide orbits
 */
export const SPARSE_SYSTEM_CONFIG: Partial<GeneratorConfig> = {
  starProbabilities: [0.8, 0.15, 0.05],
  planetGeometricP: 0.6, // Fewer planets
  moonGeometricP: 0.5,   // Fewer moons
  orbitGrowth: 2.2,      // Larger gaps
  orbitBase: 2.0,
  enableGrouping: false,
};

/**
 * Galaxy-scale with grouping
 */
export const GALAXY_CONFIG: Partial<GeneratorConfig> = {
  starProbabilities: [0.65, 0.25, 0.10],
  planetGeometricP: 0.4,
  moonGeometricP: 0.3,
  enableGrouping: true,
  numGroups: [5, 10],
  nestingProbability: 0.3,
  groupPositionSigma: 100.0,
};

/**
 * Minimal system (mostly single stars, few planets)
 */
export const MINIMAL_CONFIG: Partial<GeneratorConfig> = {
  starProbabilities: [0.95, 0.04, 0.01],
  planetGeometricP: 0.7,
  moonGeometricP: 0.7,
  orbitGrowth: 2.0,
  enableGrouping: false,
};

/**
 * Solar-like system with Kuiper belt
 */
export const KUIPER_BELT_CONFIG: Partial<GeneratorConfig> = {
  starProbabilities: [0.8, 0.15, 0.05],
  planetGeometricP: 0.4,
  moonGeometricP: 0.3,
  orbitGrowth: 1.8,
  enableGrouping: false,
  enableKuiperBelt: true,
  kuiperBeltDensity: 0.5,
  kuiperBeltRadialRange: [2.0, 3.5],
  kuiperBeltInclinationSigma: 1.5,
  kuiperBeltEccentricityRange: [0.0, 0.15],
  kuiperBeltAsteroidGeometricP: 0.25,
  kuiperBeltMinCount: 100,
  kuiperBeltMaxCount: 1500,
};

/**
 * Dense system with both main belts and Kuiper belt
 */
export const FULL_DEBRIS_CONFIG: Partial<GeneratorConfig> = {
  starProbabilities: [0.7, 0.25, 0.05],
  planetGeometricP: 0.35,
  moonGeometricP: 0.25,
  orbitGrowth: 1.7,
  enableGrouping: false,
  // Main asteroid belts
  enableAsteroidBelts: true,
  maxBeltsPerSystem: 2,
  beltPlacementMode: 'both',
  beltAsteroidGeometricP: 0.3,
  beltMinCount: 100,
  beltMaxCount: 800,
  // Kuiper belt
  enableKuiperBelt: true,
  kuiperBeltDensity: 0.6,
  kuiperBeltRadialRange: [2.5, 4.0],
  kuiperBeltInclinationSigma: 2.0,
  kuiperBeltAsteroidGeometricP: 0.22,
  kuiperBeltMinCount: 200,
  kuiperBeltMaxCount: 1500,
};

// ============================================================================
// Example Generation Functions
// ============================================================================

/**
 * Generate a simple solar system
 */
export function generateSimpleSystem(seed?: string | number) {
  return generateSolarSystem(seed, SIMPLE_SYSTEM_CONFIG);
}

/**
 * Generate a binary or ternary star system
 */
export function generateBinarySystem(seed?: string | number) {
  return generateSolarSystem(seed, MULTI_STAR_CONFIG);
}

/**
 * Generate a system with many moons
 */
export function generateMoonRichSystem(seed?: string | number) {
  return generateSolarSystem(seed, MOON_RICH_CONFIG);
}

/**
 * Generate a sparse, wide system
 */
export function generateSparseSystem(seed?: string | number) {
  return generateSolarSystem(seed, SPARSE_SYSTEM_CONFIG);
}

/**
 * Generate a mini-galaxy with multiple systems and groups
 */
export function generateGalaxy(numSystems: number = 10, seed?: string | number) {
  return generateMultipleSystems(numSystems, seed, GALAXY_CONFIG);
}

/**
 * Generate a minimal test system
 */
export function generateMinimalSystem(seed?: string | number) {
  return generateSolarSystem(seed, MINIMAL_CONFIG);
}

/**
 * Generate a system with Kuiper belt objects
 */
export function generateKuiperRichSystem(seed?: string | number) {
  return generateSolarSystem(seed, KUIPER_BELT_CONFIG);
}

/**
 * Generate a system with both asteroid belts and Kuiper belt
 */
export function generateFullDebrisSystem(seed?: string | number) {
  return generateSolarSystem(seed, FULL_DEBRIS_CONFIG);
}

/**
 * Young system with protoplanetary disk
 * Represents a star in the early stages of planet formation
 */
export const YOUNG_SYSTEM_CONFIG: Partial<GeneratorConfig> = {
  starProbabilities: [0.85, 0.12, 0.03],
  planetGeometricP: 0.5,  // Fewer planets (still forming)
  moonGeometricP: 0.5,    // Fewer moons
  orbitGrowth: 1.7,
  enableGrouping: false,
  // Enable protoplanetary disks
  enableProtoplanetaryDisks: true,
  protoplanetaryDiskProbability: 0.8,  // High probability for young systems
  protoplanetaryDiskInnerRadiusRange: [0.5, 1.5],
  protoplanetaryDiskOuterRadiusRange: [4.0, 10.0],
  protoplanetaryDiskThicknessRange: [0.3, 0.8],
  protoplanetaryDiskParticleCountRange: [10000, 25000],
  protoplanetaryDiskOpacityRange: [0.4, 0.7],
  protoplanetaryDiskBrightnessRange: [0.4, 0.8],
  protoplanetaryDiskClumpinessRange: [0.3, 0.6],
  protoplanetaryDiskRotationSpeedMultiplierRange: [0.15, 0.4],
  // Disable other debris (disks dominate in young systems)
  enableAsteroidBelts: false,
  enableKuiperBelt: false,
};

/**
 * Performance-friendly debris system with lower small body counts.
 * Useful for testing or lower-end hardware while still having
 * visually interesting belts.
 */
export const PERFORMANCE_DEBRIS_CONFIG: Partial<GeneratorConfig> = {
  starProbabilities: [0.8, 0.15, 0.05],
  planetGeometricP: 0.4,
  moonGeometricP: 0.3,
  orbitGrowth: 1.8,
  enableGrouping: false,
  // Main asteroid belts with lower counts
  enableAsteroidBelts: true,
  maxBeltsPerSystem: 1,
  beltPlacementMode: 'betweenPlanets',
  beltAsteroidGeometricP: 0.5,  // Higher p = fewer asteroids
  beltMinCount: 50,
  beltMaxCount: 200,
  // Kuiper belt with lower counts
  enableKuiperBelt: true,
  kuiperBeltDensity: 0.3,
  kuiperBeltRadialRange: [2.0, 3.0],
  kuiperBeltInclinationSigma: 1.0,
  kuiperBeltAsteroidGeometricP: 0.4,
  kuiperBeltMinCount: 50,
  kuiperBeltMaxCount: 300,
};

/**
 * Generate a performance-friendly debris system.
 * Lower small body counts but still visually interesting.
 */
export function generatePerformanceDebrisSystem(seed?: string | number) {
  return generateSolarSystem(seed, PERFORMANCE_DEBRIS_CONFIG);
}

/**
 * Generate a young system with a prominent protoplanetary disk
 */
export function generateYoungSystem(seed?: string | number) {
  return generateSolarSystem(seed, YOUNG_SYSTEM_CONFIG);
}

// ============================================================================
// Analysis Utilities
// ============================================================================

/**
 * Analyze generated system statistics
 */
export function analyzeSystem(data: {
  stars: Record<string, any>;
  rootIds: string[];
  groups: Record<string, any>;
  rootGroupIds: string[];
  belts?: Record<string, any>;
  smallBodyFields?: Record<string, any>;
  protoplanetaryDisks?: Record<string, any>;
}) {
  const stats = {
    totalStars: Object.keys(data.stars).length,
    rootSystems: data.rootIds.length,
    totalGroups: Object.keys(data.groups).length,
    rootGroups: data.rootGroupIds.length,
    
    // Count by type
    stars: 0,
    planets: 0,
    moons: 0,
    asteroids: 0,
    mainBeltAsteroids: 0,
    kuiperBeltObjects: 0,
    comets: 0,
    lagrangePoints: 0,
    trojanBodies: 0,
    
    // ============================================================================
    // Unified Small Body Stats (Particle Field Version)
    // ============================================================================
    totalSmallBodies: 0,        // Approximate particle count from fields
    totalSmallBodyBelts: 0,     // Total number of belt fields (main + Kuiper)
    totalMainBelts: 0,          // Number of main asteroid belt fields
    totalKuiperBelts: 0,        // Number of Kuiper belt fields
    totalSmallBodyParticles: 0, // Total approximate particles in all belt fields
    totalMainBeltParticles: 0,  // Particles in main belts
    totalKuiperBeltParticles: 0,// Particles in Kuiper belts
    
    // ============================================================================
    // Protoplanetary Disk Stats
    // ============================================================================
    totalProtoplanetaryDisks: 0,
    totalProtoplanetaryDiskParticles: 0,
    avgDiskInnerRadius: 0,
    avgDiskOuterRadius: 0,
    avgDiskThickness: 0,
    
    // Multi-star systems
    singleStar: 0,
    binaryStar: 0,
    ternaryStar: 0,
    
    // Depth statistics
    maxDepth: 0,
    avgDepth: 0,
    
    // Physical properties
    minMass: Infinity,
    maxMass: -Infinity,
    avgMass: 0,
    
    minRadius: Infinity,
    maxRadius: -Infinity,
    avgRadius: 0,

    // Ring statistics
    ringedPlanets: 0,
    totalRings: 0,
    
    // Comet orbital stats
    minCometEccentricity: Infinity,
    maxCometEccentricity: -Infinity,
    avgCometEccentricity: 0,
    
    // Rogue planet stats
    roguePlanets: 0,
    avgRogueSpeed: 0,
    minRogueSpeed: Infinity,
    maxRogueSpeed: -Infinity,
    
    // Black hole stats
    blackHoles: 0,
    blackHolesWithDisks: 0,
    blackHolesWithJets: 0,
    avgBlackHoleMass: 0,
    minBlackHoleMass: Infinity,
    maxBlackHoleMass: -Infinity,
  };
  
  const depths: number[] = [];
  let totalMass = 0;
  let totalRadius = 0;
  let cometEccentricities: number[] = [];
  let rogueSpeeds: number[] = [];
  
  // Analyze each star
  Object.values(data.stars).forEach((star: any) => {
    totalMass += star.mass;
    totalRadius += star.radius;
    
    stats.minMass = Math.min(stats.minMass, star.mass);
    stats.maxMass = Math.max(stats.maxMass, star.mass);
    stats.minRadius = Math.min(stats.minRadius, star.radius);
    stats.maxRadius = Math.max(stats.maxRadius, star.radius);
    
    // Count by body type
    if (star.isRoguePlanet) {
      // Rogue planets are counted separately
      stats.roguePlanets++;
      if (star.roguePlanet && star.roguePlanet.velocity) {
        const speed = Math.sqrt(
          star.roguePlanet.velocity.x ** 2 +
          star.roguePlanet.velocity.y ** 2 +
          star.roguePlanet.velocity.z ** 2
        );
        rogueSpeeds.push(speed);
        stats.minRogueSpeed = Math.min(stats.minRogueSpeed, speed);
        stats.maxRogueSpeed = Math.max(stats.maxRogueSpeed, speed);
      }
    } else if (star.bodyType === 'star' || (!star.bodyType && star.parentId === null)) {
      stats.stars++;
    } else if (star.bodyType === 'planet') {
      stats.planets++;
    } else if (star.bodyType === 'moon') {
      stats.moons++;
    } else if (star.bodyType === 'asteroid') {
      stats.asteroids++;
      // Distinguish main belt vs Kuiper belt
      if (star.asteroidSubType === 'kuiperBelt') {
        stats.kuiperBeltObjects++;
      } else if (star.asteroidSubType === 'mainBelt') {
        stats.mainBeltAsteroids++;
      }
    } else if (star.bodyType === 'comet') {
      stats.comets++;
      if (star.eccentricity !== undefined) {
        cometEccentricities.push(star.eccentricity);
        stats.minCometEccentricity = Math.min(stats.minCometEccentricity, star.eccentricity);
        stats.maxCometEccentricity = Math.max(stats.maxCometEccentricity, star.eccentricity);
      }
    } else if (star.bodyType === 'blackHole') {
      stats.blackHoles++;
      if (star.blackHole?.hasAccretionDisk) {
        stats.blackHolesWithDisks++;
      }
      if (star.blackHole?.hasRelativisticJet) {
        stats.blackHolesWithJets++;
      }
      stats.minBlackHoleMass = Math.min(stats.minBlackHoleMass, star.mass);
      stats.maxBlackHoleMass = Math.max(stats.maxBlackHoleMass, star.mass);
    }
    
    // Calculate depth
    let depth = 0;
    let current = star;
    while (current.parentId) {
      depth++;
      current = data.stars[current.parentId];
    }
    depths.push(depth);
    stats.maxDepth = Math.max(stats.maxDepth, depth);
    
    // Count by hierarchy level (for systems without bodyType)
    if (depth === 0 && !star.bodyType) {
      stats.stars++;
      
      // Count companion stars (siblings with same parent)
      if (star.children) {
        const companionCount = star.children.filter((childId: string) => {
          const child = data.stars[childId];
          return child && child.parentId === star.id && child.mass > 50;
        }).length;
        
        if (companionCount === 0) stats.singleStar++;
        else if (companionCount === 1) stats.binaryStar++;
        else if (companionCount === 2) stats.ternaryStar++;
      }
    } else if (depth === 1 && !star.bodyType) {
      // Could be companion star or planet (legacy systems without bodyType)
      if (star.mass > 50) stats.stars++;
      else stats.planets++;
    } else if (depth === 2 && !star.bodyType) {
      stats.moons++;
    }

    // Ring statistics
    if (star.bodyType === 'planet' && star.ring) {
      stats.ringedPlanets++;
      stats.totalRings++;
    }
  });
  
  stats.avgMass = totalMass / stats.totalStars;
  stats.avgRadius = totalRadius / stats.totalStars;
  stats.avgDepth = depths.reduce((a, b) => a + b, 0) / depths.length;
  
  // Comet eccentricity stats
  if (cometEccentricities.length > 0) {
    stats.avgCometEccentricity = cometEccentricities.reduce((a, b) => a + b, 0) / cometEccentricities.length;
  }
  
  // Rogue planet speed stats
  if (rogueSpeeds.length > 0) {
    stats.avgRogueSpeed = rogueSpeeds.reduce((a, b) => a + b, 0) / rogueSpeeds.length;
  } else {
    // Reset to 0 if no rogue planets found
    stats.minRogueSpeed = 0;
    stats.maxRogueSpeed = 0;
  }
  
  // Black hole stats
  if (stats.blackHoles > 0) {
    const blackHoleMasses = Object.values(data.stars)
      .filter((star: any) => star.bodyType === 'blackHole')
      .map((star: any) => star.mass);
    stats.avgBlackHoleMass = blackHoleMasses.reduce((a, b) => a + b, 0) / blackHoleMasses.length;
  } else {
    stats.minBlackHoleMass = 0;
    stats.maxBlackHoleMass = 0;
  }
  
  // Calculate unified small body stats from particle fields
  if (data.smallBodyFields) {
    const allFields = Object.values(data.smallBodyFields);
    stats.totalSmallBodyBelts = allFields.length;
    stats.totalMainBelts = allFields.filter((f: any) => f.beltType === 'main').length;
    stats.totalKuiperBelts = allFields.filter((f: any) => f.beltType === 'kuiper').length;
    
    // Calculate approximate particle counts
    stats.totalSmallBodyParticles = allFields.reduce((sum: number, f: any) => sum + (f.particleCount || 0), 0);
    stats.totalMainBeltParticles = allFields
      .filter((f: any) => f.beltType === 'main')
      .reduce((sum: number, f: any) => sum + (f.particleCount || 0), 0);
    stats.totalKuiperBeltParticles = allFields
      .filter((f: any) => f.beltType === 'kuiper')
      .reduce((sum: number, f: any) => sum + (f.particleCount || 0), 0);
    
    stats.totalSmallBodies = stats.totalSmallBodyParticles;
  } else if (data.belts) {
    // Legacy support for old belt format with individual asteroid entities
    const allBelts = Object.values(data.belts);
    stats.totalSmallBodyBelts = allBelts.length;
    stats.totalMainBelts = allBelts.filter((b: any) => b.beltType === 'main' || !b.beltType).length;
    stats.totalKuiperBelts = allBelts.filter((b: any) => b.beltType === 'kuiper').length;
    stats.totalSmallBodies = stats.mainBeltAsteroids + stats.kuiperBeltObjects;
  }
  
  // Calculate protoplanetary disk stats
  if (data.protoplanetaryDisks) {
    const allDisks = Object.values(data.protoplanetaryDisks);
    stats.totalProtoplanetaryDisks = allDisks.length;
    stats.totalProtoplanetaryDiskParticles = allDisks.reduce((sum: number, d: any) => sum + (d.particleCount || 0), 0);
    if (allDisks.length > 0) {
      stats.avgDiskInnerRadius = allDisks.reduce((sum: number, d: any) => sum + (d.innerRadius || 0), 0) / allDisks.length;
      stats.avgDiskOuterRadius = allDisks.reduce((sum: number, d: any) => sum + (d.outerRadius || 0), 0) / allDisks.length;
      stats.avgDiskThickness = allDisks.reduce((sum: number, d: any) => sum + (d.thickness || 0), 0) / allDisks.length;
    }
  }
  
  return stats;
}

/**
 * Validate generated system
 */
export function validateSystem(data: {
  stars: Record<string, any>;
  rootIds: string[];
  groups: Record<string, any>;
  rootGroupIds: string[];
  belts?: Record<string, any>;
  smallBodyFields?: Record<string, any>;
  protoplanetaryDisks?: Record<string, any>;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check all parentIds exist
  Object.values(data.stars).forEach((star: any) => {
    if (star.parentId && !data.stars[star.parentId]) {
      errors.push(`Star ${star.id} has invalid parentId: ${star.parentId}`);
    }
  });
  
  // Check for cycles in star hierarchy
  Object.values(data.stars).forEach((star: any) => {
    const visited = new Set<string>();
    let current = star;
    while (current.parentId) {
      if (visited.has(current.id)) {
        errors.push(`Cycle detected in star hierarchy at ${current.id}`);
        break;
      }
      visited.add(current.id);
      current = data.stars[current.parentId];
      if (!current) break;
    }
  });
  
  // Check rootIds are actually roots
  data.rootIds.forEach(rootId => {
    const star = data.stars[rootId];
    if (!star) {
      errors.push(`Root ID ${rootId} does not exist in stars`);
    } else if (star.parentId !== null) {
      errors.push(`Root star ${rootId} has non-null parentId: ${star.parentId}`);
    }
  });
  
  // Check children arrays are consistent
  Object.values(data.stars).forEach((star: any) => {
    star.children.forEach((childId: string) => {
      const child = data.stars[childId];
      if (!child) {
        errors.push(`Star ${star.id} has invalid child: ${childId}`);
      } else if (child.parentId !== star.id) {
        errors.push(`Star ${star.id} lists ${childId} as child, but child's parentId is ${child.parentId}`);
      }
    });
  });
  
  // Validate comet-specific data
  Object.values(data.stars).forEach((star: any) => {
    if (star.bodyType === 'comet') {
      // Check comet has valid eccentricity (should be high)
      if (star.eccentricity !== undefined && (star.eccentricity < 0 || star.eccentricity >= 1)) {
        errors.push(`Comet ${star.id} has invalid eccentricity: ${star.eccentricity} (should be 0 <= e < 1)`);
      }
      
      // Check comet metadata consistency
      if (star.comet) {
        const { perihelionDistance, aphelionDistance } = star.comet;
        if (perihelionDistance !== undefined && aphelionDistance !== undefined) {
          if (perihelionDistance >= aphelionDistance) {
            errors.push(`Comet ${star.id} has perihelion >= aphelion: ${perihelionDistance} >= ${aphelionDistance}`);
          }
        }
      }
    }
  });
  
  // Validate small body field data (particle-based belts)
  if (data.smallBodyFields) {
    Object.values(data.smallBodyFields).forEach((field: any) => {
      // Validate field geometry
      if (field.innerRadius >= field.outerRadius) {
        errors.push(`Small body field ${field.id} has innerRadius >= outerRadius: ${field.innerRadius} >= ${field.outerRadius}`);
      }
      if (field.thickness < 0) {
        errors.push(`Small body field ${field.id} has negative thickness: ${field.thickness}`);
      }
      if (field.particleCount < 0) {
        errors.push(`Small body field ${field.id} has negative particleCount: ${field.particleCount}`);
      }
      
      // Validate host star reference
      if (field.hostStarId && !data.stars[field.hostStarId]) {
        errors.push(`Small body field ${field.id} references non-existent host star: ${field.hostStarId}`);
      }
      
      // Validate Kuiper belts specifically
      if (field.beltType === 'kuiper') {
        // Verify Kuiper belts have icy properties
        if (!field.isIcy) {
          errors.push(`Kuiper belt field ${field.id} should have isIcy=true`);
        }
      }
      
      // Validate visual properties
      if (field.opacity < 0 || field.opacity > 1) {
        errors.push(`Small body field ${field.id} has invalid opacity: ${field.opacity} (should be 0-1)`);
      }
      if (field.brightness < 0) {
        errors.push(`Small body field ${field.id} has negative brightness: ${field.brightness}`);
      }
      if (field.clumpiness < 0 || field.clumpiness > 1) {
        errors.push(`Small body field ${field.id} has invalid clumpiness: ${field.clumpiness} (should be 0-1)`);
      }
    });
  }
  
  // Legacy: Validate old asteroid belt data (if present)
  if (data.belts) {
    Object.values(data.belts).forEach((belt: any) => {
      // Validate belt geometry
      if (belt.innerRadius >= belt.outerRadius) {
        errors.push(`Belt ${belt.id} has innerRadius >= outerRadius: ${belt.innerRadius} >= ${belt.outerRadius}`);
      }
      if (belt.thickness < 0) {
        errors.push(`Belt ${belt.id} has negative thickness: ${belt.thickness}`);
      }
      
      // Validate Kuiper belts specifically
      if (belt.beltType === 'kuiper') {
        // Verify Kuiper belts have icy properties
        if (!belt.isIcy) {
          errors.push(`Kuiper belt ${belt.id} should have isIcy=true`);
        }
        // Verify KBOs have correct subtype (only if asteroidIds exist)
        if (belt.asteroidIds) {
          belt.asteroidIds.forEach((asteroidId: string) => {
            const asteroid = data.stars[asteroidId];
            if (asteroid && asteroid.asteroidSubType !== 'kuiperBelt') {
              errors.push(`Asteroid ${asteroidId} in Kuiper belt ${belt.id} should have asteroidSubType='kuiperBelt'`);
            }
          });
        }
      }
      
      // Verify all asteroid IDs reference valid stars (only if asteroidIds exist)
      if (belt.asteroidIds) {
        belt.asteroidIds.forEach((asteroidId: string) => {
          const asteroid = data.stars[asteroidId];
          if (!asteroid) {
            errors.push(`Belt ${belt.id} references non-existent asteroid: ${asteroidId}`);
          } else if (asteroid.bodyType !== 'asteroid') {
            errors.push(`Belt ${belt.id} references non-asteroid body ${asteroidId} (type: ${asteroid.bodyType})`);
          } else if (asteroid.parentBeltId !== belt.id) {
            errors.push(`Asteroid ${asteroidId} parentBeltId mismatch (expected: ${belt.id}, got: ${asteroid.parentBeltId})`);
          }
        });
      }
    });
  }
  
  // Check group parentIds exist
  Object.values(data.groups).forEach((group: any) => {
    if (group.parentGroupId && !data.groups[group.parentGroupId]) {
      errors.push(`Group ${group.id} has invalid parentGroupId: ${group.parentGroupId}`);
    }
  });
  
  // Check for cycles in group hierarchy
  Object.values(data.groups).forEach((group: any) => {
    const visited = new Set<string>();
    let current = group;
    while (current.parentGroupId) {
      if (visited.has(current.id)) {
        errors.push(`Cycle detected in group hierarchy at ${current.id}`);
        break;
      }
      visited.add(current.id);
      current = data.groups[current.parentGroupId];
      if (!current) break;
    }
  });
  
  // Check heaviest star is center in each system
  // Note: Rogue planets are excluded from this check as they are not part of any system hierarchy
  data.rootIds.forEach(rootId => {
    const rootStar = data.stars[rootId];
    if (!rootStar) return;
    
    // Skip rogue planets (they are not system centers)
    if (rootStar.isRoguePlanet) return;
    
    // Get all direct children that might be stars
    const children = rootStar.children.map((id: string) => data.stars[id]).filter(Boolean);
    const companionStars = children.filter((child: any) => child.mass > 50 && !child.isRoguePlanet);
    
    // Check if any companion is heavier than root
    companionStars.forEach((companion: any) => {
      if (companion.mass > rootStar.mass) {
        errors.push(`In system ${rootId}, companion ${companion.id} (mass: ${companion.mass}) is heavier than center ${rootStar.id} (mass: ${rootStar.mass})`);
      }
    });
  });

  // Validate planetary rings
  Object.values(data.stars).forEach((star: any) => {
    if (star.ring) {
      const ring = star.ring;
      if (ring.innerRadiusMultiplier <= 1) {
        errors.push(
          `Ring on body ${star.id} has invalid innerRadiusMultiplier (must be > 1): ${ring.innerRadiusMultiplier}`
        );
      }
      if (ring.outerRadiusMultiplier <= ring.innerRadiusMultiplier) {
        errors.push(
          `Ring on body ${star.id} has outerRadiusMultiplier <= innerRadiusMultiplier`
        );
      }
      if (ring.thickness < 0) {
        errors.push(
          `Ring on body ${star.id} has negative thickness: ${ring.thickness}`
        );
      }
      if (ring.opacity < 0 || ring.opacity > 1) {
        errors.push(
          `Ring on body ${star.id} has opacity outside [0,1]: ${ring.opacity}`
        );
      }
    }
  });
  
  // Validate protoplanetary disks
  if (data.protoplanetaryDisks) {
    Object.values(data.protoplanetaryDisks).forEach((disk: any) => {
      // Validate disk geometry
      if (disk.innerRadius <= 0) {
        errors.push(`Protoplanetary disk ${disk.id} has non-positive innerRadius: ${disk.innerRadius}`);
      }
      if (disk.outerRadius <= disk.innerRadius) {
        errors.push(`Protoplanetary disk ${disk.id} has outerRadius <= innerRadius: ${disk.outerRadius} <= ${disk.innerRadius}`);
      }
      if (disk.thickness < 0) {
        errors.push(`Protoplanetary disk ${disk.id} has negative thickness: ${disk.thickness}`);
      }
      
      // Validate visual parameters
      if (disk.particleCount < 0) {
        errors.push(`Protoplanetary disk ${disk.id} has negative particleCount: ${disk.particleCount}`);
      }
      if (disk.opacity < 0 || disk.opacity > 1) {
        errors.push(`Protoplanetary disk ${disk.id} has opacity outside [0,1]: ${disk.opacity}`);
      }
      if (disk.brightness < 0) {
        errors.push(`Protoplanetary disk ${disk.id} has negative brightness: ${disk.brightness}`);
      }
      if (disk.clumpiness < 0 || disk.clumpiness > 1) {
        errors.push(`Protoplanetary disk ${disk.id} has clumpiness outside [0,1]: ${disk.clumpiness}`);
      }
      
      // Validate central star reference
      if (disk.centralStarId && !data.stars[disk.centralStarId]) {
        errors.push(`Protoplanetary disk ${disk.id} references non-existent central star: ${disk.centralStarId}`);
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Pretty print system structure
 */
export function printSystemStructure(data: {
  stars: Record<string, any>;
  rootIds: string[];
}) {
  const lines: string[] = [];
  
  function printStar(starId: string, indent: number = 0) {
    const star = data.stars[starId];
    if (!star) return;
    
    const prefix = '  '.repeat(indent);
    const type = star.mass > 50 ? '⭐' : star.mass > 5 ? '🌍' : '🌑';
    const info = `${type} ${star.name} (M=${star.mass.toFixed(1)}, R=${star.radius.toFixed(2)}, D=${star.orbitalDistance.toFixed(1)})`;
    
    lines.push(prefix + info);
    
    // Print children
    star.children.forEach((childId: string) => {
      printStar(childId, indent + 1);
    });
  }
  
  data.rootIds.forEach(rootId => {
    printStar(rootId);
    lines.push('');
  });
  
  return lines.join('\n');
}

// ============================================================================
// Test Suite
// ============================================================================

/**
 * Run all tests and return results
 */
export function runTests() {
  const results: { name: string; passed: boolean; stats?: any; errors?: string[] }[] = [];
  
  // Test 1: Simple system generation
  try {
    const system1 = generateSimpleSystem();
    const validation1 = validateSystem(system1);
    const stats1 = analyzeSystem(system1);
    results.push({
      name: 'Simple System',
      passed: validation1.valid,
      stats: stats1,
      errors: validation1.errors,
    });
  } catch (e) {
    results.push({
      name: 'Simple System',
      passed: false,
      errors: [String(e)],
    });
  }
  
  // Test 2: Binary system generation
  try {
    const system2 = generateBinarySystem();
    const validation2 = validateSystem(system2);
    const stats2 = analyzeSystem(system2);
    results.push({
      name: 'Binary/Ternary System',
      passed: validation2.valid,
      stats: stats2,
      errors: validation2.errors,
    });
  } catch (e) {
    results.push({
      name: 'Binary/Ternary System',
      passed: false,
      errors: [String(e)],
    });
  }
  
  // Test 3: Moon-rich system
  try {
    const system3 = generateMoonRichSystem();
    const validation3 = validateSystem(system3);
    const stats3 = analyzeSystem(system3);
    results.push({
      name: 'Moon-Rich System',
      passed: validation3.valid,
      stats: stats3,
      errors: validation3.errors,
    });
  } catch (e) {
    results.push({
      name: 'Moon-Rich System',
      passed: false,
      errors: [String(e)],
    });
  }
  
  // Test 4: Galaxy generation
  try {
    const galaxy = generateGalaxy(5);
    const validation4 = validateSystem(galaxy);
    const stats4 = analyzeSystem(galaxy);
    results.push({
      name: 'Galaxy (5 systems)',
      passed: validation4.valid,
      stats: stats4,
      errors: validation4.errors,
    });
  } catch (e) {
    results.push({
      name: 'Galaxy (5 systems)',
      passed: false,
      errors: [String(e)],
    });
  }
  
  // Test 5: Multiple generations (consistency check)
  try {
    for (let i = 0; i < 10; i++) {
      const system = generateSolarSystem();
      const validation = validateSystem(system);
      if (!validation.valid) {
        results.push({
          name: `Consistency Test (iteration ${i})`,
          passed: false,
          errors: validation.errors,
        });
        break;
      }
    }
    // If we get here, all passed
    if (!results.some(r => r.name.startsWith('Consistency Test'))) {
      results.push({
        name: 'Consistency Test (10 iterations)',
        passed: true,
        stats: { iterations: 10 },
      });
    }
  } catch (e) {
    results.push({
      name: 'Consistency Test',
      passed: false,
      errors: [String(e)],
    });
  }
  
  return results;
}

/**
 * Print test results to console
 */
export function printTestResults() {
  console.log('='.repeat(80));
  console.log('PROCEDURAL GENERATOR TEST SUITE');
  console.log('='.repeat(80));
  
  const results = runTests();
  
  results.forEach(result => {
    console.log('\n' + '-'.repeat(80));
    console.log(`Test: ${result.name}`);
    console.log(`Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (result.stats) {
      console.log('\nStatistics:');
      Object.entries(result.stats).forEach(([key, value]) => {
        console.log(`  ${key}: ${typeof value === 'number' ? value.toFixed(2) : value}`);
      });
    }
    
    if (result.errors && result.errors.length > 0) {
      console.log('\nErrors:');
      result.errors.forEach(error => {
        console.log(`  ❌ ${error}`);
      });
    }
  });
  
  console.log('\n' + '='.repeat(80));
  const passedCount = results.filter(r => r.passed).length;
  console.log(`SUMMARY: ${passedCount}/${results.length} tests passed`);
  console.log('='.repeat(80));
}

// ============================================================================
// Topology Preset Testing Utilities
// ============================================================================

import type { TopologyPresetId } from './topology';
import { getTopologyPresetIds } from './topology';

/**
 * Test that topology presets produce deterministic results.
 * Same seed + same preset = same topology structure.
 * 
 * @param seed - The seed to use for testing
 * @returns Object with test results per preset
 */
export function testTopologyDeterminism(seed: string = 'test-seed-123'): Record<TopologyPresetId, {
  deterministic: boolean;
  run1Stats: { stars: number; planets: number; moons: number };
  run2Stats: { stars: number; planets: number; moons: number };
}> {
  const results: Record<string, {
    deterministic: boolean;
    run1Stats: { stars: number; planets: number; moons: number };
    run2Stats: { stars: number; planets: number; moons: number };
  }> = {};
  
  const presetIds = getTopologyPresetIds();
  
  for (const presetId of presetIds) {
    // Generate with the same seed twice
    const config: Partial<GeneratorConfig> = {
      topologyPresetId: presetId,
    };
    
    const result1 = generateSolarSystem(seed, config);
    const result2 = generateSolarSystem(seed, config);
    
    // Count body types
    const countBodies = (system: ReturnType<typeof generateSolarSystem>) => {
      const all = Object.values(system.stars);
      return {
        stars: all.filter(s => s.bodyType === 'star').length,
        planets: all.filter(s => s.bodyType === 'planet').length,
        moons: all.filter(s => s.bodyType === 'moon').length,
      };
    };
    
    const stats1 = countBodies(result1);
    const stats2 = countBodies(result2);
    
    // Check if results are identical
    const deterministic = 
      stats1.stars === stats2.stars &&
      stats1.planets === stats2.planets &&
      stats1.moons === stats2.moons;
    
    results[presetId] = {
      deterministic,
      run1Stats: stats1,
      run2Stats: stats2,
    };
  }
  
  return results as Record<TopologyPresetId, typeof results[string]>;
}

/**
 * Compare topology outputs across different presets for a fixed seed.
 * This helps verify that different presets actually produce different results.
 * 
 * @param seed - The seed to use for testing
 * @returns Object with stats per preset
 */
export function compareTopologyPresets(seed: string = 'compare-seed-456'): Record<TopologyPresetId, {
  totalBodies: number;
  stars: number;
  planets: number;
  moons: number;
  avgMoonsPerPlanet: number;
}> {
  const results: Record<string, {
    totalBodies: number;
    stars: number;
    planets: number;
    moons: number;
    avgMoonsPerPlanet: number;
  }> = {};
  
  const presetIds = getTopologyPresetIds();
  
  for (const presetId of presetIds) {
    const config: Partial<GeneratorConfig> = {
      topologyPresetId: presetId,
    };
    
    const result = generateSolarSystem(seed, config);
    const all = Object.values(result.stars);
    
    const stars = all.filter(s => s.bodyType === 'star').length;
    const planets = all.filter(s => s.bodyType === 'planet').length;
    const moons = all.filter(s => s.bodyType === 'moon').length;
    
    results[presetId] = {
      totalBodies: all.length,
      stars,
      planets,
      moons,
      avgMoonsPerPlanet: planets > 0 ? moons / planets : 0,
    };
  }
  
  return results as Record<TopologyPresetId, typeof results[string]>;
}

/**
 * Print topology preset comparison to console
 */
export function printTopologyPresetComparison(seed: string = 'compare-seed-456') {
  console.log('='.repeat(80));
  console.log('TOPOLOGY PRESET COMPARISON');
  console.log(`Seed: ${seed}`);
  console.log('='.repeat(80));
  
  const comparison = compareTopologyPresets(seed);
  
  console.log('\n%-18s | %6s | %7s | %6s | %8s', 'Preset', 'Stars', 'Planets', 'Moons', 'Moon/Plt');
  console.log('-'.repeat(80));
  
  for (const [presetId, stats] of Object.entries(comparison)) {
    console.log('%-18s | %6d | %7d | %6d | %8.2f', 
      presetId, 
      stats.stars, 
      stats.planets, 
      stats.moons, 
      stats.avgMoonsPerPlanet
    );
  }
  
  console.log('\n' + '='.repeat(80));
  
  // Test determinism
  console.log('\nDeterminism Test:');
  const determinism = testTopologyDeterminism(seed);
  
  for (const [presetId, result] of Object.entries(determinism)) {
    console.log(`  ${presetId}: ${result.deterministic ? '✅ PASS' : '❌ FAIL'}`);
  }
  
  console.log('='.repeat(80));
}

