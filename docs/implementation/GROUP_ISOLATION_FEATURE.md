# Group Isolation / Solo in Viewport Feature

## Overview (user-facing outcome)

The **Solo in Viewport** feature allows you to isolate a specific group and its contents in the 3D viewport, temporarily hiding all other groups, systems, and objects. This is useful for focusing on a specific cluster of systems without visual clutter from the rest of the universe.

## Behavior / UX notes

- Isolation is a **visibility filter**: it does not move systems or refocus the camera automatically.
- Isolation applies recursively to nested child groups.

## Data model changes

- **Types**: no new universe entities; isolation is represented as UI/state flags (selected isolated group id).
- **State**: stores the currently isolated group (or null) and uses that to filter what renders.
- **Persistence**: isolation state may or may not be persisted; treat as UI state by default.

## Algorithms / approach

## Key Characteristics

### What Happens When You Isolate a Group

✅ **Preserves Original Positions**: The isolated group and its systems remain in their exact original spatial positions
✅ **Maintains Layout**: Systems inside the group keep their grid layout and relative positions
✅ **No Camera Movement**: The camera does not automatically move or refocus
✅ **Hides Everything Else**: All non-isolated content is hidden from view

### What Gets Hidden

When a group is isolated, the following are hidden:
- All other groups (not in the isolated hierarchy)
- Ungrouped systems (root systems not in any group)
- Rogue planets
- Legacy asteroid belts (unless their parent star is in the isolated group)
- Nebulae (unless associated with the isolated group or its descendants)

### What Remains Visible

Only the following remain visible:
- The isolated group box at its original position
- All systems contained in the isolated group
- All systems in nested child groups (recursive)
- All celestial bodies within those systems (planets, moons, asteroids, comets, etc.)
- Protoplanetary disks and small body fields attached to visible systems
- Nebulae associated with the isolated group or any of its descendant groups

## How to Use

### Method 1: Group Editor Panel

1. Select a group (click on it in the viewport or in the System Overview)
2. Open the Group Editor panel (if not already open)
3. At the top of the editing form, you'll see a checkbox labeled **"Solo in viewport (show only this group)"**
4. Check the box to isolate the group
5. Uncheck the box to return to normal view

### Method 2: System Overview Panel

1. Open the System Overview panel
2. Filter by "Groups" or search for a specific group
3. In the results list, each group has action buttons on the right
4. Click the **lock icon** (🔒) to isolate the group
5. Click the **unlock icon** (🔓) when active to exit isolation mode

### Switching Between Isolated Groups

- If you have Group A isolated and toggle isolation on Group B, the viewport switches to show only Group B
- Only one group can be isolated at a time
- Toggling the same group again turns off isolation and restores normal view

## Implementation Details

### State Management

**Store State** (`src/state/systemStore.ts`):
```typescript
isolatedGroupId: string | null; // ID of the currently isolated group, or null
```

**Store Actions**:
```typescript
setIsolatedGroupId(id: string | null): void;
toggleIsolatedGroup(id: string): void;
```

### Automatic Cleanup

The isolation state is automatically cleared when:
- The isolated group is deleted (`removeGroup` action)
- The isolated group becomes invalid or is removed from the groups collection

### Rendering Logic

**Scene Filtering** (`src/components/Scene.tsx`):

When `isolatedGroupId` is set:
1. **Compute allowed sets**:
   - Collect all system root IDs in the isolated group and descendants (`getGroupSystems`)
   - Collect all star IDs in those systems (including planets, moons, etc.)
   - Collect all group IDs (isolated group + all descendants via `getGroupAndDescendants`)

2. **Render only the isolated group**:
   - The group box is rendered at its original position
   - Systems are laid out inside the group in their normal grid pattern
   - The group expands to show its contents (like `nestingLevel: 'max'`)

3. **Filter other elements**:
   - Rogue planets: Hidden completely
   - Legacy belts: Only shown if `belt.parentId` is in the allowed star set
   - Nebulae: Only shown if their `associatedGroupIds` intersects with allowed group set

### Nested Groups Support

The isolation feature fully supports nested groups:
- When you isolate a parent group, all child groups and their systems are visible
- The recursive structure is preserved
- Nested groups maintain their spatial relationships

## UI Components

### Group Editor Panel Toggle

**Location**: `src/ui/GroupEditorPanel.tsx`

**Appearance**: Checkbox at the top of the edit form when a group is selected

