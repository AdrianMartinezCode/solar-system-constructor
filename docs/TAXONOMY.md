# Docs taxonomy (technical docs)

## Purpose

Keep `docs/` **navigable and consistent** as the repo grows by giving every new technical doc a clear “home” and a predictable shape.

This taxonomy applies to **technical documentation** that lives under the type-based taxonomy folders:

- `docs/design/`
- `docs/implementation/`
- `docs/guides/`
- `docs/summaries/`
- `docs/ai_prompts/`

## Scope / non-scope

- **In scope**: technical docs under the taxonomy folders above.
- **Not in scope**: workflow artifacts (now managed via the SDD pipeline in `openspec/`).
  - `docs/decisions/` (ADRs, triage notes) remain here for historical reference.

## Categories (type-based)

These categories are based on **document type**, not topic. Topic cross-linking is encouraged.

- **`docs/design/`**: architecture, structure, conceptual models, diagrams, “how it works”
- **`docs/implementation/`**: feature implementation docs describing concrete behavior and referencing code/files
- **`docs/guides/`**: “how to use”, quick reference, operator/integration guides
- **`docs/summaries/`**: delivery notes, refactor summaries, “what changed and why”
- **`docs/ai_prompts/`**: reusable copy/paste prompts for other models/agents (distinct from workflow task prompts)

## Routing rules (where does this doc go?)

- Put it in **`docs/design/`** if it primarily explains **structure or concepts** (mental model first; code references optional).
- Put it in **`docs/implementation/`** if it primarily explains **how a feature works in code** (files, algorithms, behavior, performance).
- Put it in **`docs/guides/`** if the primary outcome is **helping someone do a task** (steps, quick start, troubleshooting).
- Put it in **`docs/summaries/`** if it primarily records **a change set** (what changed, why, risks, verification).
- Put it in **`docs/ai_prompts/`** if it is meant to be **copied into an AI tool** to drive work in this repo.

If a doc feels “hybrid”, pick the best-fit category and add cross-links to the other relevant docs.

## Prompts terminology

- **`docs/ai_prompts/`**: technical documentation. Reusable copy/paste prompts intended to be run in external AI tools.
- Workflow task prompts (formerly `docs/prompts/`) are now archived in `openspec/changes/archive/`.

## Mapping (current locations)

This section reflects the current locations after migration into taxonomy folders.

## Migration checklist (docs root → taxonomy folders)

This checklist is meant to make the migration mechanical: it enumerates **every** markdown file that previously lived in `docs/` root and where it should land.

