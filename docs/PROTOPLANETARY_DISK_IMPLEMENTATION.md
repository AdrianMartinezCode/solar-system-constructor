# Protoplanetary Disk Implementation

This document describes the implementation of the Protoplanetary Disk feature in the Solar System Constructor.

## Overview

Protoplanetary disks are visual-only particle fields representing young circumstellar disks of gas and dust around stars. Unlike asteroid belts or Kuiper belt objects, protoplanetary disks are **not** individual Star objects - they are GPU-efficient particle systems designed for visual impact without physics overhead.

### Key Characteristics

- **Visual-only**: Rendered as GPU particles, not as `Star` entities
- **Deterministic**: Uses PRNG for reproducible particle distribution
- **Performance-friendly**: Minimal CPU overhead, GPU-driven rendering
- **Integrated**: Works with existing generator, UI, and store systems

## Data Model

### ProtoplanetaryDisk Type

Located in `src/types.ts`:

```typescript
interface ProtoplanetaryDisk {
  // Identity
  id: string;
  systemId: string;           // System this disk belongs to
  centralStarId: string;      // Star the disk surrounds
  
  // Geometry (orbital distance units)
  innerRadius: number;        // Start of disk
  outerRadius: number;        // End of disk  
  thickness: number;          // Vertical half-height
  
  // Visual parameters
  particleCount: number;      // Target particles before LOD
  baseColor: string;          // Warm dusty hex color
  highlightColor: string;     // Hotter region hex color
  opacity: number;            // 0-1
  brightness: number;         // Emissive intensity
  clumpiness: number;         // 0-1 density variation
  rotationSpeedMultiplier: number; // Visual swirl speed
  
  // PRNG
  seed: string | number;
  style: 'thin' | 'moderate' | 'thick' | 'extreme';
  name?: string;
}
```

### Store Integration

The system store (`src/state/systemStore.ts`) includes:

```typescript
// State
protoplanetaryDisks: Record<string, ProtoplanetaryDisk>;
selectedProtoplanetaryDiskId: string | null;

// Actions
setProtoplanetaryDisks(disks: Record<string, ProtoplanetaryDisk>): void;
selectProtoplanetaryDisk(id: string | null): void;
updateProtoplanetaryDisk(id: string, patch: Partial<ProtoplanetaryDisk>): void;
removeProtoplanetaryDisk(id: string): void;
```

## GeneratorConfig Fields

New fields in `GeneratorConfig` (in `src/utils/procedural-generator.ts`):

```typescript
// Activation
enableProtoplanetaryDisks: boolean;                    // Master switch
protoplanetaryDiskProbability: number;                 // 0-1 probability per system

// Geometry ranges
protoplanetaryDiskInnerRadiusRange: [number, number];  // Absolute units
protoplanetaryDiskOuterRadiusRange: [number, number];  // Multiplier × system size
protoplanetaryDiskThicknessRange: [number, number];    // Half-height range

// Visual ranges
protoplanetaryDiskParticleCountRange: [number, number];
protoplanetaryDiskOpacityRange: [number, number];
protoplanetaryDiskBrightnessRange: [number, number];
protoplanetaryDiskClumpinessRange: [number, number];
protoplanetaryDiskRotationSpeedMultiplierRange: [number, number];
```

### Default Values

```typescript
enableProtoplanetaryDisks: false,
protoplanetaryDiskProbability: 0.0,
protoplanetaryDiskInnerRadiusRange: [0.5, 1.5],
protoplanetaryDiskOuterRadiusRange: [3.0, 8.0],
protoplanetaryDiskThicknessRange: [0.2, 0.8],
protoplanetaryDiskParticleCountRange: [5000, 20000],
protoplanetaryDiskOpacityRange: [0.3, 0.7],
protoplanetaryDiskBrightnessRange: [0.3, 0.8],
protoplanetaryDiskClumpinessRange: [0.2, 0.6],
protoplanetaryDiskRotationSpeedMultiplierRange: [0.1, 0.5],
```

## UI Controls

### GenerationConfig (User-Facing)

Located in `src/types/generationConfig.ts`:

```typescript
enableProtoplanetaryDisks: boolean;       // Master switch
protoplanetaryDiskPresence: number;       // 0-1 → probability mapping
protoplanetaryDiskDensity: number;        // 0-1 → particle count
protoplanetaryDiskProminence: number;     // 0-1 → opacity/brightness/thickness
```

### Universe Generator Panel

The "Small Body Belts & Fields" section includes a "Protoplanetary Disks" subsection:

- **Enable checkbox**: `💿 Protoplanetary Disks (visual, young systems)`
- **Disk Presence slider**: 0-100% (maps to probability)
- **Disk Density slider**: 0-100% (maps to particle count)
- **Disk Prominence slider**: 0-100% (maps to visual intensity)

### Stats Display

Generation stats include:
- `Protoplanetary Disks: <count>`
- `Disk Particles (approx): <count>`

## Rendering

### ProtoplanetaryDiskObject Component

