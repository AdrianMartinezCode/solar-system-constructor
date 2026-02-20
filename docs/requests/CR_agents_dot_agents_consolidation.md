# Change Request: Consolidate agent system into `.agents/` (remove `agents/`)

## Summary

Standardize the repo’s agent system so **`.agents/` is the only canonical location** for the agent contract/orchestrator, roles, and skills. This removes duplication/confusion between `agents/` and `.agents/`, and introduces a single **folder-per-skill** structure with a consistent `SKILL.md` template.

## Context

The repo currently contains **two parallel agent roots**:

- `agents/` (contract entry point, roles, flat skills as `*.md`, workflow/runbooks, templates)
- `.agents/` (already contains skills in the structure `.agents/skills/<skill-slug>/SKILL.md` with YAML frontmatter)

This split makes it unclear which source-of-truth to follow and causes broken/duplicated references over time. The goal is to consolidate into `.agents/` only, and update all path references throughout the repo accordingly.

## Goals

- Unify the agent system under **`.agents/`**:
  - `.agents/agents.md` becomes the orchestrator/global contract entry point
  - `.agents/roles/*` contains roles (+ catalog and template)
  - `.agents/skills/<skill-slug>/SKILL.md` contains skills using a **standard SKILL template**
- Replace the current flat `agents/skills/*.md` layout with **folder-per-skill** structure under `.agents/skills/`.
- Ensure **all repo references** to `agents/...` are updated to `.agents/...` after the move.
- Remove the `agents/` folder entirely.

## Non-goals

- Changing any app/runtime behavior under `src/`.
- Changing MCP tool behavior or implementing new tools.
- Rewriting the substantive content of skills beyond what’s needed to fit the standardized template (keep edits mechanical and minimal).

## Constraints

- Prefer mechanical moves (`git mv`-style) and deterministic search/replace for paths.
- Keep diffs reviewable: one concern per task prompt.
- Update Cursor/workspace rules that currently prioritize `agents/*` paths.

## Out of Scope

- Large-scale content rewrite of historical docs. (However, references/links must be fixed if they point to moved files.)

## Acceptance Criteria

- [ ] There is exactly one agent root: `.agents/` (no `agents/` directory remains).
- [ ] Skills live at `.agents/skills/<kebab-skill-slug>/SKILL.md` with a consistent template derived from existing `.agents` examples (YAML frontmatter + standardized headings).
- [ ] Roles live at `.agents/roles/*.md` with an index and template.
- [ ] Repo-wide references are updated:
  - `\bagents/` no longer appears in the repo (excluding unavoidable plain-English mentions, if any; prefer zero matches).
- [ ] Cursor rule `.cursor/rules/agents-priority-context.mdc` points to `.agents/*` as the highest-priority context.

## Verification

```bash
npm run typecheck
npm run build
```

