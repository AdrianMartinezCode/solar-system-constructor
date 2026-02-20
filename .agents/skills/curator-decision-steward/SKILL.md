---
name: curator-decision-steward
description: Capture structural repo decisions as lightweight ADRs and keep the decisions index up to date.
---

# Curator — Decision Steward (ADR)

## Purpose

Ensure important structural decisions are **captured, discoverable, and durable** via lightweight ADRs, and that follow-up work is planned rather than forgotten.

## When to Use This Skill

- When making a structural or policy change (folders, naming, agent contracts, docs workflow, MCP tool surface).
- When you want a durable rationale and an explicit follow-up list rather than tribal knowledge.

## Inputs

- A proposed change that affects:
  - repo structure / naming conventions
  - agent/skill contracts
  - docs workflow (requests/plans/prompts)
  - docs taxonomy (e.g. changes to `docs/TAXONOMY.md` or taxonomy folder structure)
  - MCP server tool surface / safety gates
- Context gathered by MCP tools (`repo_read`, `repo_search`, `git_diff`)

## Outputs

- A new ADR: `docs/decisions/ADR_<nnnn>_<slug>.md`
- Index update: `docs/decisions/README.md`
- Optional follow-up plan/prompts if the decision implies work:
  - `docs/plans/PLAN_<slug>.md`
  - `docs/prompts/<slug>/task_<n>/TASK_<n>_<slug>.md`

## Algorithm / Steps

1. Decide if an ADR is warranted (rule of thumb: will we regret not remembering this in 3 months?).
2. Author the ADR using `docs/decisions/ADR_TEMPLATE.md`.
3. Assign an incrementing ADR number (`ADR_0001_...`, `ADR_0002_...`).
4. Update the decisions index with:
   - ADR id/title/date/status
   - link to the ADR file
5. If the ADR creates follow-up work, create a change request and decompose into tasks.

## Task Sizing Rules

- The ADR itself should be short (1–2 pages max).
- Separate “decision capture” from “implementation”: ADR first, then plan/tasks.

## Example Output Headings

### ADR (`ADR_<nnnn>_<slug>.md`)

- Title
- Status
- Context
- Decision
- Consequences
- Alternatives considered
- Follow-ups

