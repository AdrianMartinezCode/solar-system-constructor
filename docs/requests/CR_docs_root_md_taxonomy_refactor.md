# Change Request: Migrate + refactor `docs/` root markdown docs into taxonomy folders

## Summary

Classify all `docs/*.md` files currently living in the `docs/` root, **move them into the appropriate taxonomy subfolder**, and **refactor each doc to follow its category template** (`docs/*/TEMPLATE.md`). Preserve any in-document diagrams (e.g. Mermaid) as part of the refactor.

## Context

The repo has a workflow-oriented docs structure (`docs/requests/`, `docs/plans/`, `docs/prompts/`, `docs/decisions/`) plus a growing set of technical docs living flat in `docs/` root. A taxonomy already exists (`docs/TAXONOMY.md`) with routing rules and a proposed mapping, and each taxonomy category has a `TEMPLATE.md` to standardize doc structure.

This CR requests executing the previously-proposed mapping: migrating the docs to their correct “homes” and refactoring them to match the templates while keeping diagrams embedded in the docs.

## Goals

- Move technical docs from `docs/` root into the correct taxonomy categories:
  - `docs/design/`
  - `docs/implementation/`
  - `docs/guides/`
  - `docs/summaries/`
  - `docs/ai_prompts/`
- Refactor each moved document to follow the template for its destination category.
- Preserve diagrams **inside each markdown file** (do not externalize them).
- Update doc links and indexes so navigation remains easy and obvious.

## Non-goals

- Changing application code under `src/`.
- Renaming docs for aesthetic reasons (beyond path move); keep filenames stable unless there is a conflict.
- Introducing new taxonomy categories (use the existing taxonomy unless a file truly does not fit).
- Perfect rewriting of content; the primary outcome is **structure + navigability**, not content expansion.

## Constraints

- Use the repo workflow: CR → PLAN → TASK prompts.
- Keep tasks small and focused (guideline: ≤ 5 files per task).
- Prefer history-preserving moves (`git mv`) during implementation.
- Keep diagrams (Mermaid / ASCII / embedded markdown diagrams) in the doc; relocate within the new template sections as needed.
- Verification commands must be non-interactive.

## Out of Scope

- Moving non-markdown artifacts in `docs/` root (e.g. `docs/solar-system-constructor.code-workspace`).
- Large-scale crosslink normalization across the entire repo in one go; link updates should be handled incrementally as docs are refactored.

## Acceptance Criteria

- [ ] All markdown files that were previously in `docs/` root are either:
  - moved into the correct taxonomy subfolder, or
  - intentionally remain in `docs/` root because they are index/taxonomy docs (`docs/README.md`, `docs/TAXONOMY.md`).
- [ ] Every moved doc follows the appropriate category template structure:
  - `docs/design/TEMPLATE.md`
  - `docs/implementation/TEMPLATE.md`
  - `docs/guides/TEMPLATE.md`
  - `docs/summaries/TEMPLATE.md`
  - `docs/ai_prompts/TEMPLATE.md`
- [ ] Diagrams remain embedded in each doc (not removed, not externalized).
- [ ] `docs/README.md` and `docs/TAXONOMY.md` are updated so the docs map and routing rules reflect the new locations.

## Verification

```bash
npm run typecheck
npm run build

# Sanity check: only index/taxonomy markdown should remain in docs/ root
find docs -maxdepth 1 -type f -name "*.md" | sort
```

