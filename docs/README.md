# Docs — Map

## Current Structure

| Folder | Purpose |
|--------|---------|
| `docs/decisions/` | ADRs + triage notes |
| `docs/design/` | Architecture, structure, conceptual models |
| `docs/implementation/` | Feature implementation writeups (behavior, files, verification) |
| `docs/guides/` | How-to / quick reference / operator guides |
| `docs/summaries/` | Delivery notes / refactor summaries |
| `docs/ai_prompts/` | Copy/paste prompts for external AI tools |

## Workflow Artifacts (SDD Pipeline)

Change requests, plans, and task prompts have migrated to the SDD pipeline:

- Active changes: `openspec/changes/<change-name>/`
- Archived changes: `openspec/changes/archive/YYYY-MM-DD-<change-name>/`

See `openspec/config.yaml` for pipeline configuration.

## Entry Points (Highest-Signal)

- Quick start: `docs/guides/QUICKSTART.md`
- Troubleshooting: `docs/guides/TROUBLESHOOTING.md`
- MCP integration: `docs/guides/mcp-server-usage.md`
- UI / windowing: `docs/implementation/WINDOWED_UI_IMPLEMENTATION.md`, `docs/design/UI_REDESIGN_WINDOWED.md`
- Generator: `docs/design/PROCEDURAL_GENERATOR.md`, `docs/guides/GENERATOR_QUICKREF.md`
- Orbits: `docs/implementation/ELLIPTICAL_ORBITS.md`

## Copy/paste prompts (for external AI tools)

- Minimal runbook: `docs/ai_prompts/PROMPT_MINIMAL_AGENT_RUNBOOK.md`
- Agent system setup: `docs/ai_prompts/PROMPT_AGENT_SYSTEM_SETUP.md`
- Large refactor example: `docs/ai_prompts/PROMPT_UI_DOMAIN_SEPARATION_REFACTOR.md`
