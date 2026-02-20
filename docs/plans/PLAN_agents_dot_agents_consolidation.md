# Plan: Consolidate agent system into `.agents/` (remove `agents/`)

## Summary

Move the repo’s agent contract/orchestrator, roles, and skills into a single canonical root: **`.agents/`**. Standardize skills into a **folder-per-skill** structure with `SKILL.md` (YAML frontmatter + consistent headings). Remove the legacy `agents/` folder and update all repo references to the new paths.

This is a repository organization change only (no `src/` changes expected).

## Repo snapshot used

- Legacy agent system:
  - `agents/agents.md`
  - `agents/README.md`
  - `agents/roles/*`
  - `agents/skills/*` (including `WORKFLOW.md`, `_template.md`)
- Existing `.agents` structure/examples:
  - `.agents/skills/architecture-patterns/SKILL.md`
  - `.agents/skills/react-architect-skills/SKILL.md`
- References that must be updated:
  - `.cursor/rules/agents-priority-context.mdc`
  - `docs/ai_prompts/PROMPT_MINIMAL_AGENT_RUNBOOK.md`
  - `docs/ai_prompts/PROMPT_AGENT_SYSTEM_SETUP.md`
  - `mcp/server/src/tools/README.md`
  - Historical workflow artifacts under `docs/{requests,plans,prompts}/` that link to `agents/*`

## Assumptions

- `.agents/` is allowed as a canonical repo folder (even if hidden by default in some file explorers).
- The agent “orchestrator” and role routing are **documentation-driven** (not code-enforced).
- It’s acceptable to update historical docs/prompts when they contain file path references that would otherwise be broken.

## Risks / unknowns

- Dot-directories may be ignored by some tooling; ensure Cursor rules and repo docs explicitly point to `.agents/*`.
- Large mechanical moves can be noisy in diff; keep tasks scoped and preferably rely on `git mv` and deterministic search/replace.

## Out of scope

- Any refactor of the app code under `src/`.
- Any MCP tool implementation changes.

## Task list (ordered)

### Task 1 — Capture the decision (ADR): `.agents/` is the single canonical agent root

- **Goal**: Document the decision to consolidate into `.agents/`, including path conventions for skills/roles and the “entry point” file.
- **Scope / non-goals**: No file moves in this task.
- **Dependencies**: none
- **Files likely touched** (≤ 3):
  - `docs/decisions/ADR_<nnnn>_agents_dot_agents_consolidation.md` (new)
  - `docs/decisions/README.md` (update)
- **Acceptance criteria**:
  - ADR states:
    - canonical entry point is `.agents/agents.md`
    - roles live in `.agents/roles/`
    - skills live in `.agents/skills/<kebab-skill-slug>/SKILL.md`
    - legacy `agents/` will be removed after reference updates
- **Verification commands**:
  - `npm run build`

### Task 2 — Define the new standardized SKILL template + `.agents` indexes/templates

- **Goal**: Create the standardized templates and indexes under `.agents/` so the migration has a clear target shape.
- **Scope / non-goals**: No moving legacy `agents/*` yet.
- **Dependencies**: Task 1
- **Files likely touched** (target ≤ 5):
  - Add: `.agents/README.md`
  - Add: `.agents/agents.md` (or add later in Task 3 if you prefer strict sequencing)
  - Add: `.agents/roles/README.md`
  - Add: `.agents/roles/_template.md`
  - Add: `.agents/skills/README.md`
  - Add: `.agents/skills/_template/SKILL.md`
- **Acceptance criteria**:
  - `.agents/skills/_template/SKILL.md` follows the `.agents` frontmatter style and defines required headings:
    - Purpose, When to Use, Inputs, Outputs, Algorithm / Steps, Task Sizing Rules, Example Output Headings
  - `.agents/skills/README.md` documents the new folder-per-skill convention and naming (`kebab-case` folder slugs)
  - `.agents/roles/README.md` catalogs roles and points at `.agents/agents.md` as the entry point
