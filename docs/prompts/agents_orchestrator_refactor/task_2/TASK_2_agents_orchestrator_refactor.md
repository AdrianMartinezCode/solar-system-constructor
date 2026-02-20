# Task 2 — Add Product Owner + task-execution role variants; refactor Developer scope

## Objective

Add a new **Product Owner** role and two new **task-execution** role variants, and refactor the existing **Developer** role to represent “small direct implementation” requests.

The key behavioral split:

- **Product Owner**: generates CR/PLAN/TASK prompts; does not implement or verify.
- **Developer**: handles small direct implementation changes (no PO decomposition needed).
- **Task Developer**: executes PO-generated task prompts (`docs/prompts/...`).
- **Curator of Order**: small direct curation/organization (existing).
- **Task Curator of Order**: executes PO-generated curation task prompts (`docs/prompts/...`).

## Context to read first

- `agents/agents.md` (ensure role names match orchestrator routing from Task 1)
- `agents/roles/developer.md`
- `agents/roles/curator_of_order.md`
- `agents/roles/README.md`
- `agents/roles/_template.md`
- `agents/skills/WORKFLOW.md`
- `agents/skills/dev_task_executor.md`
- `agents/skills/po_task_decomposer.md`
- `agents/skills/prompt_writer.md`

## Constraints

- Touch only the files listed in **Files to create/update**.
- Keep diffs focused on role boundaries; do not rewrite skills.
- Keep the existing Curator role behavior “as we have now” unless a small clarification is required.
- Do not change app code under `src/`.

## Steps

1. Create `agents/roles/product_owner.md`:
   - Purpose: generate prompts/specs/requests using the existing CR → PLAN → TASK workflow.
   - Responsibilities: triage (optional), decompose, write prompts.
   - Non-goals: implementing tasks, verifying builds, editing `src/`.
   - Outputs: `docs/requests/*`, `docs/plans/*`, `docs/prompts/<slug>/*` (and optional triage notes).
2. Create `agents/roles/task_developer.md`:
   - Purpose: execute an approved `docs/prompts/<slug>/task_<n>/TASK_<n>_<slug>.md`.
   - Align guardrails with `agents/skills/dev_task_executor.md` (file allowlist, one task per diff, verify).
3. Create `agents/roles/task_curator_of_order.md`:
   - Purpose: execute an approved curator-oriented task prompt under `docs/prompts/...`.
   - Guardrails: no product feature work; focus on structure/indexes/taxonomy; verify.
4. Update `agents/roles/developer.md`:
   - Re-scope to “small direct implementation requests.”
   - Add explicit routing guidance:
     - If request is big → Product Owner.
     - If request is a task prompt execution → Task Developer.
5. Update `agents/roles/README.md`:
   - Add the new roles and 1-line distinctions.

## Files to create/update

- Add: `agents/roles/product_owner.md`
- Add: `agents/roles/task_developer.md`
- Add: `agents/roles/task_curator_of_order.md`
- Update: `agents/roles/developer.md`
- Update: `agents/roles/README.md`

## Acceptance criteria

- `agents/roles/product_owner.md` exists and explicitly states:
  - It generates CR/PLAN/TASK prompts following the existing workflow.
  - It does **not** implement tasks and does **not** run verification commands.
- `agents/roles/task_developer.md` exists and is explicitly constrained to executing `docs/prompts/...` tasks with verification.
- `agents/roles/task_curator_of_order.md` exists and is explicitly constrained to executing curator tasks from `docs/prompts/...`.
- `agents/roles/developer.md` is updated to reflect “small direct implementation”, and points to:
  - Product Owner for big tasks
  - Task Developer for task prompt execution
- `agents/roles/README.md` lists all roles: Curator of Order, Developer, Product Owner, Task Developer, Task Curator of Order.

## Verification

```bash
npm run typecheck
npm run build
```

## Notes

- Keep the distinction between Developer vs Task Developer extremely explicit—this refactor is primarily about **reducing ambiguity**.

