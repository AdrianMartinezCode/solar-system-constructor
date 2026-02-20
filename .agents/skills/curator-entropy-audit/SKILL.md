# Skill: Curator — Entropy Audit

## Purpose

Perform a lightweight, repeatable “repo health” audit to identify entropy (duplication, unclear structure, stale artifacts) and convert it into a small, ordered plan of fixes.

## Inputs

- Repo context snapshot + directory scans (MCP tools):
  - `repo_context_snapshot`
  - `repo_list` on `.agents/`, `docs/`, `mcp/`, `src/`
  - `repo_search` for common entropy signals (duplicates, `old/new`, “draft”, “temp”, TODO/FIXME)
- Optional: an explicit audit request file `docs/requests/CR_<slug>.md`

## Outputs

Choose one of:

- **Audit note**: `docs/decisions/AUDIT_<yyyy-mm-dd>_repo_entropy.md`
- **Or** a full PO workflow:
  - `docs/requests/CR_<slug>.md` (if not provided)
  - `docs/plans/PLAN_<slug>.md`
  - `docs/prompts/<slug>/task_<n>/TASK_<n>_<slug>.md`

## Algorithm / Steps

1. Take a snapshot (`repo_context_snapshot`) and capture it in the audit note (date/time).
2. Inventory key “meta” surfaces:
   - `.agents/` (roles, skills, workflow)
   - `docs/` (requests/plans/prompts/decisions + feature docs)
   - `mcp/` (server tools + docs)
3. Validate docs information architecture is consistent with the current taxonomy:
   - `docs/` root contains indexes (not technical docs): `docs/README.md`, `docs/TAXONOMY.md`
   - Technical docs live in:
     - `docs/design/`
     - `docs/implementation/`
     - `docs/guides/`
     - `docs/summaries/`
     - `docs/ai_prompts/`
   - Category templates exist (`docs/*/TEMPLATE.md`) and docs generally follow them.
4. Identify entropy signals (examples):
   - Multiple versions of the same artifact (`*.old.*`, `*.new.*`, duplicate docs)
   - Orphan docs (not linked from any index/README)
   - Inconsistent naming (mixed casing, missing prefixes like `CR_`, `PLAN_`)
   - Empty “contract” directories (no templates / no README)
5. Classify findings:
   - **Quick fix**: doc/index updates only
   - **Safe refactor**: moves/renames with reference updates
   - **Needs decision**: requires ADR before acting
6. Convert into a small plan:
   - 1–5 tasks, ordered by dependency/risk
   - Each task: goal, scope, files touched, acceptance criteria, verification commands

## Task Sizing Rules

- Prefer “index-first”: fix navigation and templates before reorganizing content.
- If a move touches many references, split into:
  - Task A: introduce new index + deprecation note
  - Task B: move content + update references
- Never exceed 5 touched files per task unless the task is purely mechanical (rename/update references) and explicitly justified.

## Example Output Headings

### Audit note (`AUDIT_<yyyy-mm-dd>_repo_entropy.md`)

- Snapshot (scripts/config/tree)
- Findings
- Recommended next actions
- Proposed tasks (if any)

