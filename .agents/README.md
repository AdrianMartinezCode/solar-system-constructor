# Agents — Index (`.agents/`)

This folder contains the repo's **delegate-only orchestrator**, **sub-agent roles**, and **skills** (playbooks) for the Spec-Driven Development (SDD) pipeline.

## Quick Links

- **Orchestrator (delegate-only coordinator)**: `.agents/agents.md`
- **Sub-agent roles**: `.agents/roles/`
- **Role catalog**: `.agents/roles/README.md`
- **Skills (playbooks)**: `.agents/skills/`
- **Skill catalog**: `.agents/skills/README.md`
- **SDD artifact store**: `openspec/`
- **Project config**: `openspec/config.yaml`

## Architecture

The orchestrator in `agents.md` routes requests and delegates to specialized sub-agents via the Task tool. Each sub-agent gets fresh context, reads its role file and skills, executes one phase, and returns a structured result envelope.

```
Orchestrator (agents.md)
  ├── /flow:init    → Founder
  ├── /flow:explore → Scout
  ├── /flow:new     → Scout → Advocate
  ├── /flow:continue→ Next in DAG
  ├── /flow:ff      → Advocate → Scribe ∥ Architect → Strategist
  ├── /flow:apply   → Builder
  ├── /flow:verify  → Sentinel
  ├── /flow:archive → Archivist
  └── (trivial)     → Builder or Curator (direct mode)
```

## How to Add a New Sub-Agent Role

1. Copy `.agents/roles/_template.md` → `.agents/roles/<role_slug>.md`
2. Keep it focused: purpose, responsibilities, inputs/outputs, guardrails, core skills, and result contract.
3. If the role needs new procedures, add skills under `.agents/skills/` and list them in `.agents/skills/README.md`.
4. Register the role in `.agents/agents.md` (Roles table + catalog).
