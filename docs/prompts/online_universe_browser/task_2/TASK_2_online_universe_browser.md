# Task 2: Create the `UniverseBrowser` presentational component

## Objective

Build a full-screen UI component that displays a list of universes and provides actions to Load, Delete, and Create universes. This is a presentational component — it receives all data and callbacks via props and contains no direct store or API access.

## Context to Read First

- `apps/web/src/components/ModeSelectionScreen.tsx` + `.css` — reference for full-screen dark-themed layout, card styling, and visual patterns.
- `apps/web/src/app/ports/universeApiClient.ts` — the `ApiUniverse` type used for prop typing.
- `apps/web/src/components/AppHeader.css` — reference for button styles and color palette.
- `docs/plans/PLAN_online_universe_browser.md` — plan overview.

## Constraints

- **Presentational only** — receives data and callbacks via props. No `import` of stores or API clients.
- Visual style must match the project's existing dark theme (`#0d0d0d` background, Inter font, subtle borders, accent colors).
- No new npm dependencies.
- Do not modify any existing files.

## Steps

1. Create `apps/web/src/components/UniverseBrowser.css` with styles for:
   - Full-screen centered layout (similar to `ModeSelectionScreen.css`).
   - Universe list (cards or rows).
   - Action buttons (Load, Delete, Create, Back).
   - Loading spinner/indicator.
   - Empty state message.
   - Delete confirmation inline UI.

2. Create `apps/web/src/components/UniverseBrowser.tsx`:
   - Define the component props interface:
     ```typescript
     interface UniverseBrowserProps {
       universes: ApiUniverse[];
       loading: boolean;
       onLoad: (id: string) => void;
       onDelete: (id: string) => void;
       onCreate: () => void;
       onBack: () => void;
     }
     ```
   - Render a header section with:
     - Title: "Universe Browser" (or similar).
     - "Create New Universe" button.
     - "Back" button (to return to mode selection).
   - Render a loading indicator when `loading` is `true`.
   - Render the universe list as cards/rows, each showing:
     - Universe name.
     - Created date (formatted nicely).
     - Last updated date (formatted nicely).
     - "Load" button (primary action).
     - "Delete" button (danger action).
   - For Delete, implement an inline confirmation pattern:
     - First click shows "Are you sure?" with Confirm/Cancel buttons.
     - Confirm calls `onDelete(id)`.
     - Cancel returns to normal state.
   - Render an empty state message when `universes` is empty and `loading` is false (e.g., "No universes found. Create one to get started!").

## Files to Create/Update

- `apps/web/src/components/UniverseBrowser.tsx` **(new)**
- `apps/web/src/components/UniverseBrowser.css` **(new)**

## Acceptance Criteria

- [ ] Component renders a full-screen dark-themed layout.
- [ ] When `loading` is `true`, a loading indicator is shown.
- [ ] When `universes` is empty and not loading, an empty state message is shown.
- [ ] Each universe displays name, created date, and updated date.
- [ ] Each universe has a "Load" button that calls `onLoad(id)`.
- [ ] Each universe has a "Delete" button that triggers inline confirmation.
- [ ] Confirming delete calls `onDelete(id)`.
- [ ] "Create New Universe" button calls `onCreate()`.
- [ ] "Back" button calls `onBack()`.
- [ ] Visual style matches the project's dark theme.
- [ ] `npm run build` passes without errors.

## Verification

```bash
cd /home/adr/front-portfolio-interactive/solar-system-constructor
npm run build
```

## Notes

- Date formatting: use `new Date(isoString).toLocaleDateString()` or similar — no date library needed.
- The inline delete confirmation can use simple React state (`useState`) within the component for tracking which universe ID has a pending delete confirmation.
- Keep the layout responsive — it should look good on different screen sizes.
- Consider using CSS grid or flexbox for the universe list.
