# Plan: Migrate + refactor `docs/` root markdown docs into taxonomy folders

## Summary

Migrate all technical markdown docs currently in `docs/` root into the taxonomy subfolders defined by `docs/TAXONOMY.md`, then refactor each doc to follow its category template (`docs/*/TEMPLATE.md`). This plan keeps changes safe by working in small batches (≤ 5 docs per task), preserving diagrams in-place, and deferring index/link updates to a final focused task.

## Repo snapshot used

- Contract + workflow:
  - `agents/agents.md`
  - `agents/skills/WORKFLOW.md`
  - `agents/skills/change_request_triage.md`
  - `agents/skills/po_task_decomposer.md`
  - `agents/skills/prompt_writer.md`
  - `agents/roles/curator_of_order.md`
- Docs map + taxonomy:
  - `docs/README.md`
  - `docs/TAXONOMY.md`
- Category templates:
  - `docs/design/TEMPLATE.md`
  - `docs/implementation/TEMPLATE.md`
  - `docs/guides/TEMPLATE.md`
  - `docs/summaries/TEMPLATE.md`
  - `docs/ai_prompts/TEMPLATE.md`
- Root docs inventory:
  - `find docs -maxdepth 1 -type f -name "*.md" | sort`
- Verification scripts:
  - `package.json` (`npm run typecheck`, `npm run build`)

## Assumptions

- `docs/README.md` and `docs/TAXONOMY.md` remain in `docs/` root as navigational/index docs (not forced into a taxonomy category template).
- The “Proposed mapping (no moves yet)” list in `docs/TAXONOMY.md` is the intended authoritative mapping and will be upgraded to reflect an executed migration once done.
- Any diagrams embedded in a doc (Mermaid code fences, ASCII diagrams, etc.) must remain embedded in that same file, though they may be relocated into the most appropriate template section.

## Risks / unknowns

- **Link breakage**: moving docs can break relative links between docs.
  - Mitigation: update links inside the docs being refactored in each task; do a final index update + grep-based sanity checks.
- **Accidental content loss**: template refactors can drop sections or diagrams.
  - Mitigation: each task includes an explicit “diagram preservation” acceptance criterion.
- **Hybrid docs**: some docs may straddle guide/implementation.
  - Mitigation: follow `docs/TAXONOMY.md` mapping unless a doc clearly belongs elsewhere; if a reclassification is needed, record it in `docs/TAXONOMY.md` during the final index task.

## Out of scope

- Moving non-markdown artifacts in `docs/` root (e.g. `docs/solar-system-constructor.code-workspace`).
- Changing application code under `src/`.
- Adding new taxonomy categories without a separate CR/ADR.

## Task list (ordered)

### Task 1 — Scan/analyze: add migration notes + definitive destination paths

- **Goal**: Record the root-doc inventory and “what goes where” as an execution checklist inside `docs/TAXONOMY.md` (without moving files yet).
- **Scope / non-goals**: no `git mv`; no doc content refactors besides taxonomy notes.
- **Dependencies**: none
- **Files likely touched**:
  - `docs/TAXONOMY.md`
- **Acceptance criteria**:
  - A checklist/table exists listing each `docs/*.md` (root) doc and its destination folder.
  - The checklist explicitly calls out that `docs/README.md` and `docs/TAXONOMY.md` remain in `docs/` root.
- **Verification commands**:
  - `npm run typecheck`
  - `npm run build`

### Task 2 — Move + refactor AI copy/paste prompts into `docs/ai_prompts/`

- **Goal**: Move the 3 AI prompt docs into `docs/ai_prompts/` and refactor them to match `docs/ai_prompts/TEMPLATE.md`.
- **Scope / non-goals**: no changes to workflow prompts in `docs/prompts/`.
- **Dependencies**: Task 1
- **Files likely touched**:
  - `docs/PROMPT_AGENT_SYSTEM_SETUP.md` → `docs/ai_prompts/PROMPT_AGENT_SYSTEM_SETUP.md`
  - `docs/PROMPT_MINIMAL_AGENT_RUNBOOK.md` → `docs/ai_prompts/PROMPT_MINIMAL_AGENT_RUNBOOK.md`
  - `docs/PROMPT_UI_DOMAIN_SEPARATION_REFACTOR.md` → `docs/ai_prompts/PROMPT_UI_DOMAIN_SEPARATION_REFACTOR.md`
- **Acceptance criteria**:
  - Files are moved (history-preserving) and match the AI prompt template sections.
  - Any embedded code fences/diagrams remain present.
- **Verification commands**:
  - `npm run typecheck`
  - `npm run build`

### Task 3 — Move + refactor guides into `docs/guides/`

