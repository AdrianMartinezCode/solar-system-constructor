# Body POV Camera Feature

## Overview

The Body POV (Point of View) Camera feature allows you to view your solar system from the perspective of any star or planet. When activated, the camera anchors to the selected body and moves with it through space, allowing you to see the rest of the universe from that body's perspective.

## How to Use

### Entering Body POV Mode

1. **Select a star or planet** by clicking on it in the 3D view or selecting it from the sidebar list
2. In the **Star Editor Panel**, you'll see a new button: **"👁️ View from Here"**
3. Click this button to enter Body POV mode

### What Happens in Body POV Mode

- The camera **smoothly transitions** from its current position to the selected body (transition takes ~1 second)
- The camera positions itself near the body with a configurable offset (default: 10× the body's radius)
- The camera **moves with the body** as it orbits, maintaining its relative position
- You can still:
  - **Rotate** the view (left click + drag) to look around
  - **Pan** (right click + drag) to adjust your viewpoint
  - **Zoom** (scroll) to get closer or farther from the body
- A **camera mode indicator** appears at the top of the screen showing which body you're viewing from

### Exiting Body POV Mode

You can exit Body POV mode in two ways:

1. Click the **"📷 Exit Body View"** button in the Star Editor Panel (replaces the "View from Here" button when active)
2. Click the **✕** button on the camera mode indicator at the top of the screen

When you exit, the camera smoothly transitions back to the overview position.

## Technical Details

### State Management

The camera mode is managed in the Zustand store with:

- `cameraMode`: Either `'overview'` or `'body'`
- `cameraTargetBodyId`: ID of the star/planet being viewed from (null in overview mode)
- `cameraOffset`: Multiplier for camera distance from body (default: 10)

### Camera Positioning

The camera controller:

- Calculates the **world position** of the target body (including all parent orbital transformations)
- Positions the camera at: `bodyWorldPosition + offsetVector`
- Sets the orbit controls target to: `bodyWorldPosition`
- Updates every frame to follow the body as it moves

### Smooth Transitions

Transitions between modes use:

- **Duration**: 1 second
- **Easing**: Ease-in-out cubic for smooth acceleration/deceleration
- **Lerp interpolation**: Both camera position and look-at target are smoothly interpolated

## Implementation Files

The feature is implemented across these files:

1. **`src/state/systemStore.ts`**: Adds camera state and actions
2. **`src/components/BodyCameraController.tsx`**: Core camera logic (NEW)
3. **`src/components/Scene.tsx`**: Integrates the controller into the scene
4. **`src/ui/StarEditorPanel.tsx`**: Adds "View from Here" button
5. **`src/App.tsx`**: Adds camera mode indicator UI
6. **`src/App.css`**: Styles for the indicator

## Use Cases

- **Observe orbital mechanics** from a moving reference frame
- **See how the universe looks** from different vantage points
- **Create cinematic views** for presentations or screenshots
- **Debug orbital paths** by viewing them from a specific body
- **Experience the scale** of your nested solar systems from within

## Future Enhancements

Possible improvements:

- Configurable camera offset distance in UI
- Multiple camera presets (close-up, far view, etc.)
- Ability to record camera paths/animations
- "Follow mode" vs "fixed offset mode"
- Keyboard shortcuts for quick camera mode switching

