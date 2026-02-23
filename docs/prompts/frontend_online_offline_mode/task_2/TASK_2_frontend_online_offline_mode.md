# Task 2: Create the ModeSelectionScreen component

## Objective

Build the mode selection screen — the first UI users see when entering the application. It presents two clearly-labeled options ("Online" and "Offline") as clickable cards, styled consistently with the project's dark theme. This is a **presentational component** that receives its behavior via props.

## Context to Read First

- `apps/web/src/types/appMode.ts` — the `AppMode` type (created in Task 1).
- `apps/web/src/App.css` — existing theme: `#0d0d0d` background, Inter font, accent colors, glass-morphism patterns.
- `apps/web/src/components/AppHeader.tsx` + `apps/web/src/components/AppHeader.css` — reference for component + CSS pairing conventions.
- `apps/web/src/components/Window.tsx` + `apps/web/src/components/Window.css` — reference for card/panel styling patterns used in the project.

## Constraints

- **Pure presentational**: the component receives `onSelect(mode: AppMode)` as a prop. It does **not** import or use any Zustand store directly.
- Do **not** modify any existing files.
- No new npm dependencies.
- Use plain CSS (`.css` file), not CSS-in-JS or CSS modules — consistent with the rest of the project.
- Use emoji or Unicode symbols for icons (the project uses emoji icons elsewhere, e.g., `🖱️` in App.tsx).

## Steps

1. Create `apps/web/src/components/ModeSelectionScreen.css`:
   - Full-screen overlay layout, centered vertically and horizontally.
   - Dark background (`#0d0d0d`) with a subtle radial gradient, matching `scene-container-windowed`.
   - Two side-by-side cards with hover effects, borders, and glass-morphism styling.
   - Cards should have: an icon area, a title ("Online" / "Offline"), and a short description.
   - Responsive: stack cards vertically on narrow screens (≤ 600px).

2. Create `apps/web/src/components/ModeSelectionScreen.tsx`:
   - Props interface: `{ onSelect: (mode: AppMode) => void }`.
   - Import `AppMode` from `../types/appMode`.
   - Render a centered container with:
     - A heading (e.g., "Solar System Constructor" or "Choose Your Mode").
     - A subtitle explaining the choice.
     - Two cards:
       - **Offline**: icon 💾, title "Offline", description "Work locally — your universe is saved in the browser. No server needed."
       - **Online**: icon 🌐, title "Online", description "Connect to a server — your universe is stored in the cloud and can be shared."
     - Each card calls `onSelect('offline')` or `onSelect('online')` on click.

## Files to Create/Update

- `apps/web/src/components/ModeSelectionScreen.tsx` (new)
- `apps/web/src/components/ModeSelectionScreen.css` (new)

## Acceptance Criteria

- [ ] `ModeSelectionScreen` component is exported from `apps/web/src/components/ModeSelectionScreen.tsx`.
- [ ] Component accepts `onSelect: (mode: AppMode) => void` prop.
- [ ] Renders two clickable cards: "Online" and "Offline".
- [ ] Clicking each card calls `onSelect` with the corresponding mode value.
- [ ] Visual style matches the project's dark theme (dark background, light text, accent borders, hover effects).
- [ ] Layout is centered and responsive.
- [ ] No existing files are modified.
- [ ] `npm run build` passes.

## Verification

```bash
cd apps/web && npx tsc --noEmit
cd ../.. && npm run build
```

## Notes

- The "Online" card description mentions "cloud" and "shared" as aspirational descriptors. The actual backend integration comes later — but the copy should convey the intended future behavior to the user.
- Keep the component simple and elegant. The mode screen is the first impression of the app.
- Consider adding a subtle animation (fade-in) for the screen to feel polished.