| Root doc | Destination | Category | Notes |
| --- | --- | --- | --- |
| `docs/README.md` | _(stays in `docs/` root)_ | index | Primary docs entry point / map |
| `docs/TAXONOMY.md` | _(stays in `docs/` root)_ | index | Routing rules + mapping reference |
| `docs/ALGORITHM_FLOW.md` | `docs/design/ALGORITHM_FLOW.md` | design |  |
| `docs/BODY_EDITOR_STRUCTURE.md` | `docs/design/BODY_EDITOR_STRUCTURE.md` | design |  |
| `docs/BODY_POV_CAMERA.md` | `docs/design/BODY_POV_CAMERA.md` | design |  |
| `docs/PROCEDURAL_GENERATOR.md` | `docs/design/PROCEDURAL_GENERATOR.md` | design |  |
| `docs/TOPOLOGY_GRAMMAR_PRESETS.md` | `docs/design/TOPOLOGY_GRAMMAR_PRESETS.md` | design |  |
| `docs/UI_PREVIEW.md` | `docs/design/UI_PREVIEW.md` | design |  |
| `docs/UI_REDESIGN_WINDOWED.md` | `docs/design/UI_REDESIGN_WINDOWED.md` | design |  |
| `docs/ASTEROID_BELT_IMPLEMENTATION.md` | `docs/implementation/ASTEROID_BELT_IMPLEMENTATION.md` | implementation |  |
| `docs/BLACK_HOLES_IMPLEMENTATION.md` | `docs/implementation/BLACK_HOLES_IMPLEMENTATION.md` | implementation |  |
| `docs/COMETS_IMPLEMENTATION.md` | `docs/implementation/COMETS_IMPLEMENTATION.md` | implementation |  |
| `docs/ELLIPTICAL_ORBITS.md` | `docs/implementation/ELLIPTICAL_ORBITS.md` | implementation |  |
| `docs/GENERATOR_IMPLEMENTATION.md` | `docs/implementation/GENERATOR_IMPLEMENTATION.md` | implementation |  |
| `docs/GROUP_ISOLATION_FEATURE.md` | `docs/implementation/GROUP_ISOLATION_FEATURE.md` | implementation |  |
| `docs/KUIPER_BELT_IMPLEMENTATION.md` | `docs/implementation/KUIPER_BELT_IMPLEMENTATION.md` | implementation |  |
| `docs/LAGRANGE_POINTS_IMPLEMENTATION.md` | `docs/implementation/LAGRANGE_POINTS_IMPLEMENTATION.md` | implementation |  |
| `docs/NEBULAE_IMPLEMENTATION.md` | `docs/implementation/NEBULAE_IMPLEMENTATION.md` | implementation |  |
| `docs/PROTOPLANETARY_DISK_IMPLEMENTATION.md` | `docs/implementation/PROTOPLANETARY_DISK_IMPLEMENTATION.md` | implementation |  |
| `docs/RING_SYSTEMS_IMPLEMENTATION.md` | `docs/implementation/RING_SYSTEMS_IMPLEMENTATION.md` | implementation |  |
| `docs/ROGUE_PLANETS.md` | `docs/implementation/ROGUE_PLANETS.md` | implementation |  |
| `docs/TIME_SCALE_FEATURE.md` | `docs/implementation/TIME_SCALE_FEATURE.md` | implementation |  |
| `docs/WINDOWED_UI_IMPLEMENTATION.md` | `docs/implementation/WINDOWED_UI_IMPLEMENTATION.md` | implementation |  |
| `docs/GENERATOR_QUICKREF.md` | `docs/guides/GENERATOR_QUICKREF.md` | guides |  |
| `docs/GENERATOR_UI_INTEGRATION.md` | `docs/guides/GENERATOR_UI_INTEGRATION.md` | guides |  |
| `docs/KEYBOARD_SHORTCUTS.md` | `docs/guides/KEYBOARD_SHORTCUTS.md` | guides |  |
| `docs/PRNG_README.md` | `docs/guides/PRNG_README.md` | guides |  |
| `docs/STATS_USAGE_GUIDE.md` | `docs/guides/STATS_USAGE_GUIDE.md` | guides |  |
| `docs/mcp-server-usage.md` | `docs/guides/mcp-server-usage.md` | guides | Moved from `docs/` root |
| `QUICKSTART.md` (repo root) | `docs/guides/QUICKSTART.md` | guides | Moved from repo root; Spanish content removed |
| `TROUBLESHOOTING.md` (repo root) | `docs/guides/TROUBLESHOOTING.md` | guides | Moved from repo root |
| `docs/BELT_PARTICLE_FIELD_REFACTORING.md` | `docs/summaries/BELT_PARTICLE_FIELD_REFACTORING.md` | summaries |  |
| `docs/BODY_EDITOR_REFACTOR_SUMMARY.md` | `docs/summaries/BODY_EDITOR_REFACTOR_SUMMARY.md` | summaries |  |
| `docs/COMETS_DOCUMENTATION_UPDATES.md` | `docs/summaries/COMETS_DOCUMENTATION_UPDATES.md` | summaries |  |
| `docs/GENERATOR_DELIVERY.md` | `docs/summaries/GENERATOR_DELIVERY.md` | summaries |  |
| `docs/PRNG_SUMMARY.md` | `docs/summaries/PRNG_SUMMARY.md` | summaries |  |
| `docs/STATS_REFACTOR_SUMMARY.md` | `docs/summaries/STATS_REFACTOR_SUMMARY.md` | summaries |  |
| `docs/UI_IMPLEMENTATION_SUMMARY.md` | `docs/summaries/UI_IMPLEMENTATION_SUMMARY.md` | summaries |  |
| `docs/PROMPT_AGENT_SYSTEM_SETUP.md` | `docs/ai_prompts/PROMPT_AGENT_SYSTEM_SETUP.md` | ai_prompts |  |
| `docs/PROMPT_MINIMAL_AGENT_RUNBOOK.md` | `docs/ai_prompts/PROMPT_MINIMAL_AGENT_RUNBOOK.md` | ai_prompts |  |
| `docs/PROMPT_UI_DOMAIN_SEPARATION_REFACTOR.md` | `docs/ai_prompts/PROMPT_UI_DOMAIN_SEPARATION_REFACTOR.md` | ai_prompts |  |

