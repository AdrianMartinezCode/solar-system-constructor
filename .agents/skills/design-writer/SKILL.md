---
name: design-writer
description: Create technical design documents from proposal. Produces design.md with architecture decisions, data flow, file changes, and interfaces.
metadata:
  owner: Architect
  version: "0.1.0"
---
# Design Writer

## Purpose

Transform the Advocate's proposal into a concrete technical design document. Read the actual codebase, make architecture decisions with rationale and alternatives, define data flow, interfaces, file changes, testing strategy, and migration/release plan. The design guides the Strategist and Builder.

## When to Use This Skill

- When the Architect is invoked for the Design phase.
- When `proposal.md` exists and `design.md` for the change is incomplete or missing.
- When `/flow:continue` or `/flow:ff` triggers the Design phase.

## Inputs

- `openspec/changes/<change-name>/proposal.md`
- `openspec/changes/<change-name>/specs/<domain>/spec.md` — optional, when available.
- Relevant source code (apps/web, apps/api, packages, config files).
- `openspec/config.yaml` — project context and `rules.design`.

## Outputs

- `openspec/changes/<change-name>/design.md`
- Structured JSON envelope returned to the orchestrator.

## Algorithm / Steps

1. **Load proposal**: Read `openspec/changes/<change-name>/proposal.md` for intent, scope, approach, and affected areas.
2. **Load optional specs**: If delta specs exist, read them for context on requirements.
3. **Read codebase**: Inspect files in affected areas. Document existing patterns, naming, and structure.
4. **Apply rules.design**: Load and apply each rule from `config.yaml` under `rules.design`.
5. **Draft design sections**:
   - **Technical Approach**: High-level strategy (2–4 paragraphs).
   - **Architecture Decisions**: For each decision: description, rationale, alternatives considered, choice.
   - **Data Flow**: ASCII or mermaid diagrams showing request/response flow, state transitions, or component interactions.
   - **File Changes Table**: Table: File path | Action (add/modify/remove) | Purpose.
   - **Interfaces/Contracts**: API contracts, types, or protocols (signatures, not implementation).
   - **Testing Strategy**: Unit, integration, and E2E approach; what to mock.
   - **Migration/Rollout Plan**: Phased rollout, feature flags, or backward compatibility.
   - **Open Questions**: Items needing clarification or deferred decisions.
6. **Validate**: Ensure every decision has rationale and alternatives; every path is concrete.
7. **Write design.md** to `openspec/changes/<change-name>/design.md`.
8. **Return envelope**: Populate status, executive_summary, artifacts, next_recommended (["tasks"]), risks.

## Task Sizing Rules

- Design is a **single-phase** activity — one session per change.
- Keep design 3–6 pages; enough for Strategist and Builder without overwhelming.
- Follow existing project patterns (frontend: domain-driven layout, Zustand; backend: layered) unless the change explicitly addresses them.
- If the change is small (1–3 files), a lightweight design suffices; avoid over-engineering.

## Example Output Headings

### design.md

- **Technical Approach**
- **Architecture Decisions**
  - Decision 1: [Title]
    - Rationale
    - Alternatives considered
    - Choice
  - Decision 2: …
- **Data Flow**
  - [ASCII or mermaid diagram]
- **File Changes Table**
  - | Path | Action | Purpose |
- **Interfaces/Contracts**
  - API endpoints
  - Types / interfaces
  - Ports / adapters
- **Testing Strategy**
- **Migration/Rollout Plan**
- **Open Questions**
