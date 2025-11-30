# Time Scale Feature

## Overview

The time scale feature provides global control over the simulation speed of all orbital motion in the solar system constructor.

## Implementation

### 1. State Management (Zustand Store)

**File**: `src/state/systemStore.ts`

Added to `SystemStore` interface:
```typescript
timeScale: number; // Global simulation speed multiplier (0-5)
setTimeScale: (value: number) => void;
```

Default value: `1.0` (normal speed)

### 2. Simulation Update

**Function**: `tick(dt)` in `src/state/systemStore.ts`

```typescript
tick: (dt) => {
  set((state) => ({
    time: state.time + dt * state.timeScale,
  }));
},
```

The `timeScale` is applied when advancing the simulation time. This affects all orbital calculations since they depend on the global `time` value.

### 3. UI Control Component

**Files**: 
- `src/ui/SimulationSpeedControl.tsx`
- `src/ui/SimulationSpeedControl.css`

Features:
- **Slider**: Visual control (0-5 range, 0.1 step)
- **Numeric Input**: Precise value entry
- **Quick Presets**: Buttons for common speeds (Pause, 0.5x, 1x, 2x, 5x)
- **Visual Feedback**: Dynamic label showing current speed status
- **Range Clamping**: Ensures values stay within 0-5 bounds

### 4. Integration

Added to `src/App.tsx` at the top of the sidebar for easy access.

## How It Works

### Orbital Motion Flow

1. `useFrame` hook (react-three-fiber) calls `tick(delta)` every frame
2. `tick` advances global time: `time += delta * timeScale`
3. `StarObject` components read `time` from store
4. `calculateOrbitalPosition` computes position using: `angle = time * orbitalSpeed`
5. Stars render at computed positions

### Time Scale Effects

| timeScale | Effect                                    |
|-----------|-------------------------------------------|
| 0.0       | Paused (no orbital motion)                |
| 0.5       | Half speed (slow motion)                  |
| 1.0       | Normal speed (default)                    |
| 2.0       | Double speed                              |
| 5.0       | Maximum speed (5x acceleration)           |

## Usage

### For Users

1. Locate the "⏱️ Simulation Speed" panel at the top of the sidebar
2. Use the slider to adjust speed in real-time
3. Or type an exact value (0.00 - 5.00)
4. Or click preset buttons for instant speed changes

### For Developers

Access the time scale programmatically:

```typescript
import { useSystemStore } from './state/systemStore';

// In a component
const timeScale = useSystemStore((state) => state.timeScale);
const setTimeScale = useSystemStore((state) => state.setTimeScale);

// Pause the simulation
setTimeScale(0);

// Double the speed
setTimeScale(2);

// Imperative API
useSystemStore.setState({ timeScale: 3 });
```

## Benefits

1. **Exploration**: Slow down to observe complex orbital mechanics
2. **Performance**: Pause when not needed
3. **Testing**: Accelerate to quickly verify long-term orbital stability
4. **Presentation**: Control pacing during demonstrations
5. **Debugging**: Pause and step through motion issues

## Technical Details

### Why This Approach Works

- **Single Source of Truth**: One global `time` variable drives all motion
- **Consistent Scaling**: All orbits scale uniformly
- **No Performance Impact**: Simple multiplication operation
- **Maintains Physics**: Orbital relationships remain correct at all speeds

### Alternative Approaches (Not Used)

❌ Applying timeScale at each `calculateOrbitalPosition` call
  - Would require passing timeScale everywhere
  - More complex and error-prone

❌ Modifying `delta` before passing to `tick`
  - Violates separation of concerns
  - Animation controller shouldn't know about time scaling

✅ Applying timeScale in `tick` function
  - Clean, centralized
  - Affects all downstream calculations automatically
  - Easy to understand and maintain

## Future Enhancements

Possible improvements:

- [ ] Keyboard shortcuts (e.g., Space to pause, +/- to adjust)
- [ ] Time scale history/undo
- [ ] Per-object time scaling (advanced)
- [ ] Animation of time scale changes (smooth transitions)
- [ ] Persistence of time scale preference to localStorage

## Compatibility

This feature is fully compatible with:
- Nested solar systems (infinite depth)
- N-ary systems (binary, ternary, etc.)
- Procedural generation
- Group hierarchies
- All existing orbital parameters

## Testing

To verify the feature works correctly:

1. Start the app
2. Generate or load a system with multiple orbiting objects
3. Set time scale to 0 → orbits should pause completely
4. Set time scale to 5 → orbits should move 5x faster
5. Set time scale to 0.5 → orbits should move in slow motion
6. Verify UI updates in real-time
7. Check that nested orbits scale uniformly

## Files Modified

1. `src/state/systemStore.ts` - Added state and actions
2. `src/App.tsx` - Added control component to UI
3. `src/ui/SimulationSpeedControl.tsx` - NEW control component
4. `src/ui/SimulationSpeedControl.css` - NEW styling

## Dependencies

No new dependencies required. Uses existing:
- Zustand (state management)
- React (UI)
- TypeScript (type safety)

