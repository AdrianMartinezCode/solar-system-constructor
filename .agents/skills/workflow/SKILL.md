# Skills Workflow — End-to-End Runbook

This document describes the complete workflow for using the agent skills and MCP tools together to go from a change request to implemented code.

---

## Overview

```
┌─────────────────┐     ┌──────────────┐     ┌───────────────┐     ┌─────────────┐
│  Write Change   │ ──▶ │  Triage &    │ ──▶ │  Decompose    │ ──▶ │  Implement  │
│  Request        │     │  Gather Ctx  │     │  into Tasks   │     │  Tasks      │
└─────────────────┘     └──────────────┘     └───────────────┘     └─────────────┘
  docs/requests/          MCP tools           docs/plans/            Code changes
  CR_<slug>.md                                docs/prompts/<slug>/   + verification
```

### Who does what (roles)

- **Orchestrator**: `.agents/agents.md` routes the request to the right role.
- **Product Owner**: generates CR/PLAN/TASK prompts (planning-only).
- **Task Developer / Task Curator of Order**: execute approved task prompts under `docs/prompts/<slug>/task_<n>/...`.
- **Developer / Curator of Order**: handle small, direct requests (when decomposition into tasks is not warranted).

### Entry paths (choose one)

This repo supports three practical entry paths:

- **A) Big work / planning-first (Product Owner)**: Create a CR → gather context → (optional) triage → decompose into tasks → write task prompts → human approval → task execution.
- **B) Small direct change (Developer / Curator of Order)**: Implement/curate directly when the scope is truly small (typically 1–2 focused changes). You may optionally write a CR for traceability, but it is not required.
- **C) Execute an existing task prompt (Task Developer / Task Curator of Order)**: If the input is already a `docs/prompts/<slug>/task_<n>/...` file, start from that prompt and execute exactly one task at a time.

---

## Step 0: Route (Orchestrator)

Before starting, use `.agents/agents.md` to route to the correct role and entry path (A/B/C). The sections below primarily describe **Path A (planning-first)**, plus a short guide for Paths B and C.

---

## Path A — Planning-first workflow (Product Owner)

## Step 1: Create a Change Request

1. Copy the template:
   ```
   docs/requests/CR_TEMPLATE.md → docs/requests/CR_<slug>.md
   ```
2. Fill in all sections: Summary, Context, Goals, Non-goals, Constraints, Out of scope, Acceptance criteria, Verification.
3. Use a descriptive slug (snake_case), e.g. `CR_add_orbit_editor.md`.

---

## Step 2: Gather Repo Context (MCP Tools)

Before decomposing the request, gather context about the current state of the repo.

### 2a. Get a repo snapshot

Run the `repo_context_snapshot` tool. This returns:
- Package manager (npm/pnpm/yarn)
- Available scripts from `package.json`
- Presence of config files (tsconfig, vite, eslint, prettier, vitest/jest, etc.)
- Top-level directory tree

### 2b. Explore relevant directories

Run `repo_list` on directories mentioned in or relevant to the change request:
- `repo_list` with `path: "src/components"` — to see existing components
- `repo_list` with `path: "src/domain"` — to see domain structure
- `repo_list` with `path: "src/utils"` — to see utility functions

### 2c. Read key files

Use `repo_read` to inspect files that the change will touch or depend on:
- `repo_read` with `paths: ["package.json", "tsconfig.json"]` — project config
- `repo_read` with `paths: ["src/types.ts"]` — shared types
- Any other files relevant to the change request

### 2d. Search for patterns

Use `repo_search` to find existing patterns, imports, or conventions:
- `repo_search` with `pattern: "import.*zustand"` — find state management usage
- `repo_search` with `pattern: "useEffect"` — find effect patterns
- Adjust queries based on the change request's domain

---

## Step 3: Triage the Request (Optional)

Use the **Change Request Triage** skill (`.agents/skills/change-request-triage/SKILL.md`):

1. Read the change request.
2. Classify by size, type, and risk.
3. Identify blockers or open questions.
4. Output a triage note to `docs/decisions/TRIAGE_<slug>.md` if needed.

Skip this step for straightforward, well-defined requests.

---

## Step 4: Decompose into Tasks (PO Task Decomposer)

Use the **PO Task Decomposer** skill (`.agents/skills/po-task-decomposer/SKILL.md`):

1. Read the change request and the gathered repo context.
2. Identify the minimal set of changes needed.
3. Split into ordered tasks (each ≤ 5 files, one concern per task).
4. Output:
   - **Plan file**: `docs/plans/PLAN_<slug>.md`
   - **Task prompts**: `docs/prompts/<slug>/task_<n>/TASK_<n>_<slug>.md`

