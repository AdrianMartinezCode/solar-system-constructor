# Task title

Add Curator of Order role + curator skills

## Objective

Define the **Curator of Order** as an agent role and add a small set of curator-specific skills that operate within the existing planning-first workflow.

## Context to read first

- `.agents/roles/_template.md`
- `.agents/skills/README.md`
- `.agents/skills/_template/SKILL.md`
- `docs/decisions/` (current state)
- `mcp/server/src/tools/shared.ts` (safety gates and repo-root restriction)

## Constraints

- No app product work; do not modify `src/` in this task.
- Skills must follow the existing skill template conventions.

## Steps

1. Add the Curator role definition at `.agents/roles/curator_of_order.md`.
2. Add curator skills:
   - Entropy audit
   - Docs librarian
   - Decision steward (ADR)
3. Update `.agents/skills/README.md` to list the new skills.

## Files to create/update

- Create: `.agents/roles/curator_of_order.md`
- Create: `.agents/skills/curator-entropy-audit/SKILL.md`
- Create: `.agents/skills/curator-docs-librarian/SKILL.md`
- Create: `.agents/skills/curator-decision-steward/SKILL.md`
- Update: `.agents/skills/README.md`

## Acceptance criteria

- [ ] Curator role clearly states purpose, responsibilities, non-goals, guardrails, and recommended skills.
- [ ] Each skill has: Purpose, Inputs, Outputs, Algorithm/Steps, Task sizing rules, Example output headings.
- [ ] Skills are listed in `.agents/skills/README.md`.

## Verification

```bash
npm run typecheck
npm run build
```

## Notes

- Prefer “process guardrails” over “new tooling requirements”.

