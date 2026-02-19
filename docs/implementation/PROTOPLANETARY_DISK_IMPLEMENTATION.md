# Protoplanetary Disk Implementation

This document describes the implementation of the Protoplanetary Disk feature in the Solar System Constructor.

## Overview (user-facing outcome)

Protoplanetary disks are visual-only **shader-driven continuous disks** representing young circumstellar disks of gas and dust around stars. Unlike the original particle-only implementation, the current version uses a **mesh-based disk with a fragment shader** to create realistic ALMA-like visuals with concentric rings, gaps, and radial temperature gradients, plus a **lightweight particle overlay** for sparkle effects.

## Behavior / UX notes

- Disks are visual-only and attached to stars; they should move with their host system.
- UI should allow toggling and tuning disk appearance without impacting simulation physics.

## Data model changes

- **Types**: adds a `ProtoplanetaryDisk` entity/type with geometry + visual parameters + seed.
- **State**: stored in universe state alongside other visual constructs.
- **Persistence**: persisted with the universe snapshot; deterministic appearance via seed.

## Algorithms / approach

### Key Characteristics

- **Visual-only**: Rendered as shader-driven mesh + sparse particles, not as `Star` entities
- **ALMA-inspired**: Bright inner regions, concentric bands/gaps, soft outer falloff
- **Deterministic**: Uses PRNG for reproducible appearance per disk
- **GPU-efficient**: Fragment shader handles band/gap computation, minimal particle overhead
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
  thickness: number;          // Vertical half-height (affects volumetric look)
  
  // Visual parameters
  particleCount: number;      // Sparkle particles only (reduced from original)
  baseColor: string;          // Outer/cooler regions hex color
  highlightColor: string;     // Inner/hotter regions hex color
  opacity: number;            // 0-1 overall transparency
  brightness: number;         // Emissive intensity
  clumpiness: number;         // 0-1 density variation
  rotationSpeedMultiplier: number; // Visual swirl speed
  
  // PRNG
  seed: string | number;
  style: 'thin' | 'moderate' | 'thick' | 'extreme';
  name?: string;
  
  // ============================================================================
  // Shader-Specific Visual Controls (new)
  // ============================================================================
  
  bandStrength?: number;        // 0-1 ring/gap contrast
  bandFrequency?: number;       // Number of visible bands (2-12)
  gapSharpness?: number;        // 0-1 how crisp the dark gaps are
  innerGlowStrength?: number;   // 0-1 extra brightness near star
  noiseScale?: number;          // Noise pattern scale (0.5-3.0)
  noiseStrength?: number;       // 0-1 noise modulation strength
  spiralStrength?: number;      // 0-0.5 spiral arm perturbation
  spiralArmCount?: number;      // 1-4 spiral arms
  edgeSoftness?: number;        // 0-1 outer edge diffuseness
  temperatureGradient?: number; // Color transition steepness (0.5-3.0)
}
```

### New Shader Parameters Explained

| Parameter | Range | Description |
|-----------|-------|-------------|
| `bandStrength` | 0-1 | How prominent concentric rings/gaps appear |
| `bandFrequency` | 2-12 | Number of visible bright/dark ring pairs |
| `gapSharpness` | 0-1 | Sharpness of dark gaps between rings |
| `innerGlowStrength` | 0-1 | Extra emission boost near inner edge |
| `noiseScale` | 0.5-3.0 | Spatial frequency of noise patterns |
| `noiseStrength` | 0-1 | How much noise modulates brightness |
| `spiralStrength` | 0-0.5 | Non-axisymmetric spiral perturbation |
| `spiralArmCount` | 1-4 | Number of spiral arms |
| `edgeSoftness` | 0-1 | How diffuse the outer edge is |
| `temperatureGradient` | 0.5-3.0 | Color gradient steepness |

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

## Rendering Architecture

### Overview

The disk is rendered as a **hybrid system**:
1. **Primary**: A `THREE.RingGeometry` mesh with a custom fragment shader
2. **Secondary**: A lightweight `THREE.Points` overlay for sparkle/dust effects

This approach achieves:
- Continuous, smooth disk appearance without needing millions of particles
- Realistic ALMA-like banding and gaps via shader math
- Optional particle sparkle for added visual depth
- High GPU efficiency (single draw call for main disk)

### ProtoplanetaryDiskObject Component

Located in `src/components/ProtoplanetaryDiskObject.tsx`:

```typescript
interface ProtoplanetaryDiskObjectProps {
  diskId: string;
}
```

#### Shader-Driven Disk (Primary)

The main disk uses a ring geometry with a custom fragment shader that computes:

1. **Polar coordinates**: Radius and angle from fragment position
2. **Temperature gradient**: Color blend from inner (hot) to outer (cool)
3. **Inner glow**: Extra brightness boost near star
4. **Band structure**: Periodic sine-based rings with noise perturbation
5. **Gap sharpness**: Adjustable dark gap contrast
6. **Spiral perturbation**: Optional non-axisymmetric waves
7. **Clumpiness**: FBM noise for density variation
8. **Edge softness**: Smooth outer falloff

#### Sparkle Overlay (Secondary)

A small particle system (hundreds, not thousands) provides:
- Subtle dust twinkle effect
- Depth and texture
- Visual interest without performance cost

#### Shader Uniforms

```glsl
// Core
uniform float uInnerRadius, uOuterRadius, uThickness;
uniform float uOpacity, uBrightness;
uniform vec3 uBaseColor, uHighlightColor;
uniform float uClumpiness, uSeed;

