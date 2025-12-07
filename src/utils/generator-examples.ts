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
  };
  
  const depths: number[] = [];
  let totalMass = 0;
  let totalRadius = 0;
  
  // Analyze each star
  Object.values(data.stars).forEach((star: any) => {
    totalMass += star.mass;
    totalRadius += star.radius;
    
    stats.minMass = Math.min(stats.minMass, star.mass);
    stats.maxMass = Math.max(stats.maxMass, star.mass);
    stats.minRadius = Math.min(stats.minRadius, star.radius);
    stats.maxRadius = Math.max(stats.maxRadius, star.radius);
    
    // Calculate depth
    let depth = 0;
    let current = star;
    while (current.parentId) {
      depth++;
      current = data.stars[current.parentId];
    }
    depths.push(depth);
    stats.maxDepth = Math.max(stats.maxDepth, depth);
    
    // Count by hierarchy level
    if (depth === 0) {
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
    } else if (depth === 1) {
      // Could be companion star or planet
      if (star.mass > 50) stats.stars++;
      else stats.planets++;
    } else if (depth === 2) {
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
  data.rootIds.forEach(rootId => {
    const rootStar = data.stars[rootId];
    if (!rootStar) return;
    
    // Get all direct children that might be stars
    const children = rootStar.children.map((id: string) => data.stars[id]).filter(Boolean);
    const companionStars = children.filter((child: any) => child.mass > 50);
    
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

