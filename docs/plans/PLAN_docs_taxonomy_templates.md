# Plan: Docs taxonomy + category templates (no moves yet)

## Summary

Introduce a small, type-based taxonomy for the technical documentation currently living in `docs/` root. The taxonomy is expressed as new subfolders (categories) plus a template per category. This plan explicitly avoids moving any existing docs yet; it only establishes structure, templates, and a mapping so later migration is mechanical and low-risk.

## Repo snapshot used

- Contract + workflow:
  - `agents/agents.md`
  - `agents/skills/WORKFLOW.md`
  - `agents/skills/po_task_decomposer.md`
  - `agents/skills/prompt_writer.md`
- Docs map + workflow structure:
  - `docs/README.md`
  - `docs/requests/CR_TEMPLATE.md`
  - `docs/` tree
- Representative technical docs to infer recurring structure:
  - `docs/ALGORITHM_FLOW.md`
  - `docs/GENERATOR_QUICKREF.md`
  - `docs/KEYBOARD_SHORTCUTS.md`
  - `docs/ASTEROID_BELT_IMPLEMENTATION.md`
  - `docs/BELT_PARTICLE_FIELD_REFACTORING.md`
  - `docs/UI_IMPLEMENTATION_SUMMARY.md`
  - `docs/GROUP_ISOLATION_FEATURE.md`
  - `docs/TIME_SCALE_FEATURE.md`
  - `docs/ROGUE_PLANETS.md`
  - `docs/ELLIPTICAL_ORBITS.md`
  - `docs/PROMPT_UI_DOMAIN_SEPARATION_REFACTOR.md`

## Assumptions

- We optimize for “where does this doc go?” and “what shape should it have?” over perfect topical grouping.
- A **type-based** taxonomy is stable even as features grow (docs can link across topics freely).
- We should avoid naming collisions/confusion with the existing workflow folder `docs/prompts/` (task prompts).

## Risks / unknowns

- Some docs are “hybrids” (usage + implementation); the mapping should be treated as a starting point.
- Later migration (`git mv`) can break links if not done mechanically (should be its own follow-up CR/task).

## Out of scope

- Moving/reclassifying existing technical docs (explicitly excluded for now).
- Editing content of existing technical docs beyond link updates (not needed until migration).

## Proposed taxonomy (new subfolders)

These categories are for **technical docs** currently in `docs/` root.

- `docs/design/`: architecture, structure, conceptual models, diagrams, “how it works”
- `docs/implementation/`: feature implementation docs that point to concrete files/APIs and describe behavior
- `docs/guides/`: “how to use” / quick reference / operator guides / integration guides
- `docs/summaries/`: delivery notes, refactor summaries, “what changed and why”
- `docs/ai_prompts/`: copy/paste prompts for other models/agents (distinct from `docs/prompts/` task prompts)

Notes:
- Keep workflow folders as-is: `docs/requests/`, `docs/plans/`, `docs/prompts/`, `docs/decisions/`.
- `docs/README.md` remains the primary “docs map”.

## Proposed templates (per category)

These are the intended section skeletons for the `TEMPLATE.md` files created in Task 2.

### `docs/design/TEMPLATE.md`

- Title
- Status (draft | stable)
- Problem / context
- Goals / non-goals
- Key concepts / terminology
- System overview (diagram optional)
- Data model / invariants (link to types where relevant)
- Key flows (step-by-step)
- Tradeoffs / alternatives
- Open questions
- Related docs

### `docs/implementation/TEMPLATE.md`

- Title
- Overview (user-facing outcome)
- Behavior / UX notes
- Data model changes (types / state)
- Algorithms / approach
- Files touched (grouped by area)
- Performance considerations
- Compatibility / migrations
- Verification (how to validate in app / scripts)
- Follow-ups

### `docs/guides/TEMPLATE.md`

- Title
- Audience
- Prerequisites
- Quick start
- How-to (common tasks)
- Troubleshooting / FAQ
- Reference (links to design/implementation docs)

### `docs/summaries/TEMPLATE.md`

- Title
- Summary (what changed)
- Motivation (why)
- Scope (what’s in / out)
- Notable changes (bullets)
- Files touched
- Risk / rollback notes
- Verification
- Follow-ups

### `docs/ai_prompts/TEMPLATE.md`

- Prompt title
- Intended model + role
- Context to read first (links / file paths)
- Objective
- Constraints / do-nots
- Deliverables
- Suggested approach (steps)
- Files to touch (explicit)
- Verification commands
- Notes / pitfalls