- **Goal**: Move the 5 guide docs into `docs/guides/` and refactor them to match `docs/guides/TEMPLATE.md`.
- **Scope / non-goals**: do not rewrite content; restructure for template compliance and fix obvious broken links inside these docs.
- **Dependencies**: Task 1
- **Files likely touched**:
  - `docs/GENERATOR_QUICKREF.md` → `docs/guides/GENERATOR_QUICKREF.md`
  - `docs/GENERATOR_UI_INTEGRATION.md` → `docs/guides/GENERATOR_UI_INTEGRATION.md`
  - `docs/KEYBOARD_SHORTCUTS.md` → `docs/guides/KEYBOARD_SHORTCUTS.md`
  - `docs/PRNG_README.md` → `docs/guides/PRNG_README.md`
  - `docs/STATS_USAGE_GUIDE.md` → `docs/guides/STATS_USAGE_GUIDE.md`
- **Acceptance criteria**:
  - Files are moved and match the guide template sections.
  - Any embedded diagrams remain present.
- **Verification commands**:
  - `npm run typecheck`
  - `npm run build`

### Task 4 — Move + refactor design docs (batch A) into `docs/design/`

- **Goal**: Move 4 design docs into `docs/design/` and refactor them to match `docs/design/TEMPLATE.md`.
- **Dependencies**: Task 1
- **Files likely touched**:
  - `docs/ALGORITHM_FLOW.md` → `docs/design/ALGORITHM_FLOW.md`
  - `docs/PROCEDURAL_GENERATOR.md` → `docs/design/PROCEDURAL_GENERATOR.md`
  - `docs/TOPOLOGY_GRAMMAR_PRESETS.md` → `docs/design/TOPOLOGY_GRAMMAR_PRESETS.md`
  - `docs/UI_REDESIGN_WINDOWED.md` → `docs/design/UI_REDESIGN_WINDOWED.md`
- **Acceptance criteria**:
  - Files are moved and match the design template sections (including a Status).
  - Diagrams remain embedded.
- **Verification commands**:
  - `npm run typecheck`
  - `npm run build`

### Task 5 — Move + refactor design docs (batch B) into `docs/design/`

- **Goal**: Move remaining design docs into `docs/design/` and refactor to match the design template.
- **Dependencies**: Task 4 (optional; mostly organizational)
- **Files likely touched**:
  - `docs/BODY_EDITOR_STRUCTURE.md` → `docs/design/BODY_EDITOR_STRUCTURE.md`
  - `docs/BODY_POV_CAMERA.md` → `docs/design/BODY_POV_CAMERA.md`
  - `docs/UI_PREVIEW.md` → `docs/design/UI_PREVIEW.md`
- **Acceptance criteria**:
  - Files are moved and match the design template sections.
  - Diagrams remain embedded.
- **Verification commands**:
  - `npm run typecheck`
  - `npm run build`

### Task 6 — Move + refactor summaries (batch A) into `docs/summaries/`

- **Goal**: Move 4 summary docs into `docs/summaries/` and refactor them to match `docs/summaries/TEMPLATE.md`.
- **Dependencies**: Task 1
- **Files likely touched**:
  - `docs/BELT_PARTICLE_FIELD_REFACTORING.md` → `docs/summaries/BELT_PARTICLE_FIELD_REFACTORING.md`
  - `docs/BODY_EDITOR_REFACTOR_SUMMARY.md` → `docs/summaries/BODY_EDITOR_REFACTOR_SUMMARY.md`
  - `docs/COMETS_DOCUMENTATION_UPDATES.md` → `docs/summaries/COMETS_DOCUMENTATION_UPDATES.md`
  - `docs/GENERATOR_DELIVERY.md` → `docs/summaries/GENERATOR_DELIVERY.md`
- **Acceptance criteria**:
  - Files are moved and match the summary template sections.
  - Any embedded diagrams remain present.
- **Verification commands**:
  - `npm run typecheck`
  - `npm run build`

### Task 7 — Move + refactor summaries (batch B) into `docs/summaries/`

- **Goal**: Move remaining summary docs into `docs/summaries/` and refactor to the summary template.
- **Dependencies**: Task 6 (optional; mostly organizational)
- **Files likely touched**:
  - `docs/PRNG_SUMMARY.md` → `docs/summaries/PRNG_SUMMARY.md`
  - `docs/STATS_REFACTOR_SUMMARY.md` → `docs/summaries/STATS_REFACTOR_SUMMARY.md`
  - `docs/UI_IMPLEMENTATION_SUMMARY.md` → `docs/summaries/UI_IMPLEMENTATION_SUMMARY.md`
- **Acceptance criteria**:
  - Files are moved and match the summary template sections.
  - Any embedded diagrams remain present.
