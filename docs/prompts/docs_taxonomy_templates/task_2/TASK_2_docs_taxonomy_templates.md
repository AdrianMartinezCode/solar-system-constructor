# Task title

Create docs category subfolders + add per-category templates

## Objective

Add the new technical-doc categories under `docs/` as subfolders, and place a concise `TEMPLATE.md` into each category so future docs are consistent and easy to write.

## Context to read first

- `docs/TAXONOMY.md`
- `docs/README.md`
- Representative docs for style expectations:
  - `docs/ASTEROID_BELT_IMPLEMENTATION.md`
  - `docs/GENERATOR_QUICKREF.md`
  - `docs/BELT_PARTICLE_FIELD_REFACTORING.md`
  - `docs/PROMPT_MINIMAL_AGENT_RUNBOOK.md`

## Constraints

- Do not move or rename existing docs in this task.
- Keep templates short and scannable (prefer checklists and bullet prompts).
- Templates must reference `docs/TAXONOMY.md` as the source of truth for routing rules.

## Steps

1. Create these category subfolders under `docs/`:
   - `docs/design/`
   - `docs/implementation/`
   - `docs/guides/`
   - `docs/summaries/`
   - `docs/ai_prompts/`
2. Add one template to each folder (`TEMPLATE.md`) with an opinionated but lightweight structure:
   - A short header explaining when to use the category
   - A consistent set of sections (tailored per category)
   - A “Related” section that points back to `docs/TAXONOMY.md` and `docs/README.md`
3. Use these template skeletons (adapt wording as needed, but keep section intent):

   - `docs/design/TEMPLATE.md`:
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

   - `docs/implementation/TEMPLATE.md`:
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

   - `docs/guides/TEMPLATE.md`:
     - Title
     - Audience
     - Prerequisites
     - Quick start
     - How-to (common tasks)
     - Troubleshooting / FAQ
     - Reference (links to design/implementation docs)

   - `docs/summaries/TEMPLATE.md`:
     - Title
     - Summary (what changed)
     - Motivation (why)
     - Scope (what’s in / out)
     - Notable changes (bullets)
     - Files touched
     - Risk / rollback notes
     - Verification
     - Follow-ups

   - `docs/ai_prompts/TEMPLATE.md`:
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

## Files to create/update

- Create: `docs/design/TEMPLATE.md`
- Create: `docs/implementation/TEMPLATE.md`
- Create: `docs/guides/TEMPLATE.md`
- Create: `docs/summaries/TEMPLATE.md`
- Create: `docs/ai_prompts/TEMPLATE.md`

## Acceptance criteria

- [ ] All 5 category subfolders exist under `docs/`.
- [ ] Each category subfolder contains a `TEMPLATE.md`.
- [ ] Templates are tailored (design vs implementation vs guide vs summary vs ai_prompt).
- [ ] No existing docs are moved/renamed.

## Verification

```bash
npm run typecheck
npm run build
```

## Notes

- Follow-up (separate task/CR) can perform the mechanical migration (`git mv`) and link updates using the mapping in `docs/TAXONOMY.md`.

