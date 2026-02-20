# Plan: Agents Orchestrator + Product Owner & Task Roles

## Summary

Refactor the agent documentation so `agents/agents.md` becomes an **Orchestrator entry point** with deterministic routing rules that select the right role based on the request. Add a **Product Owner** role and introduce “task-*” execution roles to separate **direct small requests** from **executing PO-generated task prompts**, for both implementation and curation.

This is a documentation/agent-system refactor only (no `src/` code changes).

## Repo snapshot used

- Contract/origin: `agents/agents.md`
- Existing roles: `agents/roles/developer.md`, `agents/roles/curator_of_order.md`, `agents/roles/README.md`
- Skills/workflow: `agents/skills/WORKFLOW.md`, `agents/skills/po_task_decomposer.md`, `agents/skills/prompt_writer.md`, `agents/skills/change_request_triage.md`, `agents/skills/dev_task_executor.md`
- Runbook: `docs/ai_prompts/PROMPT_MINIMAL_AGENT_RUNBOOK.md`
- Prompt storage convention: `.cursor/rules/docs-prompts-structure.mdc`, `docs/prompts/README.md`
- Verification commands: `package.json` (`typecheck`, `build`)

## Assumptions

- “Orchestrator” is **documentation-driven**: the routing behavior is expressed as rules in `agents/agents.md`, not enforced by code.
- “Big task” selection can reuse the existing triage sizing convention from `agents/skills/change_request_triage.md` (small/medium/large).
- The existing `Curator of Order` role remains valid for direct curation work (“as we have now”).

## Risks / unknowns

- Ambiguous routing criteria can cause role thrash. The orchestrator section must include **stop conditions** and a deterministic tie-breaker.
- Renaming or repurposing the current `Developer` role could confuse existing usage; we’ll keep the file path but adjust the scope carefully and add explicit cross-links.

## Out of scope

- Adding new MCP tools.
- Modifying app code under `src/`.
- Adding lint/tests beyond current scripts.

## Task list (ordered)

### Task 1 — Make `agents/agents.md` the Orchestrator entry point (routing spec)

- **Goal**: Add an “Orchestrator / Role Routing” section to `agents/agents.md` that chooses between Product Owner / Developer / Task Developer / Curator / Task Curator using clear rules aligned with existing workflow conventions.
- **Scope / non-goals**: No role files created/edited in this task; no changes to `docs/` runbooks.
- **Dependencies**: none
- **Files likely touched**:
  - `agents/agents.md`
- **Acceptance criteria**:
  - `agents/agents.md` contains a routing section that:
    - Defines the five target roles and when each is selected.
    - Defines “big task” vs “small task” criteria (mapped to triage size classification).
    - Defines a tie-breaker and “stop and ask” conditions.
    - Explains how to “acquire” a role (select role file; follow its guardrails).
- **Verification commands**:
  - `npm run typecheck`
  - `npm run build`

### Task 2 — Add Product Owner + task-execution role variants; refactor Developer role scope

- **Goal**: Introduce the new roles and reshape `Developer` to be “small direct implementation”, while Task Developer becomes the “execute task prompts” role.
- **Scope / non-goals**: No changes to `agents/skills/*` algorithms; no changes to the Curator role behavior unless strictly needed for clarity.
- **Dependencies**: Task 1
- **Files likely touched** (≤ 5):
  - `agents/roles/product_owner.md` (new)
  - `agents/roles/task_developer.md` (new)
  - `agents/roles/task_curator_of_order.md` (new)
  - `agents/roles/developer.md` (update scope and cross-links)
  - `agents/roles/README.md` (update catalog)
- **Acceptance criteria**:
  - Product Owner role explicitly:
    - Produces CR/PLAN/TASK prompts following the existing workflow.
    - Does **not** implement tasks and does **not** run verification.
  - Task Developer role:
    - Is explicitly constrained to executing `docs/prompts/<slug>/task_<n>/TASK_<n>_<slug>.md`.
    - Uses `agents/skills/dev_task_executor.md`.
  - Task Curator of Order role:
    - Is explicitly constrained to executing curation tasks from PO-generated task prompts.
    - Inherits curation guardrails and avoids product feature work.
  - Developer role is updated to:
    - Handle small direct implementation requests.
    - Defer PO workflow generation to Product Owner.
    - Defer task-prompt execution to Task Developer.
  - Roles index lists all roles and briefly states their distinction.
- **Verification commands**:
  - `npm run typecheck`
  - `npm run build`

### Task 3 — Update runbooks and indexes to reflect orchestration + new roles

- **Goal**: Ensure the “how to run an agent” docs point to the orchestrator model and the expanded role catalog.
- **Scope / non-goals**: No changes to app code; no reorganization of historical docs; keep edits tight and additive.
- **Dependencies**: Task 2
- **Files likely touched**:
  - `docs/ai_prompts/PROMPT_MINIMAL_AGENT_RUNBOOK.md`
  - `agents/README.md`
  - `agents/skills/WORKFLOW.md`
- **Acceptance criteria**:
  - Minimal runbook supports both:
    - Using the orchestrator (`agents/agents.md`) as the primary entry point, and
    - (Optionally) pinning a specific role file when the user explicitly requests a role.
  - Agents index (`agents/README.md`) references the orchestrator and updated role catalog location.
  - Workflow doc aligns terminology: Product Owner generates artifacts; task-execution roles implement prompts; direct roles handle small requests.
- **Verification commands**:
  - `npm run typecheck`
  - `npm run build`

