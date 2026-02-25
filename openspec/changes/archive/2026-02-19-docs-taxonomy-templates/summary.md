# Docs Taxonomy Templates — Archive Summary

**Date**: 2026-02-19
**Status**: Archived (legacy docs migration)

## What

Created a type-based taxonomy for `docs/` root technical documentation by defining 5 category subfolders with templates, plus a taxonomy reference doc with routing rules and a proposed file mapping — without moving any existing docs.

## Key Decisions

- 5 categories chosen by document type: `design/`, `implementation/`, `guides/`, `summaries/`, `ai_prompts/`
- Explicitly distinguished `docs/prompts/` (SDD task prompts) from `docs/ai_prompts/` (copy/paste prompts for models)
- No files moved in this change; mapping recorded as a target for a follow-up mechanical migration
- Existing workflow folders (`requests/`, `plans/`, `prompts/`, `decisions/`) left untouched
- Templates kept concise with consistent section skeletons per category

## Tasks Completed

- Task 1: Published `docs/TAXONOMY.md` with categories, routing rules, and proposed mapping of all 36 root docs; linked from `docs/README.md`
- Task 2: Created 5 category subfolders under `docs/` with one `TEMPLATE.md` each (`design`, `implementation`, `guides`, `summaries`, `ai_prompts`)

## Related Artifacts (removed)

- docs/requests/CR_docs_taxonomy_templates.md
- docs/plans/PLAN_docs_taxonomy_templates.md
- docs/prompts/docs_taxonomy_templates/ (2 tasks)
