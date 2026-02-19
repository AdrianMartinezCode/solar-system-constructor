# Procedural Generator - Quick Reference

## Audience

- Developers generating a system/universe programmatically (and optionally wiring the result into the app state).

## Prerequisites

- TypeScript familiarity
- Access to the repo generator utilities (e.g. `src/utils/procedural-generator.ts`)

## Quick start

```typescript
import { generateSolarSystem } from './utils/procedural-generator';

// Generate with defaults
const system = generateSolarSystem();

// Use in your store
useSystemStore.setState({
  stars: system.stars,
  rootIds: system.rootIds,
  groups: system.groups,
  rootGroupIds: system.rootGroupIds,
  belts: system.belts,
});
```

## How-to

## Topology Presets (Structure Control)

Topology presets control the **hierarchical structure** of generated systems:

```typescript
import { generateSolarSystem } from './utils/procedural-generator';

// Use different topology presets
const classic = generateSolarSystem({ topologyPresetId: 'classic' });
const compact = generateSolarSystem({ topologyPresetId: 'compact' });      // 1-2 planets, 5-18 moons each
const multiStar = generateSolarSystem({ topologyPresetId: 'multiStarHeavy' }); // 95% binary/ternary
const moonRich = generateSolarSystem({ topologyPresetId: 'moonRich' });    // 4-25 moons per planet
const sparse = generateSolarSystem({ topologyPresetId: 'sparseOutpost' }); // 0-2 planets, lonely
const deep = generateSolarSystem({ topologyPresetId: 'deepHierarchy' });   // Moons with sub-moons
```

### Topology Preset Summary

| Preset | Stars | Planets | Moons/Planet | Description |
|--------|-------|---------|--------------|-------------|
| `classic` | 1-3 | 0-5 | 0-5 | Standard behavior |
| `compact` | 1 | 1-2 | 5-18 | Jupiter-like systems |
| `multiStarHeavy` | 2-3 (95%) | 1-4 | 0-3 | Focus on stars |
| `moonRich` | 1 | 3-6 | 4-25 | Moon swarms |
| `sparseOutpost` | 1 | 0-2 | 0-2 | Lonely frontier |
| `deepHierarchy` | 1 | 2-5 | 2-6 (+submoons) | Nested hierarchy |

## Presets (One-Liners)

```typescript
import {
  generateSimpleSystem,     // Single star, few planets
  generateBinarySystem,      // Binary/ternary focus
  generateMoonRichSystem,    // Lots of moons
  generateSparseSystem,      // Wide orbits
  generateGalaxy,            // Multiple systems with groups
} from './utils/generator-examples';

const system = generateSimpleSystem();
const binary = generateBinarySystem();
const galaxy = generateGalaxy(10); // 10 systems
```

## Custom Configurations

### More Binary Systems
```typescript
generateSolarSystem({
  starProbabilities: [0.3, 0.5, 0.2], // 50% binary
});
```

### Dense Planet-Rich System
```typescript
generateSolarSystem({
  planetGeometricP: 0.25,  // More planets
  moonGeometricP: 0.2,     // More moons
  orbitGrowth: 1.5,        // Tighter spacing
});
```

### Wide Sparse System
```typescript
generateSolarSystem({
  planetGeometricP: 0.6,   // Fewer planets
  moonGeometricP: 0.7,     // Fewer moons
  orbitBase: 5.0,          // Start farther out
  orbitGrowth: 2.5,        // Wide gaps
});
```

### Massive Stars
```typescript
generateSolarSystem({
  massMu: 2.0,      // Higher mean mass
  massSigma: 0.5,   // Less variation
});
```

### Galaxy with Groups
```typescript
generateMultipleSystems(20, {
  enableGrouping: true,
  numGroups: [8, 12],
  nestingProbability: 0.4,
});
```

### Small Body Belts (Asteroid + Kuiper) with Performance Control
```typescript
// Low detail for fast rendering
generateSolarSystem({
  enableAsteroidBelts: true,
  enableKuiperBelt: true,
  smallBodyDetail: 'low',  // Reduces counts across all belts
  maxBeltsPerSystem: 2,
  beltPlacementMode: 'both',
});

// High detail for dense debris fields
generateSolarSystem({
  enableAsteroidBelts: true,
  enableKuiperBelt: true,
  smallBodyDetail: 'high',
  maxBeltsPerSystem: 3,
  beltPlacementMode: 'both',
});
```

### Asteroid Belts Only
```typescript
generateSolarSystem({
  enableAsteroidBelts: true,
  maxBeltsPerSystem: 2,
  beltPlacementMode: 'both',           // Between planets + outer belt
  beltAsteroidGeometricP: 0.3,         // Moderate density
  beltMinCount: 50,
  beltMaxCount: 1000,
});
```

