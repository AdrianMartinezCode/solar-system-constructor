# Skill: Change Request Triage

## Purpose

Evaluate an incoming change request to determine its scope, feasibility, and priority. Classify it so the PO Task Decomposer can process it effectively.

## Inputs

- A change request file at `docs/requests/CR_<slug>.md`.
- Repo context gathered via MCP tools (context snapshot, file reads).

## Outputs

- An annotated version of the change request with a triage section appended, or a separate triage note at `docs/decisions/TRIAGE_<slug>.md`.

## Algorithm / Steps

1. Read the change request document thoroughly.
2. Run `repo_context_snapshot` to understand current project state.
3. Identify which parts of the codebase are affected using `repo_search` and `repo_list`.
4. Classify the request:
   - **Size**: small (1–2 tasks), medium (3–5 tasks), large (6+ tasks).
   - **Type**: feature, refactor, bugfix, infrastructure, documentation.
   - **Risk**: low (isolated change), medium (cross-cutting), high (foundational change).
5. Check for blockers:
   - Missing dependencies or tooling.
   - Conflicts with ongoing work.
   - Unclear requirements that need clarification.
6. Summarize findings and recommend next steps:
   - Ready for decomposition.
   - Needs clarification (list specific questions).
   - Needs prerequisite work first (list dependencies).

## Task Sizing Rules

- Triage itself is a **single-step** activity — it does not produce implementation tasks.
- The output should be concise: no more than **1 page** of markdown.
- If the request is ambiguous, list **specific questions** rather than making assumptions.

## Example Output Headings

### Triage note (`TRIAGE_<slug>.md`)

- Change Request Reference
- Classification
  - Size
  - Type
  - Risk
- Affected Areas
- Blockers / Open Questions
- Recommendation
- Next Steps
