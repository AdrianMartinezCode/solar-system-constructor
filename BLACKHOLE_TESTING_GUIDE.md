# Black Hole Visual Refactoring - Testing Guide

## Quick Start Testing

### 1. Generate Black Holes via UI

1. Open the **Universe Generator Panel**
2. Enable black holes:
   ```
   ☑ Enable Black Holes
   Black Hole Frequency: 50%
   Accretion Disk Intensity: 80%
   Relativistic Jet Frequency: 70%
   Visual Complexity: Cinematic
   ```
3. Click **"Generate Universe"**
4. Look for black holes in the 3D scene (dark center with glowing disk)

### 2. Test Visual Complexity Modes

Generate three separate universes with different complexity settings:

#### Minimal Mode
- Expected: Basic photon ring, weaker lensing, simplified disk
- Lensing: May show top arc only
- Photon ring: 1-2 sub-rings
- Overall: Cleaner, less dramatic

#### Normal Mode (Default)
- Expected: Full feature set with moderate effects
- Lensing: Top + bottom arcs visible
- Photon ring: 2 sub-rings
- Overall: Balanced realism and performance

#### Cinematic Mode
- Expected: Maximum visual quality
- Lensing: Prominent top + bottom arcs
- Photon ring: 3 sub-rings, very bright
- Disk: Thickest, most intense
- Jets: Most dramatic
- Overall: Hollywood-style visualization

### 3. Test Accretion Styles

Use Advanced Black Hole Settings:

#### Subtle Style
- Expected: Dimmer disk, less turbulence, faster jet fade
- Disk brightness: 0.4-0.7
- Temperature: 3000-10000 K
- Visual: More subdued, mature black hole

#### Normal Style
- Expected: Balanced appearance
- Disk brightness: 0.7-0.9
- Temperature: 5000-20000 K
- Visual: Standard active black hole

#### Quasar Style
- Expected: Intense, dramatic disk
- Disk brightness: 0.9-1.0
- Temperature: 15000-50000 K
- Strong spiral patterns
- Slower jet fade (longer jets)
- Visual: Ultra-luminous, young/feeding black hole

### 4. Inspector Testing

Select a black hole in the 3D scene and test each control:

#### Core Presence Flags
- [ ] Toggle "Accretion Disk" - disk should appear/disappear
- [ ] Toggle "Relativistic Jet" - jets should appear/disappear
- [ ] Toggle "Photon Ring" - ring should appear/disappear

#### Geometry
- [ ] Shadow Radius: Drag slider - entire structure should scale
- [ ] Disk Inner Radius: Adjust - gap between shadow and disk should change
- [ ] Disk Outer Radius: Adjust - disk should extend/contract
- [ ] Disk Thickness: Adjust - volumetric appearance should change

#### Disk Appearance
- [ ] Brightness: 0.0 → 1.0 - disk should dim/brighten continuously
- [ ] Opacity: 0.0 → 1.0 - disk should become transparent/opaque
- [ ] Temperature: 1000 → 50000 K - color should shift red → white → blue
- [ ] Clumpiness: 0.0 → 1.0 - disk should smooth out / show more density variation

#### Jets
- [ ] Jet Length: Increase - jets should extend
- [ ] Jet Opening Angle: Increase - jets should widen
- [ ] Jet Brightness: 0.0 → 1.0 - jets should dim/brighten

#### Relativistic FX
- [ ] Doppler Beaming: 0.0 → 1.0 - disk asymmetry should increase (one side brighter)
- [ ] Lensing Strength: 0.0 → 1.0 - top/bottom arcs should appear/strengthen

#### Animation
- [ ] Rotation Speed Multiplier: 0.1 → 3.0 - disk rotation should slow/speed up

#### **NEW: Disk Orientation**
- [ ] Disk Tilt: 0° → 90° - black hole should rotate from face-on to edge-on
- [ ] Tilt Axis Angle: 0° → 360° - tilt direction should rotate around vertical

## Visual Quality Checklist

### Continuous Disk Appearance
Look at the accretion disk from various angles:

- [ ] **Inner edge is extremely bright** (white-hot, continuous glow)
- [ ] **No visible gap** between photon ring and inner disk
- [ ] **Smooth radial gradient** from white (inner) → orange → red (outer)
- [ ] **Disk appears thick**, not paper-thin
- [ ] **No harsh edges** or cut-outs at inner radius
- [ ] **Spiral patterns visible** (streaking/shearing)
- [ ] **Turbulence visible** (density variations, clumps)

### Photon Ring Integration
Focus on the photon ring:

