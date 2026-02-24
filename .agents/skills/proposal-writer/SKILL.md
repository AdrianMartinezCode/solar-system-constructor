---
name: proposal-writer
description: Create structured change proposals from exploration or user description. Produces proposal.md with intent, scope, approach, risks, and rollback plan.
metadata:
  owner: Advocate
  version: "0.1.0"
---
# Proposal Writer

## Purpose

Transform exploration analysis or user description into a structured change proposal that downstream phases (Scribe, Architect, Strategist) can consume. Ensures every change has clear intent, scope, approach, affected areas, risks, rollback plan, dependencies, and success criteria.

## When to Use This Skill

- When the Advocate is invoked for the Propose phase.
- When `proposal.md` does not exist for a named change and exploration (or user input) is available.
- When `/flow:new`, `/flow:continue`, or `/flow:ff` triggers the Propose phase.

## Inputs

- `openspec/changes/<change-name>/exploration.md` — when Scout produced it.
- User description — when exploration was skipped or provided inline.
- `openspec/config.yaml` — project context and `rules.proposal`.
- `openspec/specs/` — existing domain specs (read if relevant to affected domains).

## Outputs

- `openspec/changes/<change-name>/proposal.md`
- Structured JSON envelope returned to the orchestrator.

## Algorithm / Steps

1. **Load inputs**: Read exploration.md (if present), user description, and `openspec/config.yaml`.
2. **Apply rules.proposal**: Extract and apply each rule from `config.yaml` under `rules.proposal`.
3. **Read existing specs**: If the change affects known domains, read `openspec/specs/<domain>/spec.md` for context.
4. **Draft proposal sections**:
   - **Intent**: One paragraph describing the goal and motivation.
   - **Scope**: In-scope items (bulleted) and out-of-scope items (bulleted).
   - **Approach**: High-level strategy (2–4 paragraphs); reference exploration's recommended approach if available.
   - **Affected Areas**: Concrete file paths grouped by layer (frontend, backend, shared, config).
   - **Risks**: Known risks and mitigations.
   - **Rollback Plan**: How to revert or mitigate if the change fails.
   - **Dependencies**: External or internal prerequisites.
   - **Success Criteria**: Measurable outcomes (bulleted, testable).
5. **Validate against rules**: Ensure rollback plan, success criteria, concrete paths, and scope (in/out) are present.
6. **Write proposal.md** to `openspec/changes/<change-name>/proposal.md`.
7. **Return envelope**: Populate status, executive_summary, artifacts, next_recommended (["specs", "design"]), risks.

## Task Sizing Rules

- Proposal writing is a **single-phase** activity — one session per change.
- Keep proposal 2–4 pages; enough for Scribe and Architect to work in parallel.
- If exploration is missing, infer affected areas from the user description and project layout; note assumptions in the proposal.
- When change is ambiguous, load `change-request-triage` and add a scope assessment section (size/type/risk) to inform downstream phases.

## Example Output Headings

### proposal.md

- **Intent**
- **Scope**
  - In scope
  - Out of scope
- **Approach**
- **Affected Areas**
  - Frontend
  - Backend
  - Shared
  - Config
- **Risks**
- **Rollback Plan**
- **Dependencies**
- **Success Criteria**
