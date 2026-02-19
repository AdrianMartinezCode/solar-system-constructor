# Change Requests

This folder contains change request documents that describe desired modifications to the codebase.

## Workflow

```
1. Write a change request     →  docs/requests/CR_<slug>.md
2. Triage the request          →  (optional) docs/decisions/TRIAGE_<slug>.md
3. Run PO Task Decomposer     →  docs/plans/PLAN_<slug>.md
4. Generate task prompts       →  docs/prompts/TASK_<n>_<slug>.md
5. Implement tasks (in order)  →  code changes, one task at a time
6. Verify after each task      →  run verification commands
```

## How to Write a Change Request

1. Copy `CR_TEMPLATE.md` to a new file: `CR_<slug>.md` (e.g., `CR_add_dark_mode.md`).
2. Fill in all sections. Be specific about goals and acceptance criteria.
3. Place the file in this folder (`docs/requests/`).
4. The PO Task Decomposer skill will read it and produce a plan + task prompts.

## Naming Convention

- **Change requests**: `CR_<slug>.md` — use snake_case slugs.
- **Plans**: `PLAN_<slug>.md` — slug matches the change request.
- **Task prompts**: `TASK_<n>_<slug>.md` — `n` is the task number (1-indexed).
- **Triage notes**: `TRIAGE_<slug>.md` — slug matches the change request.

## Folder Map

| Folder | Contents |
|--------|----------|
| `docs/requests/` | Change request documents (input) |
| `docs/plans/` | Decomposed plans with ordered task lists (output of PO decomposer) |
| `docs/prompts/` | Per-task implementation prompts (output of prompt writer) |
| `docs/decisions/` | Architecture Decision Records (ADRs) and triage notes |
