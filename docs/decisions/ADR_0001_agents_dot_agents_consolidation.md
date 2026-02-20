# ADR: Consolidate agent system into `.agents/` (remove `agents/`)

- **Status**: accepted
- **Date**: 2026-02-20
- **Decision owners**: Curator of Order
- **Related**:
  - `docs/requests/CR_agents_dot_agents_consolidation.md`
  - `docs/plans/PLAN_agents_dot_agents_consolidation.md`
  - `docs/prompts/agents_dot_agents_consolidation/`

## Context

The repo currently contains two parallel agent roots:

- `agents/` — orchestrator/contract, roles, and skills (flat `*.md`)
- `.agents/` — a separate skills area using folder-per-skill structure and YAML frontmatter

This duplication creates ambiguity about the canonical entry point and increases the risk of broken references and drift between “agent contract” documents.

## Decision

Adopt **`.agents/` as the single canonical agent system root**.

Canonical paths:

- **Entry point (orchestrator / global contract)**: `.agents/agents.md`
- **Agent system index**: `.agents/README.md`
- **Roles**: `.agents/roles/*.md`
  - Catalog: `.agents/roles/README.md`
  - Template: `.agents/roles/_template.md`
- **Skills**: `.agents/skills/<kebab-skill-slug>/SKILL.md`
  - Catalog: `.agents/skills/README.md`
  - Template: `.agents/skills/_template/SKILL.md`

Skill conventions:

- Skill folders use **kebab-case** slugs.
- Each skill is represented by exactly one file: `SKILL.md`.
- `SKILL.md` uses **YAML frontmatter** (required: `name`, `description`; optional: `license`, `metadata`) followed by standardized headings.

Legacy compatibility:

- The legacy `agents/` folder is **deprecated** and will be removed after:
  - migrating content to `.agents/`, and
  - updating all repo references from `agents/...` to `.agents/...`.

## Consequences

- There is a single, unambiguous entry point for agent routing and roles.
- All links and references in docs, prompts, and Cursor rules must be updated to `.agents/*`.
- Existing workflows remain the same, but their file paths change.

## Alternatives Considered

- **Keep both roots** (`agents/` + `.agents/`) and “document which to use” — rejected because it still permits drift and broken links.
- **Keep `agents/` as canonical and delete `.agents/`** — rejected because `.agents` already contains more standardized skill examples (folder-per-skill + frontmatter).

## Follow-ups

- Execute migration tasks in `docs/prompts/agents_dot_agents_consolidation/`:
  - create `.agents` indexes/templates
  - migrate orchestrator/roles and skills
  - update repo-wide references + Cursor rules
  - delete legacy `agents/`

