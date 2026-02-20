# Skill: Dev Task Executor (TASK → diff → verify)

## Purpose

Execute a single approved task prompt (`docs/prompts/<slug>/task_<n>/TASK_<n>_<slug>.md`) as a small, reviewable change set with verification.

## Inputs

- A task prompt file: `docs/prompts/<slug>/task_<n>/TASK_<n>_<slug>.md`
- Repo context as needed (read/list/search of the exact files referenced by the prompt)

## Outputs

- A focused code diff touching **only** the files listed in the task prompt
- Verification results (command outputs / pass-fail) captured in the PR/review context (or noted in chat)

## Algorithm / Steps

1. **Read the task prompt fully**.
2. **Extract constraints**:
   - Files allowed to change (explicit allowlist)
   - Acceptance criteria (testable bullets)
   - Verification commands (non-interactive)
   - Non-goals / do-nots
3. **Gather context** by reading only what’s necessary:
   - Files referenced in “Context to read first”
   - Any directly adjacent files required to implement safely (imports/types), but keep scope tight
4. **Plan the smallest diff** that satisfies acceptance criteria.
5. **Implement**:
   - Make incremental edits
   - Keep changes local; avoid unrelated refactors
6. **Self-review**:
   - Re-check the file allowlist: no extra files edited
   - Ensure acceptance criteria are explicitly met
7. **Verify** using the prompt’s commands (at minimum: `npm run build`).
8. **Stop conditions**:
   - If requirements are ambiguous or conflict with existing behavior, stop and ask specific questions.
   - If the task balloons beyond scope, propose splitting into a new task prompt (do not “just do it”).

## Task Sizing Rules

- Exactly **one task prompt** at a time.
- Touch **≤ 5 files** unless the prompt explicitly justifies more.
- No “cleanup” outside task scope.

## Example Output Headings

### Execution summary

- Files changed
- Acceptance criteria coverage
- Verification results
- Open questions / follow-ups (if any)

