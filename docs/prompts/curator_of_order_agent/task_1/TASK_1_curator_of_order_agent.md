# Task title

Add scalable agent role structure + templates (compatibility-safe)

## Objective

Introduce a dedicated place for agent roles (`.agents/roles/`) plus a role template and indexes, while keeping the existing agent contract (`.agents/agents.md`) compatible and unchanged in meaning.

## Context to read first

- `.agents/agents.md`
- `.agents/skills/workflow/SKILL.md`
- `docs/requests/README.md`

## Constraints

- Additive changes only; do not break existing paths.
- Do not touch `src/`.

## Steps

1. Create `.agents/README.md` as the index for contract/roles/skills.
2. Create `.agents/roles/README.md` and `.agents/roles/_template.md`.
3. Add a short “Multi-Agent Compatibility” note to `.agents/agents.md` pointing to roles + skills.

## Files to create/update

- Create: `.agents/README.md`
- Create: `.agents/roles/README.md`
- Create: `.agents/roles/_template.md`
- Update: `.agents/agents.md`

## Acceptance criteria

- [ ] New role folder exists and is indexed.
- [ ] Global contract still lives at `.agents/agents.md` and remains the canonical contract.

## Verification

```bash
npm run typecheck
npm run build
```

## Notes

- Keep wording short; avoid redefining the contract.

