# Docs — Map & Workflow

## Workflow (Planning-First)

```
docs/requests/CR_<slug>.md      (input)
  → docs/decisions/TRIAGE_<slug>.md   (optional)
  → docs/plans/PLAN_<slug>.md         (output)
  → docs/prompts/<slug>/task_<n>/TASK_<n>_<slug>.md   (output)
  → implementation + verification
  → docs/decisions/ADR_<nnnn>_<slug>.md (when decisions are made)
```

## Docs taxonomy (technical docs)

- See `docs/TAXONOMY.md` for the type-based categories for technical docs (and the key distinction between `docs/prompts/` vs `docs/ai_prompts/`).

## Folders

| Folder | Purpose |
|--------|---------|
| `docs/requests/` | Change requests (inputs) |
| `docs/plans/` | Plans (ordered task lists; output of PO decomposition) |
| `docs/prompts/` | Per-task implementation prompts (output of prompt writer) |
| `docs/decisions/` | ADRs + triage notes + audit notes |
| `docs/design/` | Design/architecture/concept docs |
| `docs/implementation/` | Feature implementation writeups (behavior, files, verification) |
| `docs/guides/` | How-to / quick reference / operator guides |
| `docs/summaries/` | Delivery notes / refactor summaries |
| `docs/ai_prompts/` | Copy/paste prompts intended for external AI tools |
| `docs/` (root) | Indexes (e.g. `docs/README.md`, `docs/TAXONOMY.md`) |

## Entry Points (Highest-Signal)

- UI / windowing: `docs/implementation/WINDOWED_UI_IMPLEMENTATION.md`, `docs/design/UI_REDESIGN_WINDOWED.md`
- Generator: `docs/design/PROCEDURAL_GENERATOR.md`, `docs/guides/GENERATOR_QUICKREF.md`, `docs/implementation/GENERATOR_IMPLEMENTATION.md`
- Orbits: `docs/implementation/ELLIPTICAL_ORBITS.md`

## Conventions

- **Slugs**: snake_case (e.g. `curator_of_order_agent`)
- **Change requests**: `CR_<slug>.md`
- **Plans**: `PLAN_<slug>.md`
- **Task prompts**: `docs/prompts/<slug>/task_<n>/TASK_<n>_<slug>.md`
- **ADRs**: `ADR_<nnnn>_<slug>.md` (4-digit, zero-padded)

## Copy/paste prompt models (for using other AI agents)

- Minimal runbook (CR → PLAN → TASK prompts → optional implementation): `docs/ai_prompts/PROMPT_MINIMAL_AGENT_RUNBOOK.md`
- Foundational agent system setup: `docs/ai_prompts/PROMPT_AGENT_SYSTEM_SETUP.md`
- Large refactor example prompt: `docs/ai_prompts/PROMPT_UI_DOMAIN_SEPARATION_REFACTOR.md`
