# Plan: Curator of Order Agent Role + Scale-Up Structure

## Summary

Add a new **Curator of Order** agent role and the minimum repo scaffolding to keep agents/skills/docs/decisions/MCP tooling organized as the project grows. Keep changes additive and compatible with existing paths and workflows.

## Repo snapshot used

- `agents/agents.md`
- `agents/skills/README.md`, `agents/skills/WORKFLOW.md`, existing skills
- `docs/requests/README.md`, `docs/requests/CR_TEMPLATE.md`
- `docs/` tree (feature docs)
- `mcp/server/src/index.ts`, `mcp/server/src/tools/*`
- Root `package.json` (scripts include `typecheck`, `build`)

## Assumptions

- The “agent system” is markdown-first; roles and skills are documented rather than enforced by code.
- A curator role should be able to operate using existing MCP tooling without adding new tools.

## Risks / unknowns

- Future doc reorganization could create broken links if not done mechanically and in small tasks.
- Role/skill proliferation can become noisy without indexes and naming conventions.

## Out of scope

- Moving/reclassifying the existing technical docs in `docs/` root.
- Adding or changing MCP tool implementations.

## Task list (ordered)

### Task 1 — Add scalable agent role structure + templates

- **Goal**: Introduce `agents/roles/` with an index + template; add lightweight compatibility note in the existing contract.
- **Scope / non-goals**: no behavior changes; no breaking path changes.
- **Dependencies**: none
- **Files likely touched**:
  - `agents/agents.md`
  - `agents/README.md`
  - `agents/roles/README.md`
  - `agents/roles/_template.md`
- **Acceptance criteria**:
  - Roles have a home and an index.
  - Existing references to `agents/agents.md` remain valid.
- **Verification commands**:
  - `npm run typecheck`
  - `npm run build`

### Task 2 — Add Curator of Order role + curator skills

- **Goal**: Add the Curator role spec and curator-focused skills as reusable playbooks.
- **Scope / non-goals**: no doc moves; no app code changes.
- **Dependencies**: Task 1
- **Files likely touched**:
  - `agents/roles/curator_of_order.md`
  - `agents/skills/README.md`
  - `agents/skills/_template.md`
  - `agents/skills/curator_entropy_audit.md`
  - `agents/skills/curator_docs_librarian.md`
  - `agents/skills/curator_decision_steward.md`
- **Acceptance criteria**:
  - Curator role explains responsibilities, guardrails, and recommended skills.
  - Skills follow the existing skill template conventions.
- **Verification commands**:
  - `npm run typecheck`
  - `npm run build`

### Task 3 — Add docs + decisions + MCP extension entry points

- **Goal**: Create a docs map (`docs/README.md`), decisions templates/index (`docs/decisions/*`), and MCP extension notes (`mcp/*`).
- **Scope / non-goals**: only indexes/templates and minimal workflow docs.
- **Dependencies**: Task 2
- **Files likely touched**:
  - `docs/README.md`
  - `docs/decisions/README.md`
  - `docs/decisions/ADR_TEMPLATE.md`
  - `docs/requests/README.md`
  - `mcp/README.md`
  - `mcp/server/src/tools/README.md`
- **Acceptance criteria**:
  - There is a clear “where do I put X?” entry point for docs and decisions.
  - ADR naming/template is explicit and easy to follow.
  - MCP tool surface is documented and matches current tool names.
- **Verification commands**:
  - `npm run typecheck`
  - `npm run build`

