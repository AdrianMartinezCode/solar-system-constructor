# Agent Role: <Role Name>

## Purpose

_1–2 sentences: what this role exists to do._

## When to Use

- _Trigger 1_
- _Trigger 2_

## Responsibilities

- _Responsibility_

## Non-Goals

- _What this role explicitly does not do_

## Inputs

- _Change requests, plans, prompts, repo context, etc._

## Outputs

- _Files created/updated; conventions enforced_

## Guardrails

- Keep diffs small and reversible.
- Prefer additive changes; avoid breaking existing paths.
- Verify with `npm run build` (and `npm run typecheck` if separate).
- Record structural decisions in `docs/decisions/`.

## Default Workflow (PO Lifecycle)

1. Create/refresh a change request in `docs/requests/`.
2. (Optional) Triage → `docs/decisions/TRIAGE_<slug>.md`
3. Decompose → `docs/plans/PLAN_<slug>.md` + `docs/prompts/<slug>/task_<n>/TASK_<n>_<slug>.md`
4. Execute tasks in order, verifying after each task.
5. Capture decisions (ADR) for any cross-cutting or structural change.

