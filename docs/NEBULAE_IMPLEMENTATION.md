# Nebulae Regions Implementation

## Overview

Nebulae are large-scale volumetric gas/dust clouds at galactic/universe scale. They are visual-only regions that exist primarily outside star/group clusters, designed for dramatic visual effect and scene composition.

## Key Characteristics

- **Scale**: Galaxy/universe scale (80-250 units radius)
- **Position**: Primarily between or around galaxy groups/clusters
- **Visual-Only**: No physics simulation, purely for rendering
- **Deterministic**: Fully reproducible with same seed via PRNG
- **Highly Visible**: Large radii, bright colors, strong opacity

## Data Model

### NebulaRegion Type

```typescript
export interface NebulaRegion {
  id: string;
  name: string;
  position: Position;  // 3D position in universe space
  
  // Geometry
  radius: number;  // Primary radius (spherical)
  dimensions?: { x: number; y: number; z: number };  // Optional ellipsoid
  
  // Visual parameters
  density: number;  // 0-1, controls visual thickness/opacity
  brightness: number;  // 0-1, emissive intensity
  baseColor: string;  // Dominant color (hex)
  accentColor: string;  // Highlight/edge color (hex)
  noiseScale: number;  // 3D noise frequency
  noiseDetail: number;  // Noise octaves/complexity
  
  // Metadata
  associatedGroupIds?: string[];  // Groups this nebula borders
  seed: string | number;  // Per-nebula PRNG seed
  visible?: boolean;
}
```

## Generator Configuration

### Internal GeneratorConfig Parameters

```typescript
interface GeneratorConfig {
  // Master switch
  enableNebulae: boolean;
  
  // Density control
  nebulaDensity: number;  // 0-1 slider
  nebulaCountRange: [number, number];  // [min, max] total nebulae
  
  // Geometry
  nebulaSizeRange: [number, number];  // Radius range
  nebulaThicknessRange: [number, number];  // Elongation factor
  nebulaDistanceFromGroups: [number, number];  // Distance from clusters
  
  // Visual style
  nebulaColorPalettes: Array<{ base: string; accent: string }>;
  nebulaBrightnessRange: [number, number];
  nebulaDensityRange: [number, number];
  nebulaNoiseScaleRange: [number, number];
  nebulaNoiseDetailRange: [number, number];
  
  // Optional LOD
  nebulaDetail?: 'low' | 'medium' | 'high' | 'ultra';
}
```

### UI-Facing GenerationConfig

```typescript
interface GenerationConfig {
  enableNebulae: boolean;
  nebulaDensity: number;  // 0-1 slider
  nebulaSizeBias?: 'small' | 'medium' | 'giant';
  nebulaColorStyle?: 'random' | 'warm' | 'cool' | 'mixed';
  nebulaBrightness?: number;  // 0-1 optional brightness slider
}
```

## Generation Algorithm

### Phase: Nebula Regions (Galaxy-Scale Visual Volumes)

**Timing**: After group generation, before final output

**Process**:

1. **Count Determination**
   - Map `nebulaDensity` (0-1) to `nebulaCountRange` using geometric scaling
   - density 0 → minCount, density 1 → maxCount

2. **Cluster Center Computation**
   - Extract positions from groups (if grouping enabled)
   - Estimate cluster radii from `groupPositionSigma`
   - Fallback to synthetic clusters if no groups

3. **Spatial Placement**
   - For each nebula:
     - Pick a random "host" cluster
     - Sample distance from `nebulaDistanceFromGroups`
     - Sample random direction (uniform on sphere)
     - Compute position: `clusterPos + direction * distance`
     - Ensure position is outside cluster bounding spheres

4. **Geometry Sampling**
   - Sample radius from `nebulaSizeRange`
   - Sample thickness factor from `nebulaThicknessRange`
   - Decide spherical vs ellipsoidal (30% chance ellipsoid)
   - For ellipsoids: scale x/y/z independently

5. **Visual Parameter Sampling**
   - Sample density from `nebulaDensityRange`
   - Sample brightness from `nebulaBrightnessRange`
   - Pick color palette from `nebulaColorPalettes` (filtered by style)
   - Sample noise parameters from ranges
   - Generate per-nebula seed

6. **Name Generation**
   - Use curated list (Orion, Eagle, Horsehead, etc.)
   - Fallback to catalog designations (NGC, IC, M, SH2, etc.)

### PRNG Integration

```typescript
const masterRng = createPRNG(seed);
const nebulaRng = new RandomGenerator(masterRng.fork('nebulae'));

// Per-nebula fork
const nebulaInstanceRng = nebulaRng.fork(`nebula-${index}`);
```

**Determinism Guarantee**: Same seed → identical nebula layout, colors, sizes

## Color Palettes

### HII Regions (Emission Nebulae)
- Pinkish-red: `#FF6B9D` / `#FFB3D9`
- Rose: `#FF4D88` / `#FF99CC`

### Blue Reflection Nebulae
- Sky blue: `#4DA6FF` / `#99CCFF`
- Azure: `#3399FF` / `#66B2FF`

### Dark/Mixed Nebulae
- Purple: `#9966CC` / `#CC99FF`
- Orange: `#FF8C42` / `#FFB380`

