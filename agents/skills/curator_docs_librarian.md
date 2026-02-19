# Skill: Curator — Docs Librarian

## Purpose

Keep documentation **findable and coherent** by maintaining taxonomy, indexes, templates, and cross-links—without rewriting content unnecessarily.

## Inputs

- `docs/` directory contents
- Existing doc conventions (workflow artifacts):
  - Requests → `docs/requests/`
  - Plans → `docs/plans/`
  - Prompts → `docs/prompts/`
  - Decisions/ADRs → `docs/decisions/`
- Technical doc taxonomy:
  - `docs/TAXONOMY.md`
  - `docs/design/`, `docs/implementation/`, `docs/guides/`, `docs/summaries/`, `docs/ai_prompts/`
  - Category templates (`docs/*/TEMPLATE.md`)
- Repo search results for doc references (to avoid broken links)

## Outputs

- Update or create doc “entry points”:
  - `docs/README.md`
  - `docs/decisions/README.md`
  - Optional per-area indexes when volume grows (e.g. `docs/<area>/README.md`)
- Add/refresh templates:
  - `docs/decisions/ADR_TEMPLATE.md`
  - Category templates (when needed):
    - `docs/design/TEMPLATE.md`
    - `docs/implementation/TEMPLATE.md`
    - `docs/guides/TEMPLATE.md`
    - `docs/summaries/TEMPLATE.md`
    - `docs/ai_prompts/TEMPLATE.md`
- If restructuring is needed: a change request + plan + task prompts (PO lifecycle)

## Algorithm / Steps

1. Identify the primary entry points for docs (what a newcomer reads first).
2. Ensure there is a single “map” of docs (`docs/README.md`) that links to:
   - Requests/plans/prompts/decisions workflow
   - Key technical documentation (highest-signal feature docs)
3. Use the existing type-based taxonomy (`docs/TAXONOMY.md`) to keep technical docs findable:
   - `docs/design/` (concepts/architecture)
   - `docs/implementation/` (feature behavior + files + verification)
   - `docs/guides/` (how-to/quickref)
   - `docs/summaries/` (what changed and why)
   - `docs/ai_prompts/` (copy/paste prompts)
4. Keep `docs/` root for indexes only (e.g. `docs/README.md`, `docs/TAXONOMY.md`).
4. Prevent link rot:
   - Before moving a doc, `repo_search` for its filename and update references in the same task.
5. For any structural change that affects how contributors work, write an ADR.

## Task Sizing Rules

- Index work is one task; content moves are separate tasks.
- Never move docs “because it feels nicer”; only move when there’s an explicit goal and acceptance criteria.

## Example Output Headings

### Docs index (`docs/README.md`)

- Workflow (requests → plans → prompts → decisions)
- Documentation map (by area)
- Conventions (naming, templates)

