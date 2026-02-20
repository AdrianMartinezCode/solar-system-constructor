# Task 2 — Create `.agents` indexes + standardized SKILL template

## Task title

Create `.agents` indexes and the new `SKILL.md` template (derived from existing `.agents` examples)

## Objective

Establish the target structure under `.agents/` before any migration:

- `.agents/README.md` (root index)
- `.agents/roles/README.md` + `.agents/roles/_template.md`
- `.agents/skills/README.md` + `.agents/skills/_template/SKILL.md` (standard template)

The template must follow the **`.agents` frontmatter style** (YAML frontmatter like existing `.agents/skills/*/SKILL.md`) and define consistent headings for all skills.

## Context to read first

- `docs/requests/CR_agents_dot_agents_consolidation.md`
- `docs/plans/PLAN_agents_dot_agents_consolidation.md`
- `.agents/skills/architecture-patterns/SKILL.md`
- `.agents/skills/react-architect-skills/SKILL.md`
- `agents/skills/README.md` (current skill template description)
- `agents/skills/_template.md` (current template file)

## Constraints

- Do not move any legacy `agents/*` files in this task.
- Keep the template minimal and consistent; don’t invent new required sections beyond what the repo already uses.

## Steps

1. Add `.agents/README.md` with:
   - Entry point: `.agents/agents.md`
   - Links to `.agents/roles/` and `.agents/skills/`
2. Add `.agents/roles/README.md` and `.agents/roles/_template.md` mirroring existing role conventions (Purpose/When/Responsibilities/Guardrails/etc.), but with `.agents/*` paths.
3. Add `.agents/skills/README.md` defining:
   - Canonical path: `.agents/skills/<kebab-skill-slug>/SKILL.md`
   - Naming: kebab-case folder slugs
   - Required headings for skill content
4. Add `.agents/skills/_template/SKILL.md` using this shape:
   - YAML frontmatter (required: `name`, `description`; optional: `license`, `metadata`)
   - H1 title
   - Standard headings:
     - Purpose
     - When to Use This Skill
     - Inputs
     - Outputs
     - Algorithm / Steps
     - Task Sizing Rules
     - Example Output Headings

### Proposed `SKILL.md` template skeleton (copy/paste)

```md
---
name: <kebab-skill-slug>
description: <1–2 sentence description>
license: <optional SPDX id>
metadata:
  owner: <optional>
  version: "0.1.0"
---

# <Skill Title>

## Purpose

_What this skill does._

## When to Use This Skill

- _Trigger/situations where it applies_

## Inputs

- _Files/context required_

## Outputs

- _Artifacts produced (paths)_

## Algorithm / Steps

1. _Step_
2. _Step_

## Task Sizing Rules

- Keep tasks small (≤ 5 files) unless explicitly justified.
- Do not mix refactors with feature work.

## Example Output Headings

_Headings only; no code._
```

## Files to create/update

- Add: `.agents/README.md`
- Add: `.agents/roles/README.md`
- Add: `.agents/roles/_template.md`
- Add: `.agents/skills/README.md`
- Add: `.agents/skills/_template/SKILL.md`

## Acceptance criteria

- The new template exists and is clearly the source-of-truth for skills going forward.
- The indexes explain where files live and how to add new roles/skills.

## Verification

```bash
npm run build
```

