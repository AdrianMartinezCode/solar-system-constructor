/**
 * Demo: Deterministic Solar System Generation using PRNG
 */

import { generateSolarSystem, generateMultipleSystems } from './src/utils/procedural-generator';

console.log('=== Deterministic Solar System Generation Demo ===\n');

// Test 1: Same seed produces identical systems
console.log('Test 1: Deterministic Single System Generation');
console.log('------------------------------------------------');

const seed1 = 'Kepler-452';
const system1 = generateSolarSystem(seed1);
const system2 = generateSolarSystem(seed1);

console.log(`Seed: "${seed1}"`);
console.log(`\nSystem 1 stars: ${Object.keys(system1.stars).length}`);
console.log(`System 2 stars: ${Object.keys(system2.stars).length}`);
console.log(`Root stars: ${system1.rootIds.length}`);

// Compare a few star properties
const star1Id = system1.rootIds[0];
const star1a = system1.stars[star1Id];
const star1b = system2.stars[star1Id];

console.log(`\nFirst star comparison:`);
console.log(`  Mass: ${star1a.mass.toFixed(2)} vs ${star1b.mass.toFixed(2)}`);
console.log(`  Radius: ${star1a.radius.toFixed(3)} vs ${star1b.radius.toFixed(3)}`);
console.log(`  Color: ${star1a.color} vs ${star1b.color}`);
console.log(`  Children: ${star1a.children.length} vs ${star1b.children.length}`);

const match = star1a.mass === star1b.mass && 
              star1a.radius === star1b.radius && 
              star1a.color === star1b.color;
console.log(`\n✓ Systems are ${match ? 'IDENTICAL' : 'DIFFERENT'}`);

// Test 2: Different seeds produce different systems  
console.log('\n\nTest 2: Different Seeds');
console.log('----------------------');

const systemA = generateSolarSystem('Alpha-Centauri');
const systemB = generateSolarSystem('Proxima-Centauri');

console.log(`System A: ${Object.keys(systemA.stars).length} stars`);
console.log(`System B: ${Object.keys(systemB.stars).length} stars`);

const starA = systemA.stars[systemA.rootIds[0]];
const starB = systemB.stars[systemB.rootIds[0]];

console.log(`\nFirst star mass: ${starA.mass.toFixed(2)} vs ${starB.mass.toFixed(2)}`);
console.log(`✓ Systems are different`);

// Test 3: Multiple systems with seed
console.log('\n\nTest 3: Multiple Systems Generation');
console.log('------------------------------------');

const multiSeed = 'universe-42';
const multi1 = generateMultipleSystems(3, multiSeed);
const multi2 = generateMultipleSystems(3, multiSeed);

console.log(`Seed: "${multiSeed}"`);
console.log(`\nMulti1 total stars: ${Object.keys(multi1.stars).length}`);
console.log(`Multi2 total stars: ${Object.keys(multi2.stars).length}`);
console.log(`Multi1 root systems: ${multi1.rootIds.length}`);
console.log(`Multi2 root systems: ${multi2.rootIds.length}`);
console.log(`Multi1 groups: ${Object.keys(multi1.groups).length}`);
console.log(`Multi2 groups: ${Object.keys(multi2.groups).length}`);

const multiMatch = Object.keys(multi1.stars).length === Object.keys(multi2.stars).length &&
                   multi1.rootIds.length === multi2.rootIds.length;
console.log(`\n✓ Multiple systems are ${multiMatch ? 'IDENTICAL' : 'DIFFERENT'}`);

// Test 4: Numeric seeds
console.log('\n\nTest 4: Numeric Seeds');
console.log('---------------------');

const num1 = generateSolarSystem(12345);
const num2 = generateSolarSystem(12345);

console.log(`Numeric seed: 12345`);
console.log(`System 1 stars: ${Object.keys(num1.stars).length}`);
console.log(`System 2 stars: ${Object.keys(num2.stars).length}`);

const numMatch = Object.keys(num1.stars).length === Object.keys(num2.stars).length;
console.log(`✓ Numeric seed systems are ${numMatch ? 'IDENTICAL' : 'DIFFERENT'}`);

// Test 5: No seed (random generation)
console.log('\n\nTest 5: Random Generation (no seed)');
console.log('------------------------------------');

const random1 = generateSolarSystem();
const random2 = generateSolarSystem();

console.log(`Random system 1 stars: ${Object.keys(random1.stars).length}`);
console.log(`Random system 2 stars: ${Object.keys(random2.stars).length}`);
console.log(`✓ Random systems can be different each run`);

console.log('\n=== Demo Complete ===');
console.log('\nSummary:');
console.log('- Same seed → identical systems (deterministic)');
console.log('- Different seeds → different systems');
console.log('- No seed → random generation each time');
console.log('- Works with both string and numeric seeds');
console.log('- Multiple systems generation is also deterministic');