**Behavior**:
- Disabled/hidden when no group is selected
- Shows checked state when the selected group is currently isolated
- Clicking toggles isolation on/off for the selected group

### System Overview Lock Button

**Location**: `src/components/SystemOverview.tsx`

**Appearance**: Lock icon button (🔒/🔓) next to group results

**Behavior**:
- Shows lock (🔒) when group is not isolated
- Shows unlock (🔓) when group is currently isolated
- Purple background when active
- Clicking toggles isolation for that specific group

## Use Cases

### 1. Focusing on a Galaxy
You have multiple galaxies (groups), each containing many star systems. Isolate one galaxy to work on its systems without distraction.

### 2. Reviewing Nested Clusters
Isolate a galaxy cluster (parent group) to see all its member galaxies (child groups) and their systems, while hiding other clusters.

### 3. Presentation Mode
When demonstrating or explaining a specific region of your universe, isolate that group for a clean, focused view.

### 4. Complex System Editing
When editing systems in a crowded universe, isolate the parent group to reduce visual noise and improve performance.

## Technical Notes

### Performance Considerations

- Isolation is implemented via filtering at render time
- No scene graph manipulation or position calculations occur
- The feature has minimal performance impact
- Large isolated groups render the same as they would normally

### Coordinate System

- Groups and systems maintain their absolute world coordinates
- Isolation does not affect or modify position data
- Camera controls (orbit, pan, zoom) continue to work normally
- Grid helper and background stars remain visible

### Compatibility

- Works with all existing group features (nesting, colors, positions)
- Compatible with all celestial body types (stars, planets, moons, etc.)
- Compatible with special objects (black holes, comets, Lagrange points)
- Works with both legacy belts and new small body fields

## Example Workflow

```
1. Create a group called "Milky Way" with 5 star systems
2. Create a child group "Local Cluster" with 3 of those systems
3. Create another top-level group "Andromeda" with 4 systems
4. Create some ungrouped systems

Normal view: All 3 groups and ungrouped systems visible

Isolate "Milky Way":
  ✓ "Milky Way" group box visible at its position
  ✓ "Local Cluster" child group visible (nested)
  ✓ All 5 systems in "Milky Way" visible (including the 3 in "Local Cluster")
  ✗ "Andromeda" group hidden
  ✗ Ungrouped systems hidden

Toggle off: Back to normal view with everything visible
```

## Future Enhancements

Potential future additions to this feature:
- Multiple group isolation (isolate 2+ groups simultaneously)
- Temporary isolation hotkey (hold key to toggle, release to restore)
- Save/load isolation presets
- Dim instead of hide (partial opacity for non-isolated content)
- Isolation history (quick toggle between recent isolated groups)

## Related Documentation

- [Group Management](../summaries/UI_IMPLEMENTATION_SUMMARY.md) - General group features
- [Nesting Level Control](../summaries/UI_IMPLEMENTATION_SUMMARY.md#nesting-level-control) - Group expansion controls
- [System Overview](../summaries/UI_IMPLEMENTATION_SUMMARY.md#system-overview) - Search and filter interface

## Troubleshooting

**Issue**: Isolated group appears in wrong position
- **Solution**: Groups render at their assigned `position` property. Check the group's position in the Group Editor.

**Issue**: Systems missing when isolated
- **Solution**: Verify the systems are actually children of the isolated group. Check group contents in Group Editor.

**Issue**: Isolation won't toggle off
- **Solution**: Click the toggle again, or select a different group and toggle it instead, then toggle off.

**Issue**: Nebulae disappear when isolating
- **Solution**: Nebulae need `associatedGroupIds` to remain visible during isolation. Add the isolated group ID to the nebula's associations.

**Issue**: Can't see anything after isolating empty group
- **Solution**: The group has no systems. Add systems to the group or exit isolation mode.

## Files touched

- UI:
  - Group editor / overview surfaces that toggle isolation
  - Rendering filters that hide non-isolated content
- State:
  - Window/UI store state for “isolated group id”
- Docs:
  - This doc + UI summary references

## Performance considerations

- Isolation should reduce render load by skipping hidden systems; ensure filtering is efficient for large universes.

## Compatibility / migrations

- No migration expected; isolation is additive UI behavior.

## Verification

- Manual checks:
  - Isolate a group with nested subgroups and confirm only that subtree is visible.
  - Toggle off isolation and confirm full universe returns without camera jump.
- Scripts:
  - `npm run typecheck`
  - `npm run build`

## Follow-ups

- Consider promoting “Future Enhancements” items above into separate tracked tasks.
