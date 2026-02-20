# Task 3 — Update runbooks and indexes to reflect orchestrator + new roles

## Objective

Update the “how to run an agent” documentation to reflect:

- `.agents/agents.md` as the **orchestrator entry point**
- The expanded role catalog (Product Owner + task-execution roles)
- The intended split between direct small requests vs executing PO-generated task prompts

## Context to read first

- `.agents/agents.md`
- `.agents/README.md`
- `.agents/roles/README.md`
- `.agents/skills/workflow/SKILL.md`
- `docs/ai_prompts/PROMPT_MINIMAL_AGENT_RUNBOOK.md`

## Constraints

- Touch only the files listed in **Files to create/update**.
- Keep edits additive; don’t rewrite the whole runbook.
- Do not change app code under `src/`.

## Steps

1. Update `docs/ai_prompts/PROMPT_MINIMAL_AGENT_RUNBOOK.md`:
   - Adjust “Intended model + role” guidance to support:
     - **Orchestrator-first** usage (read `.agents/agents.md`; orchestrator selects role), and
     - **Pinned-role** usage (when the user explicitly requests a specific role file).
   - Ensure the “Context to read first” still starts with `.agents/agents.md` and `.agents/skills/workflow/SKILL.md`.
2. Update `.agents/README.md`:
   - Mention the orchestrator behavior of `.agents/agents.md`.
   - Point to the role catalog in `.agents/roles/README.md`.
3. Update `.agents/skills/workflow/SKILL.md`:
   - Align terminology:
     - Product Owner generates artifacts (CR/PLAN/TASK prompts)
     - Task execution roles implement prompts
     - Direct roles handle small requests

## Files to create/update

- Update: `docs/ai_prompts/PROMPT_MINIMAL_AGENT_RUNBOOK.md`
- Update: `.agents/README.md`
- Update: `.agents/skills/workflow/SKILL.md`

## Acceptance criteria

- The minimal runbook clearly supports orchestrator-first usage and pinned-role usage.
- The agents index points to the orchestrator and the updated role catalog.
- Workflow wording aligns with the new roles without changing the underlying CR → PLAN → TASK process.

## Verification

```bash
npm run typecheck
npm run build
```

## Notes

- Avoid introducing new terminology beyond what’s needed; the goal is clarity, not new process.