### Planetary Rings Enabled
```typescript
generateSolarSystem({
  enablePlanetaryRings: true,
  ringedPlanetProbability: 0.2,   // ~1 in 5 planets with rings
});
```

### Solar-Like System with Main Belt
```typescript
generateSolarSystem({
  starProbabilities: [1.0, 0, 0],      // Single star
  planetGeometricP: 0.4,
  enableAsteroidBelts: true,
  maxBeltsPerSystem: 1,
  beltPlacementMode: 'betweenPlanets',
  beltDensity: 0.4,
});
```

## Configuration Parameters

### Topology

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `topologyPresetId` | `TopologyPresetId` | `'classic'` | Controls system structure (stars/planets/moons hierarchy) |

### L-System Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `starProbabilities` | `[number, number, number]` | `[0.65, 0.25, 0.10]` | Probability of 1, 2, or 3 stars |
| `planetGeometricP` | `number` | `0.4` | Planet count param (lower = more) |
| `moonGeometricP` | `number` | `0.3` | Moon count param (lower = more) |
| `orbitBase` | `number` | `1.0` | Starting orbital distance |
| `orbitGrowth` | `number` | `1.8` | Exponential spacing factor |
| `orbitJitter` | `number` | `0.1` | Random variation ±jitter |
| `orbitK` | `number` | `20.0` | Orbital speed constant |
| `massMu` | `number` | `1.5` | Log-normal mass mean |
| `massSigma` | `number` | `0.8` | Log-normal mass std dev |
| `radiusPower` | `number` | `0.4` | Radius = mass^power |
| `enableGrouping` | `boolean` | `false` | Enable group generation |
| `numGroups` | `[number, number]` | `[3, 7]` | Min/max group count |
| `nestingProbability` | `number` | `0.2` | Group nesting chance |
| `groupPositionSigma` | `number` | `50.0` | 3D spread of groups |

### Small Body Belts (Unified)

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `smallBodyDetail` | `'low'\|'medium'\|'high'\|'ultra'` | `'medium'` | **Global quality/performance control for all belts** |
| `enableAsteroidBelts` | `boolean` | `false` | Enable main asteroid belt generation |
| `enableKuiperBelt` | `boolean` | `false` | Enable Kuiper belt (outer, icy) generation |
| `maxBeltsPerSystem` | `number` | `2` | Max main belts per system (0-5+) |
| `beltPlacementMode` | `string` | `'betweenPlanets'` | Main belt placement strategy |
| `beltAsteroidGeometricP` | `number` | `0.3` | Asteroid count param (scaled by smallBodyDetail) |
| `beltMinCount` | `number` | `50` | Min asteroids per belt |
| `beltMaxCount` | `number` | `1000` | Max asteroids per belt |
| `beltThickness` | `number` | `0.5` | Vertical spread (σ) |
| `beltEccentricityRange` | `[number, number]` | `[0, 0.1]` | Min/max eccentricity |
| `kuiperBeltDensity` | `number` | `0.5` | Kuiper belt density (0-1) |
| `kuiperBeltRadialRange` | `[number, number]` | `[2.0, 3.5]` | Radial range × outermost planet |
| `kuiperBeltInclinationSigma` | `number` | `1.5` | Vertical scatter (higher than main belt) |

### smallBodyDetail Mapping

| Level | Count Scale | Min/Max Multiplier | Label |
|-------|-------------|-------------------|-------|
| `low` | 0.3× | 0.5× / 0.3× | Low (fast) |
| `medium` | 0.6× | 0.7× / 0.6× | Medium |
| `high` | 1.0× | 1.0× / 1.0× | High |
| `ultra` | 1.5× | 1.2× / 1.5× | Ultra (expensive) |

### Other Features

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `enablePlanetaryRings` | `boolean` | `false` | Enable per-planet ring systems |
| `ringedPlanetProbability` | `number` | `0.1` | Base probability a planet has rings |

### Black Holes (Exotic Objects)

#### Core Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `enableBlackHoles` | `boolean` | `false` | Enable black hole generation |
| `blackHoleSystemProbability` | `number` | `0.05` | Chance a system centers on a black hole |
| `blackHoleAsCompanionProbability` | `number` | `0.02` | Chance black hole in multi-star systems |
| `blackHoleMassRange` | `[number, number]` | `[5, 50]` | Base mass range (solar masses) |
| `blackHoleAccretionDiskProbability` | `number` | `0.7` | Chance of having accretion disk |
| `blackHoleJetProbability` | `number` | `0.5` | Chance of having relativistic jets |
| `blackHolePhotonRingEnabled` | `boolean` | `true` | Render photon rings |
| `blackHoleSpinRange` | `[number, number]` | `[0.3, 0.95]` | Spin parameter range (0-1) |
| `blackHoleShadowRadiusRange` | `[number, number]` | `[0.3, 0.8]` | Visual shadow radius range |

