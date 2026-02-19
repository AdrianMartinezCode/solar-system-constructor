# Change Request: Docs taxonomy + category templates (no moves yet)

## Summary

Create a clear taxonomy for the existing `docs/` root technical documentation by defining a small set of **type-based categories** (subfolders) and providing **documentation templates** for each category. Do **not** move/reclassify existing docs yet; only prepare the structure and templates so a later, mechanical migration is low-risk.

## Context

`docs/` currently contains many high-signal technical writeups (features, implementation notes, refactor summaries, guides, and copy/paste prompts). They are useful but live flat in the root, which makes “where does X belong?” and “what shape should this doc be?” harder over time.

The repo already has workflow folders (`docs/requests/`, `docs/plans/`, `docs/prompts/`, `docs/decisions/`) and a `docs/README.md` map; this CR focuses on organizing *technical docs* in `docs/` root.

## Goals

- Define a small set of categories (subfolders) that cover the current docs by **document type**.
- Provide a **template** per category so new docs are consistent and scannable.
- Add a taxonomy reference doc that explains:
  - what belongs where
  - how `docs/prompts/` differs from “AI copy/paste prompts”
  - a proposed mapping of current docs → categories (without moving yet)

## Non-goals

- Moving any existing technical doc files yet (`git mv` migration is a follow-up).
- Renaming existing docs or rewriting their content.
- Changing application code under `src/`.

## Constraints

- Additive, low-risk changes.
- Avoid breaking existing paths/links (no moves in this CR).
- Keep taxonomy simple (prefer ≤ 5 new categories).

## Out of Scope

- Mechanical migration of existing docs into the new subfolders.
- Updating deep cross-links inside docs to new locations (only relevant after migration).
- Relocating non-doc artifacts in `docs/` (e.g. `docs/solar-system-constructor.code-workspace`) — can be handled later.

## Acceptance Criteria

- [ ] A taxonomy reference exists (categories + routing rules + proposed mapping).
- [ ] New category subfolders exist under `docs/` for technical docs.
- [ ] Each category subfolder contains a concise template file.
- [ ] Existing docs are not moved.

## Verification

```bash
npm run typecheck
npm run build
```