### Greenish (Rare, Oxygen Lines)
- Green: `#5BC95B` / `#99E699`

## Preset Configurations

### Sparse
- `enableNebulae: false`
- No nebulae for minimal scenes

### Solar-Like
- `enableNebulae: true`
- `nebulaDensity: 0.2` (few nebulae)
- `nebulaSizeBias: 'medium'`
- `nebulaColorStyle: 'mixed'`

### Crowded
- `enableNebulae: true`
- `nebulaDensity: 0.5` (moderate)
- `nebulaSizeBias: 'medium'`
- `nebulaColorStyle: 'mixed'`

### Super Dense Experimental
- `enableNebulae: true`
- `nebulaDensity: 0.8` (many overlapping)
- `nebulaSizeBias: 'giant'`
- `nebulaColorStyle: 'mixed'`
- `nebulaBrightness: 0.9`

## State Management

### SystemStore Integration

```typescript
interface SystemStore {
  nebulae: Record<string, NebulaRegion>;
  selectedNebulaId: string | null;
  
  setNebulae: (nebulae: Record<string, NebulaRegion>) => void;
  selectNebula: (id: string | null) => void;
  updateNebula: (id: string, patch: Partial<NebulaRegion>) => void;
  removeNebula: (id: string) => void;
}
```

## Rendering

### Approach

Nebulae are rendered as:
- **Volumetric fog volumes** (ray-marched shader in sphere/ellipsoid), OR
- **GPU particle fields** (similar to protoplanetary disks but at larger scale)

### Visual Parameters

- `baseColor` / `accentColor`: Gradient colors
- `density`: Drives alpha/opacity
- `brightness`: Emissive intensity
- `noiseScale` / `noiseDetail`: 3D noise for density modulation
- `seed`: Deterministic noise generation

### Implementation Notes

- Nebulae do NOT appear as `Star` objects
- They are NOT included in physics simulation
- They are strictly visual-only volumetric regions
- Rendering component: `NebulaObject.tsx` (to be created)
- Scene integration: Add to `Scene.tsx` alongside other visual features

## UI Components

### Universe Generator Panel

**Section**: "Interstellar Nebulae (Visual Fields)"

**Controls**:
- Checkbox: "Enable Nebulae Regions"
- Slider: Nebula Density (0-1, "Few large clouds" → "Many overlapping regions")
- Dropdown: Nebula Color Style (Warm HII / Cool reflection / Mixed)
- Dropdown: Typical Size (Small / Medium / Giant)

**Stats Display**:
- Nebula Regions: N

### Nebula Editor Window

**Type**: `NebulaEditor`

**Tabs**:
1. **Shape**: radius/dimensions, thickness, noise scale/detail
2. **Visual**: base & accent colors, brightness, density/opacity
3. **Metadata**: name, id, associated groups (readonly list)

**Actions**: Apply / Reset buttons

### System Overview

**Filters**: Add 🌫 Nebulae toggle

**Stats**: Include "Nebulae: <count>" in summary

**Click Action**: Focus camera on nebula center, open Nebula Editor

### Hierarchy Tree

**Display**: Nebulae appear under root "Universe" node or group nodes

**Icon**: Distinct nebula icon (🌫 or similar)

**Summary**: Show radius and brightness in text

## Window Management

### WindowStore Extension

```typescript
type WindowType = 
  | 'overview'
  | 'hierarchy'
  | 'generator'
  | 'planetEditor'
  | 'groupEditor'
  | 'stats'
  | 'nebulaEditor';  // NEW

interface WindowData {
  nebulaId?: string;  // For nebulaEditor windows
}
```

### Keyboard Shortcuts

- `Ctrl+N`: Open Nebula editor for selected nebula

## Performance Considerations

- Nebula generation is O(N) where N = nebula count (typically 2-12)
- Rendering cost depends on implementation:
  - Ray-marched volumes: expensive but high quality
  - GPU particles: cheaper, scales with particle count
- LOD control via `nebulaDetail` parameter (optional)

## Testing & Validation

### Determinism Test
```typescript
const seed = 12345;
const config = { enableNebulae: true, nebulaDensity: 0.5 };
const result1 = generateUniverse({ ...config, seed });
const result2 = generateUniverse({ ...config, seed });
// result1.nebulae should deep-equal result2.nebulae
```

### Visual Test
- Generate universe with high nebula density
- Verify nebulae appear outside group clusters
- Check color variety and brightness
- Confirm nebulae are visible and prominent

## Future Enhancements

- Nebula-nebula interactions (overlapping blend modes)
- Animated nebula evolution (slow rotation, pulsing)
- Nebula-based star formation regions (visual link to protoplanetary disks)
- Custom nebula shapes (not just spheres/ellipsoids)
- Nebula templates (save/load favorite nebula configurations)

## References

- Protoplanetary Disk Implementation: `PROTOPLANETARY_DISK_IMPLEMENTATION.md`
- Small Body Belts: `ASTEROID_BELT_IMPLEMENTATION.md`, `KUIPER_BELT_IMPLEMENTATION.md`
- PRNG System: `PRNG_README.md`, `PRNG_SUMMARY.md`
- Generator Algorithm: `ALGORITHM_FLOW.md`, `PROCEDURAL_GENERATOR.md`

