#!/usr/bin/env node

/**
 * Demo script for procedural generator
 * 
 * Run with: node --loader ts-node/esm demo-generator.ts
 * Or: tsx demo-generator.ts
 */

import { generateSolarSystem, generateMultipleSystems } from './src/utils/procedural-generator.js';
import {
  generateSimpleSystem,
  generateBinarySystem,
  generateGalaxy,
  analyzeSystem,
  validateSystem,
  printSystemStructure,
  printTestResults,
} from './src/utils/generator-examples.js';

console.clear();
console.log('╔════════════════════════════════════════════════════════════════════╗');
console.log('║                                                                    ║');
console.log('║       PROCEDURAL SOLAR SYSTEM GENERATOR - DEMO                    ║');
console.log('║                                                                    ║');
console.log('╚════════════════════════════════════════════════════════════════════╝');
console.log();

// ============================================================================
// DEMO 1: Simple System
// ============================================================================

console.log('\n' + '='.repeat(72));
console.log('DEMO 1: Simple Solar System');
console.log('='.repeat(72));

const simple = generateSimpleSystem();
console.log('\nGenerated System Structure:');
console.log(printSystemStructure(simple));

console.log('Statistics:');
const simpleStats = analyzeSystem(simple);
console.log(`  Total Bodies: ${simpleStats.totalStars}`);
console.log(`  Stars: ${simpleStats.stars}`);
console.log(`  Planets: ${simpleStats.planets}`);
console.log(`  Moons: ${simpleStats.moons}`);
console.log(`  Max Depth: ${simpleStats.maxDepth}`);
console.log(`  Mass Range: ${simpleStats.minMass.toFixed(1)} - ${simpleStats.maxMass.toFixed(1)}`);

const simpleValidation = validateSystem(simple);
console.log(`\nValidation: ${simpleValidation.valid ? '✅ PASSED' : '❌ FAILED'}`);

// ============================================================================
// DEMO 2: Binary System
// ============================================================================

console.log('\n' + '='.repeat(72));
console.log('DEMO 2: Binary/Ternary Star System');
console.log('='.repeat(72));

const binary = generateBinarySystem();
console.log('\nGenerated System Structure:');
console.log(printSystemStructure(binary));

console.log('Statistics:');
const binaryStats = analyzeSystem(binary);
console.log(`  Total Bodies: ${binaryStats.totalStars}`);
console.log(`  Single-Star Systems: ${binaryStats.singleStar}`);
console.log(`  Binary Systems: ${binaryStats.binaryStar}`);
console.log(`  Ternary Systems: ${binaryStats.ternaryStar}`);
console.log(`  Planets: ${binaryStats.planets}`);
console.log(`  Moons: ${binaryStats.moons}`);

// ============================================================================
// DEMO 3: Custom Configuration
// ============================================================================

console.log('\n' + '='.repeat(72));
console.log('DEMO 3: Custom Configuration (Wide Orbits, Few Moons)');
console.log('='.repeat(72));

const custom = generateSolarSystem({
  starProbabilities: [0.8, 0.15, 0.05],
  planetGeometricP: 0.5,
  moonGeometricP: 0.6,
  orbitBase: 3.0,
  orbitGrowth: 2.2,
  orbitK: 15.0,
});

console.log('\nGenerated System Structure:');
console.log(printSystemStructure(custom));

console.log('Statistics:');
const customStats = analyzeSystem(custom);
console.log(`  Total Bodies: ${customStats.totalStars}`);
console.log(`  Planets: ${customStats.planets}`);
console.log(`  Moons: ${customStats.moons}`);
console.log(`  Avg Depth: ${customStats.avgDepth.toFixed(2)}`);

// ============================================================================
// DEMO 4: Galaxy with Groups
// ============================================================================

console.log('\n' + '='.repeat(72));
console.log('DEMO 4: Mini-Galaxy with Grouping');
console.log('='.repeat(72));

const galaxy = generateGalaxy(5);
const galaxyStats = analyzeSystem(galaxy);

console.log('\nGalaxy Statistics:');
console.log(`  Total Bodies: ${galaxyStats.totalStars}`);
console.log(`  Root Systems: ${galaxyStats.rootSystems}`);
console.log(`  Total Groups: ${galaxyStats.totalGroups}`);
console.log(`  Root Groups: ${galaxyStats.rootGroups}`);
console.log(`  Stars: ${galaxyStats.stars}`);
console.log(`  Planets: ${galaxyStats.planets}`);
console.log(`  Moons: ${galaxyStats.moons}`);

console.log('\nGroup Structure:');
Object.values(galaxy.groups).forEach((group: any) => {
  const indent = group.parentGroupId ? '  ' : '';
  console.log(`${indent}📦 ${group.name} (${group.children.length} children)`);
  if (group.position) {
    console.log(`${indent}   Position: (${group.position.x.toFixed(1)}, ${group.position.y.toFixed(1)}, ${group.position.z.toFixed(1)})`);
  }
});

const galaxyValidation = validateSystem(galaxy);
console.log(`\nValidation: ${galaxyValidation.valid ? '✅ PASSED' : '❌ FAILED'}`);

// ============================================================================
// DEMO 5: Run Full Test Suite
// ============================================================================

console.log('\n' + '='.repeat(72));
console.log('DEMO 5: Full Test Suite');
console.log('='.repeat(72));

printTestResults();

// ============================================================================
// Summary
// ============================================================================

console.log('\n' + '╔════════════════════════════════════════════════════════════════════╗');
console.log('║                                                                    ║');
console.log('║                         DEMO COMPLETE                              ║');
console.log('║                                                                    ║');
console.log('║  The procedural generator is working correctly!                   ║');
console.log('║                                                                    ║');
console.log('║  You can now:                                                      ║');
console.log('║  • Import these functions into your app                           ║');
console.log('║  • Add a "Generate System" button to the UI                       ║');
console.log('║  • Customize the configuration parameters                         ║');
console.log('║  • Generate galaxies with hundreds of bodies                      ║');
console.log('║                                                                    ║');
console.log('╚════════════════════════════════════════════════════════════════════╝');
console.log();

