---
name: spec-writer
description: Write delta specifications from proposal. Produces specs/{domain}/spec.md with RFC 2119 requirements and Given/When/Then scenarios.
metadata:
  owner: Scribe
  version: "0.1.0"
---
# Spec Writer

## Purpose

Transform the Advocate's proposal into structured, testable specifications. Write requirements using RFC 2119 keywords and scenarios in Given/When/Then format. Use delta format (ADDED/MODIFIED/REMOVED) when existing specs exist; use full spec format for new domains. Specifications describe WHAT the system must do, not HOW it is implemented.

## When to Use This Skill

- When the Scribe is invoked for the Specs phase.
- When `proposal.md` exists and `specs/` for the change is incomplete or missing.
- When `/flow:continue` or `/flow:ff` triggers the Specs phase.

## Inputs

- `openspec/changes/<change-name>/proposal.md`
- `openspec/specs/<domain>/spec.md` — for each affected domain (when they exist).
- `openspec/config.yaml` — project context and `rules.specs`.

## Outputs

- `openspec/changes/<change-name>/specs/<domain>/spec.md` — one file per affected domain.
- Structured JSON envelope returned to the orchestrator.

## Algorithm / Steps

1. **Load proposal**: Read `openspec/changes/<change-name>/proposal.md` for intent, scope, and affected areas.
2. **Identify domains**: Map affected areas from the proposal to domain names (e.g., `universe`, `api`, `ui`). Use `openspec/config.yaml` conventions and existing `openspec/specs/` structure.
3. **Apply rules.specs**: Load and apply each rule from `config.yaml` under `rules.specs`.
4. **For each affected domain**:
   - **If existing spec exists**: Read `openspec/specs/<domain>/spec.md`. Produce delta spec with ADDED, MODIFIED, REMOVED sections. Preserve unchanged content by reference or omission.
   - **If new domain**: Produce full spec with Overview, Requirements, and Scenarios.
5. **Write requirements**: Use RFC 2119 keywords:
   - MUST / SHALL: Mandatory behavior.
   - SHOULD: Recommended; deviation allowed with justification.
   - MAY: Optional.
6. **Write scenarios**: For each requirement, add at least one scenario:
   - **Given**: Preconditions or initial state.
   - **When**: Action or trigger.
   - **Then**: Expected outcome (testable).
7. **Validate**: Ensure no implementation details (no file paths, classes, or code patterns in requirements).
8. **Write spec files** to `openspec/changes/<change-name>/specs/<domain>/spec.md`.
9. **Return envelope**: Populate status, executive_summary, artifacts, next_recommended (["tasks"]), risks.

## Task Sizing Rules

- Spec writing is scoped per domain — one spec file per domain.
- Keep each spec focused: 1–3 pages per domain.
- If a domain has many requirements, group them logically (e.g., by feature or capability).
- Do not duplicate requirements across domains; reference cross-domain behavior explicitly.

## Example Output Headings

### Full spec (new domain)

- **Overview**
- **Requirements**
  - REQ-1: [MUST/SHALL/SHOULD/MAY] …
  - REQ-2: …
- **Scenarios**
  - Scenario 1 (REQ-1): Given … When … Then …
  - Scenario 2 (REQ-1): …

### Delta spec (existing domain)

- **ADDED**
  - REQ-N: [MUST/SHALL/SHOULD/MAY] …
  - Scenario N: Given … When … Then …
- **MODIFIED**
  - REQ-X: [previous] → [updated]
  - Scenario X: [updated]
- **REMOVED**
  - REQ-Y: [reason for removal]
