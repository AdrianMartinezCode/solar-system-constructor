# Task 5 — Update repo-wide references (docs + Cursor rules) to `.agents/*`

## Task title

Replace all `agents/...` path references with `.agents/...` (repo-wide)

## Objective

After roles and skills are migrated, update the rest of the repo so all references point to `.agents/*`, including:

- Cursor workspace rule(s) that currently prioritize `agents/*`
- AI runbooks under `docs/ai_prompts/`
- Historical CR/PLAN/TASK prompt docs under `docs/` that include `agents/*` references
- MCP tool notes that reference `agents/skills`

## Context to read first

- `.cursor/rules/agents-priority-context.mdc`
- `docs/ai_prompts/PROMPT_MINIMAL_AGENT_RUNBOOK.md`
- `docs/ai_prompts/PROMPT_AGENT_SYSTEM_SETUP.md`
- `mcp/server/src/tools/README.md`
- Grep results for `\bagents/` across the repo

## Constraints

- Mechanical path update only. Avoid rewriting document meaning beyond updating links/paths.
- Keep changes deterministic and auditable (prefer a small number of search/replace passes, then verify with grep).

## Steps

1. Update Cursor rule `.cursor/rules/agents-priority-context.mdc`:
   - Replace references to:
     - `agents/agents.md` → `.agents/agents.md`
     - `agents/README.md` → `.agents/README.md`
     - `agents/roles/README.md` → `.agents/roles/README.md`
     - `agents/skills/README.md` → `.agents/skills/README.md`
2. Update AI prompts:
   - `docs/ai_prompts/PROMPT_MINIMAL_AGENT_RUNBOOK.md`: entry point + “context to read first” paths
   - `docs/ai_prompts/PROMPT_AGENT_SYSTEM_SETUP.md`: replace any `/agents/` references with `/.agents/`
3. Update MCP docs:
   - `mcp/server/src/tools/README.md`: adjust “used by agents/skills” phrasing/paths to `.agents/skills`
4. Update historical workflow artifacts (mechanical):
   - `docs/requests/*.md`, `docs/plans/*.md`, `docs/prompts/**/TASK_*.md`
   - Replace `agents/` path references with `.agents/` equivalents
5. Run a final grep for `\bagents/` and fix any remaining matches.

## Files to create/update

- Update: `.cursor/rules/agents-priority-context.mdc`
- Update: `docs/ai_prompts/PROMPT_MINIMAL_AGENT_RUNBOOK.md`
- Update: `docs/ai_prompts/PROMPT_AGENT_SYSTEM_SETUP.md`
- Update: `mcp/server/src/tools/README.md`
- Update: any matching files under `docs/requests/`, `docs/plans/`, `docs/prompts/`

## Acceptance criteria

- Repo-wide grep for `\bagents/` returns zero matches (preferred).
- Cursor rule(s) now point to `.agents/*` as the highest-priority context files.

## Verification

```bash
npm run build
```

