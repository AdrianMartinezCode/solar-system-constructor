# Procedural Solar System Generator

## Overview

This module implements a **Stochastic Hierarchical L-System** combined with **Kepler-inspired orbital rules** to procedurally generate hierarchical solar systems compatible with the 3D orbital editor.

## Architecture

### 1. L-System Topology Generator

The generator uses a context-free grammar with stochastic production rules:

```
A → S P* | S S P* | S S S P*    (1-3 stars per system)
P → p M*                         (planet with moons)
M → m                            (moon)
```

Where:
- **Uppercase symbols** (A, S, P, M) are structural and define the hierarchy
- **Lowercase symbols** (p, m) become actual Star objects
- **S** represents a star node (structural, not rendered)
- **p** represents a planet (rendered)
- **m** represents a moon (rendered)

#### Stochastic Parameters

- **Star count probabilities**: [0.65, 0.25, 0.10] for 1, 2, or 3 stars
- **Planet count**: Geometric distribution with p = 0.4
- **Moon count**: Geometric distribution with p = 0.3

### 2. Orbital Assignment Rules

#### Distance Formula
```
distance(n) = base * growth^n + jitter
```
- `base = 1.0`
- `growth = 1.8` (exponential spacing)
- `jitter ∈ [-0.1, +0.1]` (random variation)

#### Speed Formula (Kepler-like)
```
speed = k / sqrt(distance)
```
- `k = 20.0` (visualization constant)
- Mimics Kepler's third law for intuitive motion

#### Phase Assignment
- **Multi-star systems**: Evenly spaced phases
  ```
  phase_i = 360° * i / N
  ```
- **Single bodies**: Uniform random ∈ [0, 360)

### 3. Physical Properties

#### Mass (Log-Normal Distribution)
```
mass = exp(N(μ=1.5, σ=0.8))
```
Scaled by type:
- Stars: ×100
- Planets: ×10
- Moons: ×1

#### Radius (Power Law)
```
radius = mass^0.4
```