// Band/Gap Controls
uniform float uBandStrength, uBandFrequency;
uniform float uGapSharpness, uInnerGlowStrength;

// Noise/Effects
uniform float uNoiseScale, uNoiseStrength;
uniform float uSpiralStrength, uSpiralArmCount;
uniform float uEdgeSoftness, uTemperatureGradient;

// Animation
uniform float uTime;
```

#### Fragment Shader Algorithm

```glsl
void main() {
  // 1. Calculate polar coordinates from position
  float radiusNorm = (radius - innerR) / (outerR - innerR);
  float angle = atan(pos.y, pos.x);
  
  // 2. Temperature gradient: inner hot, outer cool
  float tempBlend = pow(1.0 - radiusNorm, uTemperatureGradient);
  vec3 color = mix(uBaseColor, uHighlightColor, tempBlend);
  
  // 3. Inner glow effect
  float glow = pow(1.0 - radiusNorm, 2.5) * uInnerGlowStrength;
  
  // 4. Concentric bands with noise
  float bandPattern = sin(radiusNorm * uBandFrequency * 2π + noise());
  float bandMask = mix(1.0, bandPattern, uBandStrength);
  
  // 5. Apply gap sharpness
  float gaps = smoothstep(...);
  bandMask *= mix(1.0, gaps, uGapSharpness);
  
  // 6. Optional spiral arms
  float spiral = sin(angle * armCount + radiusNorm * 8.0);
  
  // 7. Clumpiness noise
  float clump = fbm(noiseCoord);
  
  // 8. Edge softness falloff
  float edge = 1.0 - smoothstep(1.0 - uEdgeSoftness, 1.0, radiusNorm);
  
  // 9. Combine all effects
  float finalBrightness = uBrightness * bandMask * spiral * clump * edge + glow;
  gl_FragColor = vec4(color * finalBrightness, uOpacity * combinedMask);
}
```

### Animation

- Slow rotation around Y-axis
- Speed controlled by `timeScale × rotationSpeedMultiplier`
- Time uniform for subtle animated effects

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

#### Style-Based Parameter Presets

The generator derives shader parameters from the disk's style:

| Style | Band Strength | Band Freq | Gap Sharp | Inner Glow | Spiral |
|-------|--------------|-----------|-----------|------------|--------|
| thin | 0.3-0.5 | 4-7 | 0.3-0.5 | 0.4-0.6 | 0-0.1 |
| moderate | 0.4-0.7 | 3-6 | 0.4-0.7 | 0.5-0.8 | 0-0.2 |
| thick | 0.5-0.8 | 2-5 | 0.5-0.8 | 0.6-0.9 | 0.1-0.3 |
| extreme | 0.6-0.95 | 2-4 | 0.6-0.9 | 0.7-1.0 | 0.2-0.5 |

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
   - **Sample shader parameters from style presets** (new)
   - Create `ProtoplanetaryDisk` object with all new fields

#### Particle Count Note

The `particleCount` is now reduced to ~2% of original values since the shader handles the continuous disk appearance. Particles are purely for sparkle overlay.

## UI Controls

### GenerationConfig (User-Facing)

Located in `src/types/generationConfig.ts`:

```typescript
enableProtoplanetaryDisks: boolean;       // Master switch
protoplanetaryDiskPresence: number;       // 0-1 → probability mapping
protoplanetaryDiskDensity: number;        // 0-1 → particle count (sparkle)
protoplanetaryDiskProminence: number;     // 0-1 → opacity/brightness/thickness
```

### Universe Generator Panel

The "Small Body Belts & Fields" section includes a "Protoplanetary Disks" subsection:

- **Enable checkbox**: `💿 Protoplanetary Disks (visual, young systems)`
- **Disk Presence slider**: 0-100% (maps to probability)
- **Disk Density slider**: 0-100% (maps to sparkle particle count)
- **Disk Prominence slider**: 0-100% (maps to visual intensity)

### Disk Editor Panel

When a disk is selected (via 3D scene click or System Overview), the **ProtoplanetaryDiskEditorPanel** opens with tabs:

#### Colors Tab
- Base Color (outer/cooler)
- Highlight Color (inner/hotter)
- Brightness slider
- Opacity slider
- Temperature Gradient slider
- Inner Glow slider

#### Bands Tab
- Band Strength slider
- Band Frequency slider
- Gap Sharpness slider
- Edge Softness slider

#### Effects Tab
- Clumpiness slider
- Noise Scale slider
- Noise Strength slider
- Spiral Strength slider
- Spiral Arms count (conditional)
- Rotation Speed slider

#### Info Tab
- Name (editable)
- Style selector
- Geometry info (read-only)
- ID, Central Star ID, Seed (read-only)

### Stats Display

Generation stats include:
- `Protoplanetary Disks: <count>`
- `Disk Particles (approx): <count>`

## Performance Considerations

1. **Single draw call**: Main disk is one mesh with fragment shader
2. **GPU-computed bands**: No CPU iteration for ring patterns
3. **Minimal particles**: Sparkle overlay uses hundreds, not thousands
4. **Rotation via uniform**: No vertex buffer updates
5. **Deterministic**: Computed once per disk seed
6. **LOD-ready**: Particle count can be further scaled if needed

## Comparison: Old vs New

| Aspect | Old (Particle-only) | New (Shader + Sparkle) |
|--------|-------------------|----------------------|
| Appearance | Noisy particle ring | Smooth continuous disk |
| Bands/Gaps | None | Adjustable shader-driven |
| Inner glow | Via particle density | Dedicated shader effect |
| Temperature | Simple color blend | Gradient exponent control |
| Spirals | None | Optional shader spiral |
| Particles | 5000-20000 | 100-400 (sparkle only) |
| Performance | Moderate | Better (shader-driven) |

## Files Modified/Created

### New Files
- `src/ui/ProtoplanetaryDiskEditorPanel.tsx` - Editor panel component
- `src/ui/ProtoplanetaryDiskEditorPanel.css` - Editor panel styles

### Modified Files
- `src/types.ts` - Extended `ProtoplanetaryDisk` interface
- `src/utils/procedural-generator.ts` - Updated `ProtoplanetaryDiskGenerator`
- `src/components/ProtoplanetaryDiskObject.tsx` - Complete shader rewrite
- `src/components/WindowManager.tsx` - Added disk editor window type
- `src/state/windowStore.ts` - Added 'diskEditor' window type
- `src/components/SystemOverview.tsx` - Open editor on disk click

## Related Documentation

- `BELT_PARTICLE_FIELD_REFACTORING.md` - Similar particle field approach
- `ASTEROID_BELT_IMPLEMENTATION.md` - Similar small body system
- `KUIPER_BELT_IMPLEMENTATION.md` - Outer debris fields
- `RING_SYSTEMS_IMPLEMENTATION.md` - Per-planet rings
- `PROCEDURAL_GENERATOR.md` - Main generator documentation
- `GENERATOR_UI_INTEGRATION.md` - UI configuration mapping

## Files touched

- UI:
  - Disk rendering components/shaders
  - Disk editor section(s) (if present)
- State:
  - `src/types.ts` (disk type)
  - Generator integration (optional)
- Docs:
  - This doc

## Performance considerations

- Shader-driven mesh avoids huge particle counts; keep particle overlay sparse.

## Compatibility / migrations

- Backward compatible: disks are additive entities; older saves have none.

## Verification

- Manual checks:
  - Generate/enable a protoplanetary disk and confirm mesh+shader visuals render correctly.
  - Toggle disk visibility and confirm no simulation side effects.
- Scripts:
  - `npm run typecheck`
  - `npm run build`

## Follow-ups

- Consider a quality knob for disk shader detail if performance varies across GPUs.
