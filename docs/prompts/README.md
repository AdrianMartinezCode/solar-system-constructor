# Task Prompts (Implementation Tasks)

This folder contains **per-task implementation prompts** produced by the planning workflow (CR → PLAN → TASK prompts).

## Structure (no mixing)

Store prompts in a two-level hierarchy:

```
docs/prompts/<slug>/task_<n>/TASK_<n>_<slug>.md
```

- `<slug>`: same slug as the change request and plan (`CR_<slug>.md`, `PLAN_<slug>.md`)
- `<n>`: 1-indexed task number

This prevents unrelated task prompts from being mixed together and leaves room to attach extra task context files later (`NOTES.md`, `CONTEXT.md`, etc.).

## Not to confuse with

- `docs/ai_prompts/`: reusable **copy/paste prompts** for other models/agents