- **Verification commands**:
  - `npm run build`

### Task 3 — Migrate orchestrator + roles into `.agents/` (update internal references)

- **Goal**: Move the agent contract/orchestrator and role files into `.agents/`, updating any internal links from `agents/...` to `.agents/...`.
- **Scope / non-goals**: Do not migrate skills yet (separate task to keep scope clear).
- **Dependencies**: Task 2
- **Files likely touched** (will exceed 5; justified as a mechanical move):
  - Move: `agents/agents.md` → `.agents/agents.md`
  - Move: `agents/README.md` → `.agents/README.md`
  - Move: `agents/roles/*` → `.agents/roles/*`
  - Update: `.agents/agents.md`, `.agents/README.md`, `.agents/roles/README.md` to reference `.agents/skills/...`
- **Acceptance criteria**:
  - `.agents/agents.md` references role files under `.agents/roles/*`
  - Role docs reference skills under `.agents/skills/*`
  - No role doc references `agents/` paths
- **Verification commands**:
  - `npm run build`

### Task 4 — Migrate skills into `.agents/skills/<skill>/SKILL.md` using the new template

- **Goal**: Convert legacy flat skills (`agents/skills/*.md`) into folder-per-skill structure with `SKILL.md` and YAML frontmatter, and (minimally) bring the pre-existing `.agents/skills/*/SKILL.md` files into the same template.
- **Scope / non-goals**: Keep content changes minimal; focus on structure/template + path updates.
- **Dependencies**: Task 3
- **Files likely touched** (will exceed 5; justified as a mechanical + templating migration):
  - Move/convert: `agents/skills/*.md` → `.agents/skills/<kebab-skill-slug>/SKILL.md`
  - Handle special cases:
    - `agents/skills/WORKFLOW.md` becomes `.agents/skills/workflow/SKILL.md` (or `.agents/workflow.md`; pick one and update all references)
    - `agents/skills/_template.md` becomes `.agents/skills/_template/SKILL.md` (folder-based template)
  - Update: `.agents/skills/README.md`
- **Acceptance criteria**:
  - Every skill is reachable at `.agents/skills/<kebab-skill-slug>/SKILL.md`
  - Each `SKILL.md` has YAML frontmatter with at least:
    - `name`, `description`
  - Each `SKILL.md` contains the standard headings (even if some sections are brief)
- **Verification commands**:
  - `npm run build`

### Task 5 — Update repo-wide references + Cursor rules to `.agents/*`

- **Goal**: Ensure no remaining references to legacy `agents/*` remain in docs, prompts, or rules.
- **Scope / non-goals**: No content refactors beyond path updates; keep changes mechanical.
- **Dependencies**: Task 4
- **Files likely touched** (broad but mechanical):
  - Update: `.cursor/rules/agents-priority-context.mdc`
  - Update: `docs/ai_prompts/PROMPT_MINIMAL_AGENT_RUNBOOK.md`
  - Update: `docs/ai_prompts/PROMPT_AGENT_SYSTEM_SETUP.md`
  - Update: `mcp/server/src/tools/README.md`
  - Update: affected historical docs under `docs/{requests,plans,prompts}/`
- **Acceptance criteria**:
  - `\bagents/` is not present anywhere in the repo (preferred), or only appears in a clearly-marked historical note that does not function as a path reference.
  - Cursor “always-on context” rule points to `.agents/*` files.
- **Verification commands**:
  - `npm run build`

### Task 6 — Remove `agents/` folder and run final audit

- **Goal**: Delete the legacy `agents/` folder after confirming all references are updated.
- **Scope / non-goals**: No restructuring beyond removal.
- **Dependencies**: Task 5
- **Files likely touched**:
  - Delete: `agents/` (entire directory)
- **Acceptance criteria**:
  - `agents/` directory no longer exists
  - `\bagents/` grep returns zero matches
- **Verification commands**:
  - `npm run build`

