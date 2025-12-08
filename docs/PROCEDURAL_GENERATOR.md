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
B → b*                           (asteroid belt with many asteroids)
```

Where:
- **Uppercase symbols** (A, S, P, M, B) are structural and define the hierarchy
- **Lowercase symbols** (p, m, b) become actual Star objects
- **S** represents a star node (structural, not rendered)
- **p** represents a planet (rendered)
- **m** represents a moon (rendered)
- **B** represents an asteroid belt (collection of many asteroids)
- **b** represents an individual asteroid (rendered as tiny body)

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

Planets get varied colors; moons are gray; asteroids are rocky browns and grays.

### 4. Asteroid Belt Generation

After the planet/moon hierarchy is generated, the system performs a **post-processing step** to place asteroid belts:

#### Belt Placement Algorithms

**Between Planets Mode:**
- Analyzes gaps between adjacent planets
- Places belts in selected gaps using configurable gap fractions
- Inner radius = `r1 + gap * beltInnerGapScale`
- Outer radius = `r1 + gap * beltOuterGapScale`
- Probability-based selection (50% chance per gap)

**Outer Belt Mode (Kuiper-like):**
- Places a belt beyond the outermost planet
- Inner radius = `rMax * beltOuterMultiplier`
- Outer radius = `innerRadius * 1.5`
- Mimics Kuiper belt / scattered disk structure

**Both Mode:**
- Combines both placement strategies
- Respects `maxBeltsPerSystem` limit

#### Asteroid Generation

For each belt, asteroids are generated with:

- **Count**: Geometric distribution with `beltAsteroidGeometricP`, clamped to `[beltMinCount, beltMaxCount]`
- **Radial position**: Uniform distribution in `[innerRadius, outerRadius]`
- **Angular position**: Uniform in `[0, 360°]`
- **Vertical offset**: Normal distribution with σ = `beltThickness`
- **Physical properties**:
  - Very small mass (`baseMass * 0.01`)
  - Tiny radius (scaled appropriately)
  - Rocky colors (grays/browns) with slight variation
- **Orbital parameters**:
  - Speed follows Kepler's law: `v = k / sqrt(distance)`
  - Optional eccentricity and inclination inherited from belt
  - Each asteroid is a full `Star` object with `bodyType: 'asteroid'`

#### Belt Metadata

Each belt is represented by an `AsteroidBelt` object containing:
- Geometric parameters (inner/outer radius, thickness, inclination, eccentricity)
- Population data (asteroid count, list of asteroid IDs)
- Visual hints (color)
- Deterministic seed for reproducibility

### 5. Kuiper Belt Generation (Trans-Neptunian Icy Objects)

After main asteroid belts are generated, the system performs a **separate post-processing step** to place Kuiper Belt Objects (KBOs) in the trans-Neptunian region:

#### Kuiper Belt Placement

**Algorithm:**
1. Check if `enableKuiperBelt` is true (skip if disabled)
2. Find outermost planet distance `rMax`
3. Calculate Kuiper belt radii:
   - `innerRadius = rMax * kuiperBeltRadialRange[0]`
   - `outerRadius = rMax * kuiperBeltRadialRange[1]`
4. Create a single Kuiper belt beyond all planets

**Default radial range:** `[2.0, 3.5]` means the Kuiper belt spans from 2× to 3.5× the outermost planet's distance.

#### KBO Generation

For the Kuiper belt, icy bodies are generated with:

- **Count**: Geometric distribution with `kuiperBeltAsteroidGeometricP`, clamped to `[kuiperBeltMinCount, kuiperBeltMaxCount]`
  - Default: 100-1500 KBOs (more than main belt for scattered disk appearance)
  - Lower geometric P (0.25 vs 0.3) means more objects on average
- **Radial position**: Uniform distribution in `[innerRadius, outerRadius]`
- **Angular position**: Uniform in `[0, 360°]`
- **Vertical offset**: Normal distribution with σ = `kuiperBeltInclinationSigma`
  - Default: 1.5 (vs 0.5 for main belt) creates thicker, more scattered disc
- **Inclination variation**: Additional normal scatter applied per-object
  - Creates the characteristic "scattered disk" appearance
- **Physical properties**:
  - Very small mass (same as main belt asteroids)
  - Tiny radius (scaled appropriately)
  - **Icy colors** (bluish-grays: `#B0C4DE`, `#D3D3D3`, `#E0F3FF`, `#A8C5DD`, etc.)
  - Distinct from rocky main belt browns
- **Orbital parameters**:
  - Speed follows Kepler's law: `v = k / sqrt(distance)`
  - Eccentricity sampled from `kuiperBeltEccentricityRange` (default `[0.0, 0.15]`)
  - Higher inclinations create scattered, 3D distribution
  - Each KBO is a full `Star` object with:
    - `bodyType: 'asteroid'`
    - `asteroidSubType: 'kuiperBelt'` for identification