## Proposed mapping (no moves yet)

This mapping is the target classification *if/when* we later migrate files into subfolders. No files are moved in this plan.

### `docs/design/`

- `docs/ALGORITHM_FLOW.md`
- `docs/BODY_EDITOR_STRUCTURE.md`
- `docs/BODY_POV_CAMERA.md`
- `docs/PROCEDURAL_GENERATOR.md`
- `docs/TOPOLOGY_GRAMMAR_PRESETS.md`
- `docs/UI_PREVIEW.md`
- `docs/UI_REDESIGN_WINDOWED.md`

### `docs/implementation/`

- `docs/ASTEROID_BELT_IMPLEMENTATION.md`
- `docs/BLACK_HOLES_IMPLEMENTATION.md`
- `docs/COMETS_IMPLEMENTATION.md`
- `docs/ELLIPTICAL_ORBITS.md`
- `docs/GENERATOR_IMPLEMENTATION.md`
- `docs/GROUP_ISOLATION_FEATURE.md`
- `docs/KUIPER_BELT_IMPLEMENTATION.md`
- `docs/LAGRANGE_POINTS_IMPLEMENTATION.md`
- `docs/NEBULAE_IMPLEMENTATION.md`
- `docs/PROTOPLANETARY_DISK_IMPLEMENTATION.md`
- `docs/RING_SYSTEMS_IMPLEMENTATION.md`
- `docs/ROGUE_PLANETS.md`
- `docs/TIME_SCALE_FEATURE.md`
- `docs/WINDOWED_UI_IMPLEMENTATION.md`

### `docs/guides/`

- `docs/GENERATOR_QUICKREF.md`
- `docs/GENERATOR_UI_INTEGRATION.md`
- `docs/KEYBOARD_SHORTCUTS.md`
- `docs/PRNG_README.md`
- `docs/STATS_USAGE_GUIDE.md`

### `docs/summaries/`

- `docs/BELT_PARTICLE_FIELD_REFACTORING.md`
- `docs/BODY_EDITOR_REFACTOR_SUMMARY.md`
- `docs/COMETS_DOCUMENTATION_UPDATES.md`
- `docs/GENERATOR_DELIVERY.md`
- `docs/PRNG_SUMMARY.md`
- `docs/STATS_REFACTOR_SUMMARY.md`
- `docs/UI_IMPLEMENTATION_SUMMARY.md`

### `docs/ai_prompts/`

- `docs/PROMPT_AGENT_SYSTEM_SETUP.md`
- `docs/PROMPT_MINIMAL_AGENT_RUNBOOK.md`
- `docs/PROMPT_UI_DOMAIN_SEPARATION_REFACTOR.md`

### Non-doc artifact currently in `docs/` root (recommendation only)

- `docs/solar-system-constructor.code-workspace` (consider moving to repo root later; not part of this change)

## Task list (ordered)

### Task 1 — Publish taxonomy reference doc + link from docs map

- **Goal**: Create `docs/TAXONOMY.md` describing categories, routing rules, and the mapping above; link it from `docs/README.md`.
- **Scope / non-goals**: no doc moves; no content rewrites.
- **Dependencies**: none
- **Files likely touched**:
  - `docs/TAXONOMY.md` (new)
  - `docs/README.md` (update)
- **Acceptance criteria**:
  - A taxonomy exists and clearly distinguishes `docs/prompts/` (task prompts) vs `docs/ai_prompts/` (copy/paste prompts).
  - The mapping covers all current `docs/` root markdown docs.
- **Verification commands**:
  - `npm run typecheck`
  - `npm run build`

### Task 2 — Create category subfolders + add templates

- **Goal**: Add the new category directories under `docs/` and add one template file per category.
- **Scope / non-goals**: no moving existing docs; templates only (no bulk edits).
- **Dependencies**: Task 1 (so templates can link back to taxonomy)
- **Files likely touched**:
  - Create:
    - `docs/design/TEMPLATE.md`
    - `docs/implementation/TEMPLATE.md`
    - `docs/guides/TEMPLATE.md`
    - `docs/summaries/TEMPLATE.md`
    - `docs/ai_prompts/TEMPLATE.md`
- **Acceptance criteria**:
  - Each new category subfolder exists and contains a template.
  - Templates are concise, consistent, and reference the taxonomy doc.
- **Verification commands**:
  - `npm run typecheck`
  - `npm run build`