#### Color (Mass-Based Spectral Classification)
| Mass Range | Color | Type |
|------------|-------|------|
| > 600 | Blue-white (#9BB0FF) | O, B type |
| 200-600 | White (#CAD7FF) | A type |
| 100-200 | Yellow-white (#F8F7FF) | F type |
| 50-100 | Orange (#FFF4EA) | G, K type |
| < 50 | Deep red (#FFD2A1) | M type |

Planets get varied colors; moons are gray.

### 4. Hierarchical Rules

#### Center Star Selection
The **heaviest star** in each system becomes the center (parentId = null). All other bodies orbit it directly or indirectly.

**Algorithm**:
1. Generate masses for all stars in a system
2. Sort by mass (descending)
3. Make heaviest star the root
4. Companion stars orbit at same distance with evenly spaced phases
5. Planets orbit the center star

#### Multi-Star Systems
- **Binary**: 2 stars at same orbital distance, phases 0° and 180°
- **Ternary**: 3 stars at same orbital distance, phases 0°, 120°, 240°

### 5. Group Generator

Optional hierarchical grouping for galaxy-scale structures:

**Algorithm**:
1. Decide number of groups G ∈ [3, 7]
2. Randomly partition systems into groups
3. With 20% probability, nest groups (if no cycles)
4. Assign 3D positions using Gaussian cloud (σ = 50)

**Position Formula**:
```
position = (N(0, σ), N(0, σ), N(0, σ))
```

## Usage

### Basic Generation

```typescript
import { generateSolarSystem } from './utils/procedural-generator';

// Generate a single system with default settings
const system = generateSolarSystem();

// Access the data
console.log(system.stars);      // Record<string, Star>
console.log(system.rootIds);    // string[]
console.log(system.groups);     // Record<string, Group>
console.log(system.rootGroupIds); // string[]
```

### Custom Configuration

```typescript
import { generateSolarSystem, GeneratorConfig } from './utils/procedural-generator';

const config: Partial<GeneratorConfig> = {
  // Favor binary systems
  starProbabilities: [0.3, 0.6, 0.1],
  
  // More planets
  planetGeometricP: 0.3,
  
  // Wider orbits
  orbitGrowth: 2.0,
  orbitBase: 2.0,
  
  // Enable grouping
  enableGrouping: true,
};

const system = generateSolarSystem(config);
```

### Multiple Systems (Galaxy)

```typescript
import { generateMultipleSystems } from './utils/procedural-generator';

// Generate 10 systems with grouping
const galaxy = generateMultipleSystems(10, {
  enableGrouping: true,
  numGroups: [5, 8],
  nestingProbability: 0.3,
});
```

### Preset Configurations

```typescript
import {
  generateSimpleSystem,
  generateBinarySystem,
  generateMoonRichSystem,
  generateSparseSystem,
  generateGalaxy,
} from './utils/generator-examples';

// Simple single-star system
const simple = generateSimpleSystem();

// Binary/ternary heavy
const binary = generateBinarySystem();

// Lots of moons
const moonRich = generateMoonRichSystem();

// Wide, sparse orbits
const sparse = generateSparseSystem();

// Full galaxy with groups
const galaxy = generateGalaxy(15); // 15 systems
```

## Configuration Options

### Complete GeneratorConfig Interface

```typescript
interface GeneratorConfig {
  // L-System parameters
  starProbabilities: [number, number, number]; // Must sum to 1.0
  planetGeometricP: number;  // 0 < p < 1
  moonGeometricP: number;    // 0 < p < 1
  maxDepth: number;          // Recursion limit
  
  // Orbital parameters
  orbitBase: number;         // Starting distance
  orbitGrowth: number;       // Exponential factor (> 1)
  orbitJitter: number;       // Random variation
  orbitK: number;            // Speed constant
  
  // Physical parameters
  massMu: number;            // Log-normal mean
  massSigma: number;         // Log-normal std dev
  radiusPower: number;       // Power law exponent
  
  // Grouping parameters
  enableGrouping: boolean;
  numGroups: [number, number];      // [min, max]
  nestingProbability: number;       // 0.0 - 1.0
  groupPositionSigma: number;       // 3D spread
}
```

### Default Values

```typescript
const DEFAULT_CONFIG = {
  starProbabilities: [0.65, 0.25, 0.10],
  planetGeometricP: 0.4,
  moonGeometricP: 0.3,
  maxDepth: 3,
  
  orbitBase: 1.0,
  orbitGrowth: 1.8,
  orbitJitter: 0.1,
  orbitK: 20.0,
  
  massMu: 1.5,
  massSigma: 0.8,
  radiusPower: 0.4,
  
  enableGrouping: false,
  numGroups: [3, 7],
  nestingProbability: 0.2,
  groupPositionSigma: 50.0,
};
```

## Validation & Analysis

### Validate Generated System

```typescript
import { validateSystem } from './utils/generator-examples';

const system = generateSolarSystem();
const validation = validateSystem(system);

if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
}
```

**Checks performed:**
- ✅ All `parentId` references exist
- ✅ No cycles in hierarchy
- ✅ `rootIds` are actually roots (parentId === null)
- ✅ Children arrays are consistent
- ✅ Heaviest star is center of each system
- ✅ Group hierarchy is valid

### Analyze System Statistics

```typescript
import { analyzeSystem } from './utils/generator-examples';

const system = generateSolarSystem();
const stats = analyzeSystem(system);

console.log(stats);
// {
//   totalStars: 15,
//   rootSystems: 1,
//   singleStar: 0,
//   binaryStar: 1,
//   ternaryStar: 0,
//   planets: 8,
//   moons: 6,
//   maxDepth: 2,
//   avgDepth: 1.2,
//   minMass: 0.5,
//   maxMass: 450.2,
//   avgMass: 85.3,
//   ...
// }
```

### Print System Structure

```typescript
import { printSystemStructure } from './utils/generator-examples';

const system = generateSolarSystem();
console.log(printSystemStructure(system));

// Output:
// ⭐ Alpha Centauri (M=450.2, R=6.12, D=0.0)
//   ⭐ Beta Centauri (M=380.5, R=5.67, D=10.0)
//   🌍 Earth (M=12.3, R=1.85, D=18.0)
//     🌑 Moon (M=1.2, R=0.68, D=1.8)
//   🌍 Mars (M=8.5, R=1.62, D=32.4)
```

## Testing

### Run Test Suite

```typescript
import { runTests, printTestResults } from './utils/generator-examples';

// Run all tests
const results = runTests();

// Print formatted results
printTestResults();
```

**Tests included:**
1. Simple system generation
2. Binary/ternary system generation
3. Moon-rich system generation
4. Galaxy generation with groups
5. Consistency test (10 iterations)

## Integration with SystemStore

### Replace Example Data

```typescript
import { useSystemStore } from './state/systemStore';
import { generateSolarSystem } from './utils/procedural-generator';

// In your component or action
const resetWithGenerated = () => {
  const system = generateSolarSystem({
    starProbabilities: [0.5, 0.4, 0.1],
    enableGrouping: true,
  });
  
  useSystemStore.setState({
    stars: system.stars,
    rootIds: system.rootIds,
    groups: system.groups,
    rootGroupIds: system.rootGroupIds,
    selectedStarId: null,
    selectedGroupId: null,
    time: 0,
  });
  
  // Save to localStorage
  useSystemStore.getState().save();
};
```

### Add Generator Button to UI

```typescript
// Example button component
function GenerateSystemButton() {
  const reset = useSystemStore((state) => state.reset);
  
  const handleGenerate = () => {
    const system = generateSolarSystem({
      starProbabilities: [0.6, 0.3, 0.1],
    });
    
    useSystemStore.setState({
      stars: system.stars,
      rootIds: system.rootIds,
      groups: system.groups || {},
      rootGroupIds: system.rootGroupIds || [],
    });
    
    useSystemStore.getState().save();
  };
  
  return (
    <button onClick={handleGenerate}>
      Generate New System
    </button>
  );
}
```

## Algorithm Complexity

- **Time Complexity**: O(n) where n is the number of bodies generated
- **Space Complexity**: O(n)
- **Generation Time**: ~1-5ms for typical systems (1-20 bodies)
- **Generation Time**: ~10-50ms for galaxies (100+ bodies)

## Random Number Generation

The generator uses JavaScript's built-in `Math.random()` with:
- **Box-Muller transform** for normal distributions
- **Inverse transform** for geometric distributions
- **Weighted sampling** for discrete choices

For deterministic generation (seeded random), replace `Math.random()` with a PRNG like `seedrandom`.

## Future Extensions

Potential enhancements:
1. **Resonance patterns**: Lock planets into orbital resonances (e.g., 2:1, 3:2)
2. **Asteroid belts**: Add debris fields between planets
3. **Eccentricity**: Add elliptical orbits (e parameter)
4. **Inclination**: Add orbital plane tilts
5. **Stellar evolution**: Time-based star property changes
6. **Habitable zones**: Mark planets in Goldilocks zone
7. **Ring systems**: Add Saturn-like rings to planets
8. **Trojan points**: Add L4/L5 companion objects

## References

- **L-Systems**: Lindenmayer, A. (1968). "Mathematical models for cellular interactions"
- **Kepler's Laws**: Kepler, J. (1609). "Astronomia Nova"
- **Procedural Generation**: Procedural Content Generation in Games (textbook)
- **Stellar Classification**: Morgan-Keenan (MK) system

## License

Part of the Solar System Constructor project.