#### Advanced Diversity Parameters (Optional)

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `blackHoleMassClassWeights` | `{stellar, intermediate, supermassive}` | `undefined` | Mass class distribution weights |
| `blackHoleMultiplePerSystemProbability` | `number` | `undefined` | Chance of multiple BHs (binary BHs) |
| `blackHoleSpinDistribution` | `'uniform' \| 'highSpinBiased' \| 'lowSpinBiased'` | `undefined` | Spin distribution style |
| `blackHoleShadowRadiusScaleMode` | `'physicalish' \| 'cinematic'` | `undefined` | Shadow radius scaling mode |
| `blackHoleAccretionStyle` | `'subtle' \| 'normal' \| 'quasar'` | `undefined` | Accretion disk brightness preset |
| `blackHoleDiskBrightnessRange` | `[number, number]` | `[0.7, 1.0]` | Disk brightness range |
| `blackHoleDiskOpacityRange` | `[number, number]` | `[0.6, 0.9]` | Disk opacity range |
| `blackHoleDiskTemperatureRange` | `[number, number]` | `[5000, 20000]` | Disk temperature range (K) |
| `blackHoleDiskClumpinessRange` | `[number, number]` | `[0.3, 0.7]` | Disk clumpiness range |
| `blackHoleJetBrightnessRange` | `[number, number]` | `[0.8, 1.0]` | Jet brightness range |
| `blackHoleRotationSpeedMultiplierRange` | `[number, number]` | `[0.5, 1.5]` | Animation speed range |

**Example 1: Basic Black Hole System**
```typescript
generateSolarSystem({
  enableBlackHoles: true,
  blackHoleSystemProbability: 0.2, // 20% chance
  blackHoleAccretionDiskProbability: 1.0, // Always show disks
  blackHoleJetProbability: 0.8, // Frequent jets
});
```

**Example 2: Mixed Mass Profile (Stellar + Intermediate + Supermassive)**
```typescript
generateUniverse({
  enableBlackHoles: true,
  blackHoleSystemProbability: 0.15,
  blackHoleMassClassWeights: {
    stellar: 0.7,        // 70% stellar-mass (5-50 M☉)
    intermediate: 0.25,  // 25% intermediate (50-10k M☉)
    supermassive: 0.05,  // 5% supermassive (1M-1B M☉)
  },
  blackHoleShadowRadiusScaleMode: 'physicalish', // Tie radius to mass
});
```

**Example 3: High-Spin, Quasar-Style Black Holes**
```typescript
generateUniverse({
  enableBlackHoles: true,
  blackHoleSystemProbability: 0.1,
  blackHoleSpinRange: [0.6, 0.99],              // Near-extremal Kerr
  blackHoleSpinDistribution: 'highSpinBiased',  // Bias toward max spin
  blackHoleAccretionStyle: 'quasar',            // Ultra-bright, hot disks
  blackHoleDiskBrightnessRange: [0.9, 1.0],
  blackHoleDiskTemperatureRange: [15000, 50000],
  blackHoleJetProbability: 0.9,                 // Nearly always have jets
  blackHoleDopplerBeamingStrengthRange: [0.7, 1.0],
  blackHoleLensingStrengthRange: [0.7, 1.0],
});
```

**Example 4: Binary Black Holes**
```typescript
generateUniverse({
  enableBlackHoles: true,
  blackHoleSystemProbability: 0.2,
  blackHoleMultiplePerSystemProbability: 0.15, // 15% chance of multiple BHs
  blackHoleMassClassWeights: {
    stellar: 1.0,
    intermediate: 0.0,
    supermassive: 0.0,
  },
});
```

See `docs/BLACK_HOLES_IMPLEMENTATION.md` for complete black hole documentation.

## Tips

### Geometric Distribution
- **Lower p** = More bodies (e.g., `planetGeometricP: 0.2` → ~5 planets)
- **Higher p** = Fewer bodies (e.g., `planetGeometricP: 0.6` → ~1-2 planets)
- **Formula**: Expected value = `(1-p) / p`

### Orbit Spacing
- **Growth < 1.5**: Very dense, crowded
- **Growth 1.5-2.0**: Realistic spacing
- **Growth > 2.0**: Wide, sparse systems

### Star Probabilities
- **Must sum to 1.0**
- **[1.0, 0.0, 0.0]**: Only single stars
- **[0.0, 1.0, 0.0]**: Only binary systems
- **[0.0, 0.0, 1.0]**: Only ternary systems

