# Agents Orchestrator Refactor — Archive Summary

**Date**: 2026-02-20
**Status**: Archived (legacy docs migration)

## What

Refactored the agent system to introduce an Orchestrator routing layer in `.agents/agents.md`, added a Product Owner role, and split execution into direct roles (Developer, Curator) vs task-execution roles (Task Developer, Task Curator) for deterministic request routing.

## Key Decisions

- `.agents/agents.md` becomes the Orchestrator entry point with deterministic routing rules
- Five-role model: Product Owner, Developer, Task Developer, Curator of Order, Task Curator of Order
- Product Owner only generates CR/PLAN/TASK artifacts — never implements or verifies
- Task-execution roles are constrained to executing PO-generated task prompts
- Direct roles (Developer, Curator) handle small, clearly-scoped requests
- Routing uses triage size classification (small/medium/large) with tie-breaker and stop-and-ask conditions

## Tasks Completed

1. Added Orchestrator / Role Routing section to `.agents/agents.md` with deterministic rules
2. Created Product Owner, Task Developer, and Task Curator roles; refactored Developer role scope
3. Updated runbooks and indexes to reflect orchestrator model and expanded role catalog

## Related Artifacts (removed)

- docs/requests/CR_agents_orchestrator_refactor.md
- docs/plans/PLAN_agents_orchestrator_refactor.md
- docs/prompts/agents_orchestrator_refactor/ (3 tasks)
