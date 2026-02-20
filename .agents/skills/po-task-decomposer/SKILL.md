---
name: po-task-decomposer
description: Decompose a change request into an ordered plan and small executable tasks with acceptance criteria.
---

# PO Task Decomposer

## Purpose

Break a change request document into an ordered list of small, implementable tasks. Each task has clear acceptance criteria and verification commands so a coding agent can execute it independently.

## When to Use This Skill

- When a change request is medium/large (3+ tasks) or otherwise needs decomposition.
- When you need to produce `docs/plans/PLAN_<slug>.md` + per-task prompts under `docs/prompts/<slug>/...`.

## Inputs

- A change request file at `docs/requests/CR_<slug>.md`.
- Repo context gathered via MCP tools (context snapshot, file reads, directory listings).

## Outputs

- **Plan file**: `docs/plans/PLAN_<slug>.md`
- **Task prompt files**: `docs/prompts/<slug>/task_<n>/TASK_<n>_<slug>.md` (one per task)

## Algorithm / Steps

1. Read the change request document.
2. Run the `repo_context_snapshot` MCP tool to understand the current repo state.
3. Use `repo_list` and `repo_read` to inspect files relevant to the request.
4. Identify the minimal set of changes needed.
5. Split changes into ordered tasks, respecting dependencies.
6. For each task, define:
   - Goal and scope
   - Files likely touched
   - Acceptance criteria (testable bullets)
   - Verification commands
7. Write the plan file to `docs/plans/PLAN_<slug>.md`.
8. Write one task prompt per task to `docs/prompts/<slug>/task_<n>/TASK_<n>_<slug>.md`.

## Task Sizing Rules

- Each task should touch **≤ 5 files** unless explicitly justified.
- Each task should be completable in a **single focused session** (one PR-sized diff).
- Prefer many small tasks over few large ones.
- Tasks must be **ordered** — later tasks may depend on earlier ones, but not vice versa.
- Do **not** mix refactoring with feature work in the same task.

## Example Output Headings

### Plan file (`PLAN_<slug>.md`)

- Summary
- Repo snapshot used
- Assumptions
- Risks / unknowns
- Out of scope
- Task list (ordered)
  - Task 1: Goal, Scope, Dependencies, Files, Acceptance criteria, Verification
  - Task 2: …

### Task prompt file (`TASK_<n>_<slug>.md`)

- Task title
- Objective
- Context to read first
- Constraints
- Steps
- Files to create/update
- Acceptance criteria
- Verification
- Notes