### Plan file structure

The plan file (`PLAN_<slug>.md`) must contain:
- Summary (5–10 lines)
- Repo snapshot used (which tools/files were inspected)
- Assumptions
- Risks / unknowns
- Out of scope
- Task list (ordered), where each task has:
  - Goal
  - Scope / non-goals
  - Dependencies
  - Files likely touched
  - Acceptance criteria
  - Verification commands

---

## Step 5: Generate Task Prompts (Prompt Writer)

Use the **Prompt Writer** skill (`.agents/skills/prompt-writer/SKILL.md`):

For each task in the plan:
1. Read the task entry from the plan file.
2. Use MCP tools to inspect the specific files the task will touch.
3. Write a self-contained prompt to `docs/prompts/<slug>/task_<n>/TASK_<n>_<slug>.md`.

### Task prompt structure

Each prompt (`TASK_<n>_<slug>.md`) must contain:
- Task title
- Objective
- Context to read first (exact file paths / MCP tool calls)
- Constraints
- Steps (implementation approach)
- Files to create/update (explicit list)
- Acceptance criteria (testable bullets)
- Verification (non-interactive commands)
- Notes (edge cases, rollback plan)

---

## Step 6: Human Review

**Before any implementation begins**, a human reviews:
- The plan file — are the tasks correctly scoped?
- The task prompts — are the acceptance criteria clear?
- Any triage notes — are blockers addressed?

Only proceed to implementation after approval.

---

## Step 7: Implement Tasks (In Order)

Use the task execution playbook:

- `.agents/skills/dev-task-executor/SKILL.md`

For each task prompt, in order:

1. Read the task prompt file.
2. Follow the "Context to read first" section — run the specified MCP tool calls.
3. Implement the changes described in "Steps".
4. Verify using the commands in "Verification" (e.g. `npm run build`).
5. Confirm all acceptance criteria are met.
6. Move to the next task.

### Rules during implementation

- Only modify files listed in the task prompt.
- Keep diffs small and focused.
- Do not mix refactoring with feature work.
- If a task reveals unexpected complexity, stop and update the plan.

---

## Path B — Small direct change (Developer / Curator of Order)

Use this path only when decomposition is not warranted (typically 1–2 focused changes).

1. Route to **Developer** (small implementation) or **Curator of Order** (small curation).
2. Read only the minimal relevant context.
3. Implement the change as a small, reviewable diff.
4. Verify (`npm run build` at minimum; add `npm run typecheck` when available).
5. If scope expands, stop and switch to **Path A** (Product Owner) to decompose into tasks.

---

## Path C — Execute an existing task prompt (Task Developer / Task Curator of Order)

1. Route to **Task Developer** or **Task Curator of Order** based on the prompt’s scope.
2. Read the task prompt: `docs/prompts/<slug>/task_<n>/TASK_<n>_<slug>.md`.
3. Follow its “Context to read first”, constraints, and file allowlist.
4. Implement exactly that one task and verify using the prompt’s commands.
5. Move to the next task prompt only after acceptance criteria are met.

---

## Quick Reference: MCP Tools

| Tool | Purpose | Key Parameters |
|------|---------|----------------|
| `repo_context_snapshot` | Repo overview (PM, scripts, configs, tree) | _(none)_ |
| `repo_list` | List directory entries | `path` (optional, defaults to root) |
| `repo_read` | Read file contents | `paths` (array, max 10) |
| `repo_search` | Search file contents | `pattern`, `path` (optional), `glob` (optional) |

---

## Example: End-to-End

```
1. Author writes:        docs/requests/CR_add_orbit_editor.md
2. Agent runs:           repo_context_snapshot
3. Agent runs:           repo_list { path: "src/components" }
4. Agent runs:           repo_read { paths: ["src/types.ts", "src/state/systemStore.ts"] }
5. Agent runs:           repo_search { pattern: "OrbitRing", glob: "*.tsx" }
6. Agent triages:        (optional) docs/decisions/TRIAGE_add_orbit_editor.md
7. PO Decomposer outputs:
   - docs/plans/PLAN_add_orbit_editor.md
   - docs/prompts/add_orbit_editor/task_1/TASK_1_add_orbit_editor.md
   - docs/prompts/add_orbit_editor/task_2/TASK_2_add_orbit_editor.md
   - docs/prompts/add_orbit_editor/task_3/TASK_3_add_orbit_editor.md
8. Human reviews plan + prompts
9. Coding agent implements Task 1, verifies with `npm run build`
10. Coding agent implements Task 2, verifies
11. Coding agent implements Task 3, verifies
12. Done!
```
