# Agents Dot-Agents Consolidation — Archive Summary

**Date**: 2026-02-20
**Status**: Archived (legacy docs migration)

## What

Consolidated the repo's agent system from two parallel roots (`agents/` and `.agents/`) into a single canonical root at `.agents/`, adopting a folder-per-skill structure with standardized `SKILL.md` templates using YAML frontmatter.

## Key Decisions

- `.agents/` chosen as canonical root (already had more standardized skill examples)
- Skills use `<kebab-slug>/SKILL.md` with YAML frontmatter (`name`, `description` required)
- Roles live at `.agents/roles/*.md` with catalog and template
- Entry point / orchestrator contract: `.agents/agents.md`
- ADR recorded at `docs/decisions/ADR_0001_agents_dot_agents_consolidation.md`

## Tasks Completed

1. Captured ADR documenting the consolidation decision
2. Defined standardized SKILL template and `.agents/` indexes
3. Migrated orchestrator + roles into `.agents/` with updated internal references
4. Migrated skills into `.agents/skills/<skill>/SKILL.md` folder-per-skill structure
5. Updated all repo-wide references and Cursor rules to `.agents/*` paths
6. Removed legacy `agents/` folder and ran final audit

## Related Artifacts (removed)

- docs/requests/CR_agents_dot_agents_consolidation.md
- docs/plans/PLAN_agents_dot_agents_consolidation.md
- docs/prompts/agents_dot_agents_consolidation/ (6 tasks)
- docs/decisions/ADR_0001_agents_dot_agents_consolidation.md