#### Kuiper Belt Metadata

The Kuiper belt is represented by an `AsteroidBelt` object with special fields:
- `beltType: 'kuiper'` - distinguishes from main belt
- `isIcy: true` - marks icy composition
- `inclinationSigma: number` - higher vertical scatter parameter
- `radialRangeHint: [number, number]` - for documentation/debugging
- Standard belt fields (inner/outer radius, thickness, asteroid IDs, seed)

#### Determinism

- Kuiper belt generation uses a dedicated PRNG fork: `masterRng.fork('kuiper')`
- Per-KBO forks: `kuiperRng.fork('kuiper-object-${i}')` ensure full reproducibility
- Same seed always produces identical Kuiper belt structure

### 6. Planetary Rings (Per-Planet Ring Systems)

After planets are generated and assigned physical/orbital properties, the system performs a **per-planet post-processing step** to assign planetary rings:

#### Ring Eligibility and Probability

- Rings are controlled by the generator configuration:
  - `enablePlanetaryRings: boolean`
  - `ringedPlanetProbability: number` – base probability of a planet having rings
  - `ringMassBiasThreshold: number` – planets above this mass are more likely to be ringed
  - `ringOuterOrbitBias: number` – bias toward outer planets (0–1)
- Only bodies with `bodyType === 'planet'` (and orbiting the system’s center star) are considered.
- For each candidate planet:
  1. Start with `ringedPlanetProbability`.
  2. Increase probability for massive planets (`mass >= ringMassBiasThreshold`).
  3. Optionally increase probability for planets farther from the star (scaled by `ringOuterOrbitBias`).
  4. Clamp the final probability to `[0, 1]` and sample with the PRNG.

#### Ring Geometry

For each planet that is selected to have rings, the generator samples:

- `innerRadiusMultiplier` ∈ `ringInnerRadiusRange`  
  (inner radius = `planet.radius * innerRadiusMultiplier`)
- `outerRadiusMultiplier` ∈ `ringOuterRadiusRange`  
  (outer radius = `planet.radius * outerRadiusMultiplier`, enforced `outer > inner`)
- `thickness` = `planet.radius * thicknessMultiplier`, where `thicknessMultiplier` ∈ `ringThicknessRange`

These values are stored in a `PlanetaryRing` object attached to the planet (`Star.ring`).

#### Visual and Physical Style

Additional ring properties are sampled from configurable ranges:

- Opacity: `opacity` ∈ `ringOpacityRange` (0–1)
- Albedo (brightness): `albedo` ∈ `ringAlbedoRange`
- Density: `density` ∈ `ringDensityRange` (0–1)
- Color: derived from the planet’s base color, with variation controlled by `ringColorVariation`

Each ring also receives an optional `seed` to support deterministic sub-patterns if needed later.

### 6. Hierarchical Rules

#### Center Star Selection
The **heaviest star** in each system becomes the center (parentId = null). All other bodies orbit it directly or indirectly.

**Algorithm**:
1. Generate masses for all stars in a system
2. Sort by mass (descending)
3. Make heaviest star the root
4. Companion stars orbit at same distance with evenly spaced phases
5. Planets orbit the center star
6. Main asteroid belts are placed in gaps between planets or beyond the outer edge
7. Kuiper belt is placed in the trans-Neptunian region (if enabled)
8. Planetary rings, comets, and Lagrange points are added as configured

#### Multi-Star Systems
- **Binary**: 2 stars at same orbital distance, phases 0° and 180°
- **Ternary**: 3 stars at same orbital distance, phases 0°, 120°, 240°