### `docs/design/`

- `docs/design/ALGORITHM_FLOW.md`
- `docs/design/BODY_EDITOR_STRUCTURE.md`
- `docs/design/BODY_POV_CAMERA.md`
- `docs/design/PROCEDURAL_GENERATOR.md`
- `docs/design/TOPOLOGY_GRAMMAR_PRESETS.md`
- `docs/design/UI_PREVIEW.md`
- `docs/design/UI_REDESIGN_WINDOWED.md`

### `docs/implementation/`

- `docs/implementation/ASTEROID_BELT_IMPLEMENTATION.md`
- `docs/implementation/BLACK_HOLES_IMPLEMENTATION.md`
- `docs/implementation/COMETS_IMPLEMENTATION.md`
- `docs/implementation/ELLIPTICAL_ORBITS.md`
- `docs/implementation/GENERATOR_IMPLEMENTATION.md`
- `docs/implementation/GROUP_ISOLATION_FEATURE.md`
- `docs/implementation/KUIPER_BELT_IMPLEMENTATION.md`
- `docs/implementation/LAGRANGE_POINTS_IMPLEMENTATION.md`
- `docs/implementation/NEBULAE_IMPLEMENTATION.md`
- `docs/implementation/PROTOPLANETARY_DISK_IMPLEMENTATION.md`
- `docs/implementation/RING_SYSTEMS_IMPLEMENTATION.md`
- `docs/implementation/ROGUE_PLANETS.md`
- `docs/implementation/TIME_SCALE_FEATURE.md`
- `docs/implementation/WINDOWED_UI_IMPLEMENTATION.md`

### `docs/guides/`

- `docs/guides/GENERATOR_QUICKREF.md`
- `docs/guides/GENERATOR_UI_INTEGRATION.md`
- `docs/guides/KEYBOARD_SHORTCUTS.md`
- `docs/guides/mcp-server-usage.md`
- `docs/guides/PRNG_README.md`
- `docs/guides/QUICKSTART.md`
- `docs/guides/STATS_USAGE_GUIDE.md`
- `docs/guides/TROUBLESHOOTING.md`

### `docs/summaries/`

- `docs/summaries/BELT_PARTICLE_FIELD_REFACTORING.md`
- `docs/summaries/BODY_EDITOR_REFACTOR_SUMMARY.md`
- `docs/summaries/COMETS_DOCUMENTATION_UPDATES.md`
- `docs/summaries/GENERATOR_DELIVERY.md`
- `docs/summaries/PRNG_SUMMARY.md`
- `docs/summaries/STATS_REFACTOR_SUMMARY.md`
- `docs/summaries/UI_IMPLEMENTATION_SUMMARY.md`

### `docs/ai_prompts/`

- `docs/ai_prompts/PROMPT_AGENT_SYSTEM_SETUP.md`
- `docs/ai_prompts/PROMPT_MINIMAL_AGENT_RUNBOOK.md`
- `docs/ai_prompts/PROMPT_UI_DOMAIN_SEPARATION_REFACTOR.md`

### Non-doc artifact currently in `docs/` root (recommendation only)

- `docs/solar-system-constructor.code-workspace` (consider moving to repo root later; not part of this change)

