---
name: prompt-writer
description: Generate one detailed, self-contained implementation prompt for a single task.
---

# Prompt Writer

## Purpose

Generate a detailed, self-contained implementation prompt for a single task. The prompt must give a coding agent everything it needs to execute the task without ambiguity.

## When to Use This Skill

- After you have an approved plan entry (one task) that needs a concrete execution prompt.
- When you want to ensure tasks are executable with clear allowlists, acceptance criteria, and verification.

## Inputs

- A plan file at `docs/plans/PLAN_<slug>.md` (specifically, one task entry from the task list).
- Repo context gathered via MCP tools.

## Outputs

- **Task prompt file**: `docs/prompts/<slug>/task_<n>/TASK_<n>_<slug>.md`

## Algorithm / Steps

1. Read the task entry from the plan file.
2. Use `repo_read` and `repo_list` to inspect the files the task will touch.
3. Use `repo_search` to find related patterns, imports, or conventions in the codebase.
4. Write the task prompt with all required sections:
   - **Task title**: clear, descriptive name.
   - **Objective**: one-paragraph summary of what the task achieves.
   - **Context to read first**: exact file paths and/or MCP tool calls the coding agent should run before starting.
   - **Constraints**: what not to do; boundaries of the task.
   - **Steps**: ordered implementation approach; no giant refactors.
   - **Files to create/update**: explicit list of file paths.
   - **Acceptance criteria**: bullet list of testable conditions.
   - **Verification**: non-interactive commands to run (e.g., `npm run build`).
   - **Notes**: edge cases, rollback plan, things to watch out for.
5. Save the prompt to `docs/prompts/<slug>/task_<n>/TASK_<n>_<slug>.md`.

## Task Sizing Rules

- Each prompt covers **exactly one task** — never bundle multiple tasks.
- Reference files and paths rather than embedding large code blocks.
- Keep the prompt **actionable** — a coding agent should be able to start immediately after reading it.
- The steps section should be **specific enough** to follow but **not so prescriptive** that it prevents reasonable implementation choices.

## Example Output Headings

### Task prompt (`TASK_<n>_<slug>.md`)

- Task title
- Objective
- Context to read first
- Constraints
- Steps
- Files to create/update
- Acceptance criteria
- Verification
- Notes