Located in `src/components/ProtoplanetaryDiskObject.tsx`:

```typescript
interface ProtoplanetaryDiskObjectProps {
  diskId: string;
}
```

#### Particle Distribution

Particles are distributed in a torus-like volume:
1. **Radial**: Uniform between `innerRadius` and `outerRadius`
2. **Angular**: Uniform [0, 2π)
3. **Vertical**: Gaussian distribution with σ = `thickness / 2`

#### Visual Features

- **Color blending**: Base → highlight based on radial position
- **Clumpiness**: Modulates density via sinusoidal noise
- **Size variation**: Larger particles near inner edge (hotter region)
- **Soft particles**: Custom shader with radial falloff

#### Animation

- Slow rotation around Y-axis
- Speed controlled by `timeScale × rotationSpeedMultiplier`
- Position updates to follow central star

### Shader Implementation

Custom `shaderMaterial` with:
- Vertex shader: Point size based on camera distance
- Fragment shader: Circular particles with soft edges
- Additive blending for glowing effect

### Scene Integration

In `Scene.tsx`:

```tsx
{Object.keys(protoplanetaryDisks).map(diskId => (
  <ProtoplanetaryDiskObject key={`disk-${diskId}`} diskId={diskId} />
))}
```

## Generation Algorithm

### ProtoplanetaryDiskGenerator Class

Located in `src/utils/procedural-generator.ts`:

```typescript
class ProtoplanetaryDiskGenerator {
  generate(stars: Record<string, Star>, rootIds: string[]): Record<string, ProtoplanetaryDisk>
}
```

#### Algorithm Flow

1. Check `enableProtoplanetaryDisks` - skip if disabled
2. Fork RNG: `diskRng = rng.fork('disk-<systemId>')`
3. For each root system:
   - Sample disk probability → `diskRng.bool(probability)`
   - If no disk → skip
4. If disk chosen:
   - Calculate inner/outer radius based on system scale
   - Sample thickness, particle count from ranges
   - Sample colors from warm dust palette
   - Sample opacity, brightness, clumpiness
   - Determine style based on thickness/opacity
   - Create `ProtoplanetaryDisk` object

### Integration Point

Disk generation occurs in Phase 9, after Lagrange points and before groups:

```
Phase 8: Lagrange Points / Trojans
Phase 9: Protoplanetary Disks (visual fields) ← NEW
Phase 10: Groups
```

## Presets

### Style Preset Defaults

| Preset | Enabled | Presence | Density | Prominence |
|--------|---------|----------|---------|------------|
| Sparse | ❌ | 0% | 30% | 30% |
| Solar-like | ❌ | 0% | 50% | 50% |
| Crowded | ✅ | 20% | 50% | 60% |
| Super Dense | ✅ | 50% | 80% | 90% |

### Young System Configuration

A dedicated preset for young systems with prominent disks:

```typescript
export const YOUNG_SYSTEM_CONFIG: Partial<GeneratorConfig> = {
  enableProtoplanetaryDisks: true,
  protoplanetaryDiskProbability: 0.8,
  protoplanetaryDiskParticleCountRange: [10000, 25000],
  // ... other high-visibility settings
};
```

Usage:
```typescript
import { generateYoungSystem } from './generator-examples';
const system = generateYoungSystem('my-seed');
```

## Validation

### validateSystem() Checks

- `innerRadius > 0`
- `outerRadius > innerRadius`
- `thickness >= 0`
- `particleCount >= 0`
- `opacity ∈ [0, 1]`
- `brightness >= 0`
- `clumpiness ∈ [0, 1]`
- `centralStarId` references valid star

### analyzeSystem() Stats

- `totalProtoplanetaryDisks`: Count of disks
- `totalProtoplanetaryDiskParticles`: Sum of all particle counts
- `avgDiskInnerRadius`, `avgDiskOuterRadius`, `avgDiskThickness`

## Performance Considerations

1. **GPU-driven**: No per-particle CPU updates
2. **Rotation via uniform**: Entire disk rotates as single mesh
3. **Deterministic particles**: Computed once, cached in buffer
4. **LOD potential**: `particleCount` can be scaled by `smallBodyDetail`

## UI Integration

### System Overview

- Filter button: `💿 Disks`
- Entry format: `💿 <name> — Center: <star> — <count> particles`
- Actions: Focus camera, Edit (future)

### Stats Panel

Shows disk count and total particles when disks exist.

## Future Enhancements

- Temperature gradients (inner hot, outer cold)
- Dust clearing gaps (protoplanet shadows)
- Planet-forming bands (density variations)
- Gas component visualization
- Disk editor panel for real-time adjustments

## Related Documentation

- `ASTEROID_BELT_IMPLEMENTATION.md` - Similar small body system
- `KUIPER_BELT_IMPLEMENTATION.md` - Outer debris fields
- `RING_SYSTEMS_IMPLEMENTATION.md` - Per-planet rings
- `PROCEDURAL_GENERATOR.md` - Main generator documentation
- `GENERATOR_UI_INTEGRATION.md` - UI configuration mapping

