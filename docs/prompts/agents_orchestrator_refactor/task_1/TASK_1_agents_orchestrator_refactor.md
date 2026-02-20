# Task 1 — Make `.agents/agents.md` the Orchestrator entry point (routing spec)

## Objective

Update `.agents/agents.md` to include an **Orchestrator / Role Routing** section that deterministically selects which role to use for a given incoming request:

- Product Owner
- Developer
- Task Developer
- Curator of Order
- Task Curator of Order

This task defines routing and “role acquisition” behavior as documentation (no code enforcement).

## Context to read first

- `.agents/agents.md`
- `.agents/roles/developer.md`
- `.agents/roles/curator_of_order.md`
- `.agents/skills/change-request-triage/SKILL.md` (size classification conventions)
- `.agents/skills/workflow/SKILL.md` (CR → PLAN → TASK workflow)

## Constraints

- Only modify the file(s) listed in **Files to create/update**.
- Do not create or modify role files in this task (that’s Task 2).
- Keep the existing “global contract” content intact unless a small edit is required to add the orchestrator section cleanly.
- Do not change app code under `src/`.

## Steps

1. Add a new top-level section (near the top) to `.agents/agents.md` titled **Orchestrator / Role Routing**.
2. In that section, document:
   - A routing table mapping request types to roles.
   - A deterministic rule for **big vs small** requests:
     - Reuse triage sizing: small (1–2 tasks), medium (3–5), large (6+).
     - Route medium/large (“big”) to **Product Owner**.
   - A deterministic rule for **task prompt execution**:
     - If the input references `docs/prompts/<slug>/task_<n>/...`, route to the corresponding **Task** role (Task Developer / Task Curator).
   - A deterministic rule for **curation vs implementation**:
     - Curation = re-org/index/taxonomy/agent-doc changes → Curator roles
     - Implementation = code changes → Developer roles
   - Tie-breaker / stop conditions:
     - If unclear, ask 1–3 specific questions and do not proceed.
3. Add a short “How to acquire a role” subsection:
  - The orchestrator selects a role and then follows that role’s file in `.agents/roles/*`.
   - The orchestrator should explicitly state which role it is acting as.

## Files to create/update

- Update: `.agents/agents.md`

## Acceptance criteria

- `.agents/agents.md` contains an **Orchestrator / Role Routing** section that:
  - Explicitly lists the five roles and the routing rules you provided.
  - Defines “big task” vs “small changes” in a way that can be consistently applied.
  - Defines how to handle PO-generated tasks (Task Developer / Task Curator).
  - Includes clear stop conditions for ambiguous requests.

## Verification

```bash
npm run typecheck
npm run build
```

## Notes

- Keep this routing spec human-readable and operational: the goal is to avoid role ambiguity and scope creep.
- Do not add new skills unless routing cannot be expressed clearly in `.agents/agents.md`.

