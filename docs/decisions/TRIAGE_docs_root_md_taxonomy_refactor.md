# Triage note: docs_root_md_taxonomy_refactor

## Change Request Reference

- `docs/requests/CR_docs_root_md_taxonomy_refactor.md`

## Classification

- **Size**: large (6+ tasks)
- **Type**: documentation (information architecture + refactor/move)
- **Risk**: medium (cross-cutting path moves can break links; content refactors can accidentally drop diagrams)

## Affected Areas

- `docs/` root technical docs (`docs/*.md`)
- Taxonomy + index docs:
  - `docs/TAXONOMY.md`
  - `docs/README.md`
- Taxonomy category folders + templates:
  - `docs/design/`
  - `docs/implementation/`
  - `docs/guides/`
  - `docs/summaries/`
  - `docs/ai_prompts/`

## Blockers / Open Questions

- **Scope question**: Should `docs/README.md` and `docs/TAXONOMY.md` remain in `docs/` root as “index” docs? (Recommendation: **yes**, do not force them into a category template.)
- **Link strategy**: How aggressive should link normalization be?
  - Recommendation: update links **as each doc is refactored**, and do a final pass for `docs/README.md` + `docs/TAXONOMY.md`. Avoid a “touch everything” sweep.
- **Diagram policy**: Confirm that Mermaid / ASCII diagrams must remain *in the same file*.
  - Interpreting the CR as: **diagrams stay embedded**; they may be moved into the appropriate template section but not removed or externalized.

## Recommendation

Proceed with decomposition into small, ordered tasks that each:

- moves ≤ 5 docs into their taxonomy folder (history-preserving),
- refactors them to match the correct template,
- preserves diagrams verbatim,
- updates local links inside those docs (and updates index docs at the end).

## Next Steps

- Produce `docs/plans/PLAN_docs_root_md_taxonomy_refactor.md`
- Produce task prompts under `docs/prompts/docs_root_md_taxonomy_refactor/task_<n>/...`

