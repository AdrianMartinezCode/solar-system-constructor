# Prompt: Minimal Agent Run (CR → PLAN → TASK prompts → optional implementation)

Use this document as a **copy/paste prompt** for an AI coding agent in this repo.

## Intended model + role

- **Model**: a coding agent that can read/write repo files and run non-interactive verification commands
- **Entry point (recommended)**: `agents/agents.md` (Orchestrator; routes to a role)
- **Pinned role (optional)**: `<role_file>` (example: `agents/roles/curator_of_order.md`)

## Context to read first

Read these files first, in this order:

1. `agents/agents.md`
2. `agents/skills/WORKFLOW.md`
3. (Optional, pinned-role mode) `<role_file>`
4. (If planning via Product Owner) `<cr_file>`

## Objective

Given an input, follow the repo workflow (CR → PLAN → TASK prompts → optional implementation) and **only implement after explicit human approval**.

Notes:

- In **orchestrator-first** mode, start from `agents/agents.md` and let the orchestrator route to the correct role file under `agents/roles/`.
- In **pinned-role** mode, set `<role_file>` explicitly (e.g. when you already know you want Product Owner vs Curator vs Developer).

## Constraints / do-nots

- Follow the global contract: `agents/agents.md`
- Follow the workflow runbook: `agents/skills/WORKFLOW.md`
- Use skills as playbooks (do not “wing it”):
  - `agents/skills/change_request_triage.md` (optional)
  - `agents/skills/po_task_decomposer.md`
  - `agents/skills/prompt_writer.md`
- Keep diffs small and focused; one concern per task.
- Verification commands must be non-interactive.
- If required context files are missing/ambiguous, stop and ask for clarification rather than guessing.

## Deliverables

- (Optional) Triage note: `docs/decisions/TRIAGE_<slug>.md`
- Plan: `docs/plans/PLAN_<slug>.md`
- Task prompts:
  - `docs/prompts/<slug>/task_1/TASK_1_<slug>.md`
  - `docs/prompts/<slug>/task_2/TASK_2_<slug>.md`
  - ...

## Suggested approach

### Inputs (fill these in)

- **Change request**: `<cr_file>` (example: `docs/requests/CR_add_orbit_editor.md`)
- **Mode**: `planning_only` | `implement_after_approval`

### Step 1 — (Optional) Triage

If the change request is ambiguous, risky, or cross-cutting:

- Produce `docs/decisions/TRIAGE_<slug>.md` following `agents/skills/change_request_triage.md`

Otherwise, skip triage.

### Step 2 — Decompose into tasks (required)

Produce:

- `docs/plans/PLAN_<slug>.md`
- `docs/prompts/<slug>/task_1/TASK_1_<slug>.md`, `task_2/TASK_2_<slug>.md`, ...

Follow `agents/skills/po_task_decomposer.md` and `agents/skills/prompt_writer.md` strictly:

- Each task must be ordered, small (guideline: ≤ 5 files), and have testable acceptance criteria.
- Each task prompt must be self-contained and list exact files to touch and verification commands.

### Step 3 — Human review gate

If **Mode = `planning_only`**:

- Stop after generating the plan + task prompts.

If **Mode = `implement_after_approval`**:

- Do **not** implement yet. Ask the human to approve the plan + prompts first.

### Step 4 — Implement (only after explicit approval)

For each task prompt, in order:

1. Read the task prompt.
2. Only modify files listed in that prompt.
3. Verify using the prompt’s verification commands (at minimum: `npm run build`).
4. Confirm acceptance criteria are met before moving to the next task.

## Files to touch

- Planning-only:
  - `docs/plans/*`
  - `docs/prompts/<slug>/*`
  - optional `docs/decisions/TRIAGE_<slug>.md`
- Implementation (after approval): only the explicit files listed in each task prompt.

## Verification commands

```bash
npm run typecheck
npm run build
```

## Notes / pitfalls

- Prefer writing actual repo artifacts (`docs/plans/*`, `docs/prompts/*`) over pasting long content in chat.
- If you must include a snippet in chat, keep it short and reference file paths.