- [ ] **Hugs shadow tightly** (minimal gap)
- [ ] **Multiple concentric sub-rings** visible (2-3 depending on complexity)
- [ ] **Color matches disk temperature** (feels like part of disk, not separate)
- [ ] **Smooth blending** with inner disk (no hard boundary)
- [ ] **No harsh banding** between sub-rings
- [ ] **Soft edge fades** (inner and outer)

### Gravitational Lensing
Check lensing effects (set lensingStrength to 0.8+):

- [ ] **Top lensed arc** visible above shadow
- [ ] **Bottom lensed arc** visible below shadow (NEW!)
- [ ] Both arcs are **warped/curved** (not flat)
- [ ] Arcs are **dimmer than main disk** (~30% brightness)
- [ ] Arcs are **slightly cooler** in color temperature
- [ ] Arcs **rotate synchronously** with main disk
- [ ] **No z-fighting** or flickering

### Relativistic Jets
Inspect the jets:

- [ ] Jets **emerge directly from poles** (no vertical gap)
- [ ] Jet base is **wide enough** to visually intersect disk region
- [ ] Jets **narrow toward tip** (cone shape, not cylinder)
- [ ] **Bright core** visible (spine)
- [ ] **Dimmer outer sheath** visible around core
- [ ] **Smooth gradient** from base (bright) to tip (fades to zero)
- [ ] Jets **visible from all angles** (no face culling issues)
- [ ] Tip **fades smoothly** (no hard cut-off)

### Unified Appearance
Overall impression:

- [ ] **Reads as one object**, not separate pieces
- [ ] **No visible seams** between components
- [ ] **No z-fighting** or rendering artifacts
- [ ] Shadow **properly occludes** disk/ring where it should
- [ ] Disk **partially occludes** jets behind it
- [ ] **Smooth blending** everywhere (additive blending consistent)
- [ ] Entire structure **tilts together** when adjusting disk tilt

## Doppler Beaming Test

Set `dopplerBeamingStrength` to 1.0:

- [ ] **One side of disk noticeably brighter** (approaching side)
- [ ] **Opposite side noticeably dimmer** (receding side)
- [ ] **Color shift visible**: brighter side slightly blue-shifted, dimmer side slightly red-shifted
- [ ] Effect is **smooth and continuous** (not harsh)

## Disk Tilt Test

Test the new disk tilt feature:

1. **Face-on (0°):**
   - [ ] Disk appears circular from above
   - [ ] Inner glow very prominent
   - [ ] Lensed arcs less visible

2. **Moderate Tilt (45°):**
   - [ ] Disk appears elliptical
   - [ ] Both face and edge visible
   - [ ] Lensed arcs more prominent

3. **Edge-on (90°):**
   - [ ] Disk appears as thin line
   - [ ] Volumetric thickness most visible
   - [ ] Lensed arcs very prominent (wraparound visible)
   - [ ] Shadow clearly silhouetted

4. **Tilt Axis Angle:**
   - [ ] At 0°: Tilt axis along X
   - [ ] At 90°: Tilt axis along Z
   - [ ] At 180°: Tilt axis along -X
   - [ ] At 270°: Tilt axis along -Z
   - [ ] Smooth rotation as angle changes

## Performance Test

- [ ] **60 FPS maintained** with 1-3 black holes in scene
- [ ] **No frame drops** when rotating camera around black hole
- [ ] **No stuttering** during disk animation
- [ ] **No memory leaks** after generating multiple universes

## Comparison with Reference Images

If you have the reference images (Interstellar, NASA visualizations):

### Disk Appearance
- [ ] **Continuous hot accretion flow** ✓
- [ ] **Strong radial gradient** (bright inner, dim outer) ✓
- [ ] **Spiral patterns** visible ✓

### Lensing
- [ ] **Top lensed arc** over shadow ✓
- [ ] **Bottom lensed arc** below shadow ✓ (NEW!)
- [ ] **Wraparound effect** visible ✓

### Jets
- [ ] Jets **emerge from center** ✓
- [ ] Jets **anchored to accretion region** ✓ (no gaps)
- [ ] Jets **fade naturally** toward tip ✓

### Overall
- [ ] **Unified object** feel ✓
- [ ] **Cinematic quality** ✓
- [ ] **Physically suggestive** ✓

## Known Visual Behaviors

### Expected Behaviors

1. **Inner disk glow may appear "overbright"** - This is intentional to simulate intense radiation
2. **Photon ring may flicker slightly** at extreme angles - Minor z-ordering artifact, acceptable
3. **Lensed arcs appear only above lensingStrength ~0.3** - By design for performance
4. **Jets may appear dim at base when edge-on** - Due to viewing angle through disk
5. **Slight shimmer in disk turbulence** - Procedural noise animation, intentional