- **Verification commands**:
  - `npm run typecheck`
  - `npm run build`

### Task 8 — Move + refactor implementation docs (batch A) into `docs/implementation/`

- **Goal**: Move 5 implementation docs into `docs/implementation/` and refactor them to match `docs/implementation/TEMPLATE.md`.
- **Dependencies**: Task 1
- **Files likely touched**:
  - `docs/GENERATOR_IMPLEMENTATION.md` → `docs/implementation/GENERATOR_IMPLEMENTATION.md`
  - `docs/ELLIPTICAL_ORBITS.md` → `docs/implementation/ELLIPTICAL_ORBITS.md`
  - `docs/GROUP_ISOLATION_FEATURE.md` → `docs/implementation/GROUP_ISOLATION_FEATURE.md`
  - `docs/TIME_SCALE_FEATURE.md` → `docs/implementation/TIME_SCALE_FEATURE.md`
  - `docs/WINDOWED_UI_IMPLEMENTATION.md` → `docs/implementation/WINDOWED_UI_IMPLEMENTATION.md`
- **Acceptance criteria**:
  - Files are moved and match the implementation template sections.
  - Verification section includes at least one manual check relevant to the feature, if present in the original doc.
  - Diagrams remain embedded.
- **Verification commands**:
  - `npm run typecheck`
  - `npm run build`

### Task 9 — Move + refactor implementation docs (batch B) into `docs/implementation/`

- **Goal**: Move 5 implementation docs into `docs/implementation/` and refactor them to match the implementation template.
- **Dependencies**: Task 8 (optional; mostly organizational)
- **Files likely touched**:
  - `docs/ASTEROID_BELT_IMPLEMENTATION.md` → `docs/implementation/ASTEROID_BELT_IMPLEMENTATION.md`
  - `docs/KUIPER_BELT_IMPLEMENTATION.md` → `docs/implementation/KUIPER_BELT_IMPLEMENTATION.md`
  - `docs/RING_SYSTEMS_IMPLEMENTATION.md` → `docs/implementation/RING_SYSTEMS_IMPLEMENTATION.md`
  - `docs/COMETS_IMPLEMENTATION.md` → `docs/implementation/COMETS_IMPLEMENTATION.md`
  - `docs/BLACK_HOLES_IMPLEMENTATION.md` → `docs/implementation/BLACK_HOLES_IMPLEMENTATION.md`
- **Acceptance criteria**:
  - Files are moved and match the implementation template sections.
  - Diagrams remain embedded.
- **Verification commands**:
  - `npm run typecheck`
  - `npm run build`

### Task 10 — Move + refactor implementation docs (batch C) into `docs/implementation/`

- **Goal**: Move the remaining implementation docs into `docs/implementation/` and refactor them to match the implementation template.
- **Dependencies**: Task 9 (optional; mostly organizational)
- **Files likely touched**:
  - `docs/LAGRANGE_POINTS_IMPLEMENTATION.md` → `docs/implementation/LAGRANGE_POINTS_IMPLEMENTATION.md`
  - `docs/NEBULAE_IMPLEMENTATION.md` → `docs/implementation/NEBULAE_IMPLEMENTATION.md`
  - `docs/PROTOPLANETARY_DISK_IMPLEMENTATION.md` → `docs/implementation/PROTOPLANETARY_DISK_IMPLEMENTATION.md`
  - `docs/ROGUE_PLANETS.md` → `docs/implementation/ROGUE_PLANETS.md`
- **Acceptance criteria**:
  - Files are moved and match the implementation template sections.
  - Diagrams remain embedded.
- **Verification commands**:
  - `npm run typecheck`
  - `npm run build`

### Task 11 — Update docs indexes + post-migration sanity checks

- **Goal**: Update `docs/README.md` and `docs/TAXONOMY.md` to reflect the new locations, and confirm `docs/` root is “clean” (only index/taxonomy markdown remains).
- **Scope / non-goals**: do not do another sweeping content refactor; only index/routing/link updates.
- **Dependencies**: Tasks 2–10 complete
- **Files likely touched**:
  - `docs/README.md`
  - `docs/TAXONOMY.md`
- **Acceptance criteria**:
  - `docs/README.md` links point at the new paths (e.g. `docs/design/...`, `docs/guides/...`).
  - `docs/TAXONOMY.md` mapping is updated to show post-move paths (and no longer claims “no moves yet”).
  - `find docs -maxdepth 1 -type f -name "*.md"` returns only `docs/README.md` and `docs/TAXONOMY.md` (plus any explicitly-approved exceptions).
- **Verification commands**:
  - `npm run typecheck`
  - `npm run build`
  - `find docs -maxdepth 1 -type f -name "*.md" | sort`

