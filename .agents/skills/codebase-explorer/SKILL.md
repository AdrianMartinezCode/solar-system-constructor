---
name: codebase-explorer
description: Investigate the codebase before committing to a change. Analyze current state, compare approaches, and produce exploration.md when tied to a named change.
metadata:
  owner: Scout
  version: "0.1.0"
---
# Codebase Explorer

## Purpose

Systematically explore the codebase to understand the current state of areas affected by a proposed change, identify existing patterns and conventions, compare multiple implementation approaches, and produce a structured exploration document that informs the Advocate's proposal.

## When to Use This Skill

- When the Scout is invoked via `/flow:explore <topic>` or `/flow:new <name>`.
- When a change requires understanding of existing code before a proposal can be written.
- When multiple implementation approaches exist and need objective comparison.

## Inputs

- Change name (kebab-case) — only when producing `exploration.md`.
- Topic or user description of the proposed change.
- `openspec/config.yaml` — project layout, stack, conventions.
- Source code discovered via semantic search, grep, and file reads.

## Outputs

- `openspec/changes/<change-name>/exploration.md` — only when change name is provided.
- Structured JSON envelope returned to the orchestrator.

## Algorithm / Steps

1. **Parse the request**: Extract change name (if any) and topic/description.
2. **Load project context**: Read `openspec/config.yaml` for layout paths and conventions.
3. **Identify affected areas**: Use semantic search and directory inspection to find files/modules relevant to the topic.
4. **Analyze current state**:
   - Document how similar features are implemented.
   - Note naming conventions, architectural boundaries, and patterns.
   - Identify dependencies (internal and external).
5. **Compare approaches**: Evaluate 2–4 alternative approaches. For each:
   - Describe the approach briefly.
   - List pros, cons, and complexity (low/medium/high).
   - Note any conflicts with existing code or architecture.
6. **Recommend approach**: Based on comparison, recommend one approach with brief rationale (or note that the Advocate should decide).
7. **Surface risks and open questions**: List blockers, unknowns, or areas needing clarification.
8. **Write exploration.md**: Only if change name is provided. Use the structure below.
9. **Return envelope**: Populate status, executive_summary, artifacts, next_recommended, risks.

## Task Sizing Rules

- Exploration is a **single-phase** activity — one session per change.
- Keep exploration focused: 1–3 pages of markdown maximum.
- Do not over-research — enough to inform the proposal, not exhaust every possibility.
- If the topic is trivial (1–2 files, no architectural impact), a minimal exploration suffices.

## Example Output Headings

### exploration.md

- **Current State**
  - Affected areas (concrete file paths)
  - Existing patterns and conventions
  - Dependencies and constraints
- **Approach Comparison**
  - Table: Approach | Pros | Cons | Complexity
- **Recommended Approach**
  - Brief rationale
- **Risks**
  - List of potential issues
- **Open Questions**
  - Items needing clarification before proposal
