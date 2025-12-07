# Procedural Generator - Quick Reference

## Quick Start

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

### Asteroid Belts Enabled
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
| `enableAsteroidBelts` | `boolean` | `false` | Enable asteroid belt generation |
| `maxBeltsPerSystem` | `number` | `2` | Max belts per system (0-5+) |
| `beltPlacementMode` | `string` | `'betweenPlanets'` | Placement strategy |
| `beltAsteroidGeometricP` | `number` | `0.3` | Asteroid count param |
| `beltMinCount` | `number` | `50` | Min asteroids per belt |
| `beltMaxCount` | `number` | `1000` | Max asteroids per belt |
| `beltThickness` | `number` | `0.5` | Vertical spread (σ) |
| `beltEccentricityRange` | `[number, number]` | `[0, 0.1]` | Min/max eccentricity |
| `enablePlanetaryRings` | `boolean` | `false` | Enable per-planet ring systems |
| `ringedPlanetProbability` | `number` | `0.1` | Base probability a planet has rings |

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

## Troubleshooting

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

1. **Topology**: L-System grammar with stochastic rules
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

## Further Reading

See `docs/PROCEDURAL_GENERATOR.md` for complete documentation.

