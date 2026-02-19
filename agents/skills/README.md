# Agent Skills

Skills are structured playbooks that guide an AI agent through a specific workflow. Each skill defines its purpose, inputs, outputs, algorithm, and sizing rules.

## Available Skills

| Skill | File | Purpose |
|-------|------|---------|
| PO Task Decomposer | `po_task_decomposer.md` | Break a change request into ordered, small tasks with acceptance criteria |
| Change Request Triage | `change_request_triage.md` | Evaluate and classify incoming change requests |
| Prompt Writer | `prompt_writer.md` | Generate per-task implementation prompts for coding agents |

## Skill Template

Every skill follows a consistent template with these sections:

1. **Purpose** — What the skill does.
2. **Inputs** — What the skill needs to run.
3. **Outputs** — File paths and artifacts produced (under `/docs/`).
4. **Algorithm / Steps** — Ordered procedure.
5. **Task Sizing Rules** — Constraints on output granularity.
6. **Example Output Headings** — What the generated artifacts look like (headings only, no code).
