# Agents — Index

This folder contains the repo’s **agent contract**, **agent roles**, and **skills** (playbooks).

## Quick Links

- **Orchestrator entry point (global contract + routing)**: `agents/agents.md`
- **Agent roles (personas)**: `agents/roles/`
- **Role catalog**: `agents/roles/README.md`
- **Skills (playbooks)**: `agents/skills/`

## Copy/paste prompt model (for minimal chat instructions)

- Minimal runbook (CR → PLAN → TASK prompts → optional implementation): `docs/ai_prompts/PROMPT_MINIMAL_AGENT_RUNBOOK.md`

## How to Add a New Agent Role

1. Copy `agents/roles/_template.md` → `agents/roles/<role_slug>.md`
2. Keep it focused: responsibilities, inputs/outputs, guardrails, and “when to use”.
3. If the role needs new procedures, add skills under `agents/skills/` and list them in `agents/skills/README.md`.