### 7. Group Generator

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
console.log(system.belts);      // Record<string, AsteroidBelt>
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
  
  // Enable asteroid belts
  enableAsteroidBelts: true,
  maxBeltsPerSystem: 2,
  beltPlacementMode: 'both',
  beltDensity: 0.6,
  
  // Enable Kuiper belt
  enableKuiperBelt: true,
  kuiperBeltDensity: 0.5,
  kuiperBeltRadialRange: [2.0, 3.5],
  kuiperBeltInclinationSigma: 1.5,
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
  
  // Asteroid Belt parameters
  enableAsteroidBelts: boolean;               // Master switch
  maxBeltsPerSystem: number;                  // 0-5+ belts per system
  beltPlacementMode: 'none' | 'betweenPlanets' | 'outerBelt' | 'both';
  beltAsteroidGeometricP: number;             // Controls asteroid count (like planetGeometricP)
  beltMinCount: number;                       // Minimum asteroids per belt
  beltMaxCount: number;                       // Maximum asteroids per belt
  beltThickness: number;                      // Vertical spread (standard deviation)
  beltColorVariation: number;                 // 0-1, color variation within belt
  beltInnerGapScale: number;                  // Fraction of gap for inner radius (0-1)
  beltOuterGapScale: number;                  // Fraction of gap for outer radius (0-1)
  beltOuterMultiplier: number;                // For outer belts: factor × outermost orbit
  beltEccentricityRange: [number, number];    // [min, max] eccentricity for belts

  // Kuiper Belt parameters (trans-Neptunian icy objects)
  enableKuiperBelt: boolean;                  // Master switch for Kuiper belt
  kuiperBeltDensity: number;                  // 0-1 density slider (mapped to KBO count)
  kuiperBeltRadialRange: [number, number];    // Radial multipliers × outermost planet distance
  kuiperBeltInclinationSigma: number;         // Vertical scatter / inclination noise (higher than main belt)
  kuiperBeltEccentricityRange: [number, number]; // [min, max] eccentricity for KBOs
  kuiperBeltAsteroidGeometricP: number;       // Controls KBO count (like beltAsteroidGeometricP)
  kuiperBeltMinCount: number;                 // Minimum KBOs per belt
  kuiperBeltMaxCount: number;                 // Maximum KBOs per belt

  // Planetary ring parameters (per-planet ring systems)
  enablePlanetaryRings: boolean;              // Master switch for rings
  ringedPlanetProbability: number;            // Base probability that a planet has rings
  ringMassBiasThreshold: number;              // Planets above this mass get higher ring chance
  ringOuterOrbitBias: number;                 // Bias rings toward outer planets (0-1)
  ringInnerRadiusRange: [number, number];     // Inner radius multipliers (× planet radius)
  ringOuterRadiusRange: [number, number];     // Outer radius multipliers (× planet radius)
  ringThicknessRange: [number, number];       // Thickness multipliers (× planet radius)
  ringOpacityRange: [number, number];         // Opacity range [0, 1]
  ringAlbedoRange: [number, number];          // Albedo range
  ringColorVariation: number;                 // 0-1 color variation strength
  ringDensityRange: [number, number];         // Density range [0, 1]
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
  
  // Asteroid belts (disabled by default)
  enableAsteroidBelts: false,
  maxBeltsPerSystem: 2,
  beltPlacementMode: 'betweenPlanets',
  beltAsteroidGeometricP: 0.3,
  beltMinCount: 50,
  beltMaxCount: 1000,
  beltThickness: 0.5,
  beltColorVariation: 0.2,
  beltInnerGapScale: 0.4,
  beltOuterGapScale: 0.6,
  beltOuterMultiplier: 1.5,
  beltEccentricityRange: [0, 0.1],

  // Kuiper belt defaults (disabled by default)
  enableKuiperBelt: false,
  kuiperBeltDensity: 0.5,
  kuiperBeltRadialRange: [2.0, 3.5],          // 2-3.5× outermost planet distance
  kuiperBeltInclinationSigma: 1.5,            // Higher scatter than main belt
  kuiperBeltEccentricityRange: [0.0, 0.15],   // Slightly more eccentric
  kuiperBeltAsteroidGeometricP: 0.25,         // Lower p = more objects
  kuiperBeltMinCount: 100,
  kuiperBeltMaxCount: 1500,

  // Planetary rings (disabled by default)
  enablePlanetaryRings: false,
  ringedPlanetProbability: 0.1,
  ringMassBiasThreshold: 20,
  ringOuterOrbitBias: 0.5,
  ringInnerRadiusRange: [1.3, 1.8],
  ringOuterRadiusRange: [2.3, 3.8],
  ringThicknessRange: [0.05, 0.15],
  ringOpacityRange: [0.3, 0.8],
  ringAlbedoRange: [0.4, 1.0],
  ringColorVariation: 0.25,
  ringDensityRange: [0.2, 0.9],
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
- ✅ Belt parent references are valid
- ✅ Belt radii satisfy `innerRadius < outerRadius`
- ✅ Asteroids with `bodyType: 'asteroid'` lie within their belt radii

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
//   beltCount: 2,
//   totalAsteroids: 450,
//   avgAsteroidCountPerBelt: 225,
//   maxDepth: 2,
//   avgDepth: 1.2,
//   minMass: 0.01,
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
//   ▻ Asteroid Belt 1 (inner=2.5, outer=3.2, asteroids=300)
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
    belts: system.belts,
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
2. **Stellar evolution**: Time-based star property changes
3. **Habitable zones**: Mark planets in Goldilocks zone
4. **Advanced belt and ring features**: Belt gaps (Kirkwood gaps), shepherd moons, belt density variations, fine-grained ring substructures
5. **Three-body orbital dynamics**: More sophisticated Lagrange point stability and Trojan orbital variations

## References

- **L-Systems**: Lindenmayer, A. (1968). "Mathematical models for cellular interactions"
- **Kepler's Laws**: Kepler, J. (1609). "Astronomia Nova"
- **Procedural Generation**: Procedural Content Generation in Games (textbook)
- **Stellar Classification**: Morgan-Keenan (MK) system

## License

Part of the Solar System Constructor project.