### Mass Scaling
- **Stars**: `mass * 100`
- **Planets**: `mass * 10`
- **Moons**: `mass * 1`

Typical ranges:
- Stars: 50-1000
- Planets: 5-50
- Moons: 0.5-10

## Validation & Testing

```typescript
import { validateSystem, analyzeSystem } from './utils/generator-examples';

const system = generateSolarSystem();

// Validate
const validation = validateSystem(system);
if (!validation.valid) {
  console.error(validation.errors);
}

// Analyze
const stats = analyzeSystem(system);
console.log(stats);
// {
//   totalStars: 15,
//   stars: 1,
//   planets: 8,
//   moons: 6,
//   binaryStar: 0,
//   ternaryStar: 0,
//   ...
// }
```

## Common Patterns

### Generate Button in UI
```typescript
function GenerateButton() {
  const handleGenerate = () => {
    const system = generateSolarSystem();
    useSystemStore.setState({
      stars: system.stars,
      rootIds: system.rootIds,
      groups: system.groups,
      rootGroupIds: system.rootGroupIds,
    });
    useSystemStore.getState().save();
  };
  
  return <button onClick={handleGenerate}>🎲 Generate System</button>;
}
```

### Generate on Load
```typescript
useEffect(() => {
  const stored = loadSystem();
  if (!stored) {
    const system = generateSimpleSystem();
    useSystemStore.setState({ ...system });
  }
}, []);
```

### Random Preset
```typescript
const presets = [
  generateSimpleSystem,
  generateBinarySystem,
  generateMoonRichSystem,
  generateSparseSystem,
];

const randomSystem = presets[Math.floor(Math.random() * presets.length)]();
```

## Data Flow

```
L-System Grammar
      ↓
Hierarchical Tree
      ↓
Physical Properties (mass, radius, color)
      ↓
Orbital Assignment (distance, speed, phase)
      ↓
Center Star Selection (heaviest)
      ↓
Star[] Array
      ↓
Group Generation (optional)
      ↓
Final Output
```

## Output Format

```typescript
{
  stars: Record<string, Star>,     // All stars/planets/moons
  rootIds: string[],                // Top-level system roots
  groups: Record<string, Group>,    // Optional groups
  rootGroupIds: string[],           // Top-level groups
}
```

Each `Star` has:
- `id`, `name`, `mass`, `radius`, `color`
- `parentId` (null for roots)
- `children` (array of child IDs)
- `orbitalDistance`, `orbitalSpeed`, `orbitalPhase`

## Performance

- **Single system**: ~1-3ms
- **10 systems**: ~10-20ms
- **100 systems**: ~100-200ms

Bottlenecks:
- Random number generation
- Tree traversal
- Mass sorting (for center selection)

## Troubleshooting / FAQ

**Problem**: Too many/few planets
- **Solution**: Adjust `planetGeometricP` (lower = more)

**Problem**: Orbits too close/far
- **Solution**: Adjust `orbitBase` and `orbitGrowth`

**Problem**: All single stars
- **Solution**: Increase `starProbabilities[1]` and `[2]`

**Problem**: No groups generated
- **Solution**: Set `enableGrouping: true`

**Problem**: Validation fails
- **Solution**: Check for custom config errors; file a bug report

## Algorithm Summary

1. **Topology**: Pluggable L-System grammar with stochastic rules (selectable via `topologyPresetId`)
2. **Hierarchy**: Heaviest star becomes center
3. **Orbits**: Exponential spacing + Kepler speed
4. **Physics**: Log-normal mass, power-law radius
5. **Groups**: Random k-means partition with nesting

## Example Outputs

### Simple System
```
⭐ Alpha Centauri (M=450.2, R=6.12, D=0.0)
  🌍 Mercury (M=8.5, R=1.62, D=1.8)
  🌍 Venus (M=12.3, R=1.85, D=3.2)
    🌑 Moon (M=1.2, R=0.68, D=1.8)
  🌍 Earth (M=10.1, R=1.75, D=5.8)
```

### Binary System
```
⭐ Alpha Centauri (M=520.0, R=6.45, D=0.0)
  ⭐ Beta Centauri (M=380.5, R=5.67, D=12.0)
  🌍 Mercury (M=9.2, R=1.68, D=21.6)
  🌍 Venus (M=15.4, R=2.01, D=38.9)
```

## Reference

- `docs/PROCEDURAL_GENERATOR.md` - Complete generator documentation
- `docs/TOPOLOGY_GRAMMAR_PRESETS.md` - Topology presets and L-system grammars
- `docs/ALGORITHM_FLOW.md` - Detailed algorithm flow