### Unexpected Behaviors (Report if Found)

1. ❌ **Hard edges or visible gaps** between disk and photon ring
2. ❌ **Vertical gap between jets and disk region**
3. ❌ **Z-fighting or flickering** between main disk and volumetric layers
4. ❌ **Lensed arcs not rotating** with main disk
5. ❌ **Photon ring disappearing** at certain angles
6. ❌ **Disk appearing flat** even with high diskThickness
7. ❌ **Jets cutting through shadow** inappropriately
8. ❌ **Tilt not affecting entire structure** together

## Save/Load Test

1. Generate a universe with black holes
2. Customize a black hole:
   - Set unique disk tilt (e.g., 60°)
   - Set unusual colors or parameters
3. **Save** the system
4. **Reload** the page
5. Verify:
   - [ ] Black hole still exists
   - [ ] All properties preserved (including diskTilt)
   - [ ] Visual appearance identical
   - [ ] Animations still working

## Determinism Test

1. Note the current seed (if visible in UI)
2. Generate a universe with black holes
3. Note black hole properties (mass, spin, disk tilt, colors)
4. Clear universe and regenerate with **same seed**
5. Verify:
   - [ ] Same number of black holes generated
   - [ ] Same properties (within floating-point precision)
   - [ ] Same visual appearance

## Edge Cases

### Very Small Black Holes
- Shadow radius: 0.1
- [ ] Still renders correctly
- [ ] No geometry degeneration
- [ ] Photon ring scales appropriately

### Very Large Black Holes
- Shadow radius: 10.0
- [ ] Still renders correctly
- [ ] No clipping or culling issues
- [ ] Lensing effects still visible

### Extreme Spin
- Spin: 0.99
- [ ] Disk rotates very fast
- [ ] No rendering artifacts
- [ ] Doppler beaming pronounced

### Zero Spin
- Spin: 0.0
- [ ] Disk still rotates (via rotationSpeedMultiplier)
- [ ] Visual effects still present

### Maximum Lensing
- Lensing strength: 1.0
- [ ] Both lensed arcs very prominent
- [ ] Warping extreme but not broken
- [ ] No geometry inversion

### Zero Lensing
- Lensing strength: 0.0
- [ ] Lensed arcs not visible
- [ ] Main disk still warped slightly (vertex displacement minimum)

## Report Template

If you find issues, report using this template:

```
**Issue Description:**
Brief description of the visual problem

**Steps to Reproduce:**
1. Generate universe with...
2. Set parameter X to...
3. Observe...

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Screenshots:**
[Attach if possible]

**System Info:**
- Browser:
- GPU:
- Performance: FPS during issue

**Black Hole Properties:**
- bodyType: blackHole
- shadowRadius: X
- diskTilt: X
- lensingStrength: X
- (other relevant properties)
```

## Success Criteria

The refactoring is successful if:

✅ **All visual quality checklist items pass**
✅ **No visual seams or gaps** between components
✅ **Disk reads as continuous, hot, thick structure**
✅ **Photon ring feels integrated** with disk
✅ **Jets are properly anchored** with no gaps
✅ **Top AND bottom lensed arcs** visible at high lensing
✅ **Disk tilt controls work** and affect entire structure
✅ **All inspector controls functional**
✅ **Performance maintained** (60 FPS)
✅ **Backward compatibility preserved**
✅ **Save/load/determinism work**

---

## Quick Visual Reference

### Target Appearance (High-Level)

**From Face-On (0° tilt):**
```
        .-"""-.
       /       \      ← Lensed arc (top, dim)
      |    ●    |     ← Photon ring (bright, hugs shadow)
      |  ████   |     ← Shadow (black)
      |█████████|     ← Inner disk (white-hot, continuous)
       \█████████/    ← Outer disk (orange-red, gradient)
        '-███-'
          |||         ← Jets (anchored, fade upward)
```

**From Edge-On (90° tilt):**
```
          |||         ← Jet
    .-""""●"""-.      ← Lensed arc (top, wraparound)
    ██████●██████     ← Disk (line, shows thickness)
    '-""""●""""-'     ← Lensed arc (bottom, NEW!)
          |||         ← Jet
          ●           ← Shadow (silhouette)
```

**Legend:**
- `●` = Shadow / Event Horizon
- `█` = Bright disk emission (white-hot inner, orange outer)
- `|` = Jet
- `.'-"` = Lensed image arcs

This is the visual target - a unified, continuous, relativistic black hole!

