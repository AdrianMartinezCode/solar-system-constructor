# Task title

Publish docs taxonomy reference (categories + routing rules + mapping)

## Objective

Create a single, durable reference that explains how technical docs in `docs/` should be categorized going forward, and record a proposed mapping for all current `docs/` root docs **without moving anything yet**.

## Context to read first

- `docs/README.md`
- `docs/plans/PLAN_docs_taxonomy_templates.md`
- `docs/` directory tree (current files)

## Constraints

- Do not move or rename existing docs.
- Keep taxonomy simple (use the planned categories; do not expand unless necessary).
- Avoid confusion with `docs/prompts/` (these are workflow task prompts, not “AI copy/paste prompts”).

## Steps

1. Create `docs/TAXONOMY.md` with:
   - Purpose and scope (technical docs in `docs/` root)
   - Category definitions:
     - `docs/design/`
     - `docs/implementation/`
     - `docs/guides/`
     - `docs/summaries/`
     - `docs/ai_prompts/`
   - Routing rules (“if your doc is X, put it in Y”)
   - A “prompts terminology” section clarifying:
     - `docs/prompts/` = per-task implementation prompts produced by the workflow
     - `docs/ai_prompts/` = reusable copy/paste prompts for other models/agents
   - Proposed mapping for all current `docs/` root docs (copy from the plan and keep it updated).
2. Update `docs/README.md` to link to `docs/TAXONOMY.md` from an obvious place (near “Folders” / “Conventions”).

## Files to create/update

- Create: `docs/TAXONOMY.md`
- Update: `docs/README.md`

## Acceptance criteria

- [ ] `docs/TAXONOMY.md` exists and explains categories + routing rules clearly.
- [ ] The mapping includes every current markdown doc in `docs/` root (excluding the workflow subfolders).
- [ ] `docs/README.md` links to `docs/TAXONOMY.md`.
- [ ] No docs are moved/renamed in this task.

## Verification

```bash
npm run typecheck
npm run build
```

## Notes

- Treat the mapping as a “plan of record” for a later mechanical migration task (separate scope).

