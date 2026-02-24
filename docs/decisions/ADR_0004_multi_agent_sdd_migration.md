# ADR: Multi-Agent Spec-Driven Development Migration

- **Status**: accepted
- **Date**: 2026-02-24
- **Decision owners**: Product Owner (planned), Orchestrator (implementing)
- **Related**:
  - `.agents/agents.md` (current orchestrator)
  - `openspec/config.yaml` (new artifact store)

## Context

The repository uses a single-agent role-routing pattern: one agent reads `.agents/agents.md`, selects a role, and executes everything inline within a single context window. For large features this causes context bloat—the agent must hold planning artifacts, codebase analysis, specifications, and implementation details simultaneously, leading to compression, lost details, and hallucinations.

The agent-teams-lite project (github.com/Gentleman-Programming/agent-teams-lite) demonstrates a proven alternative: a delegate-only orchestrator that spawns fresh-context sub-agents for each phase of work, connected by a dependency graph (DAG). Each sub-agent receives focused instructions, executes one phase, and returns a structured result.

## Decision

Adopt a **multi-agentic Spec-Driven Development (SDD)** workflow:

1. **Delegate-only orchestrator**: `.agents/agents.md` becomes a lightweight coordinator that never executes phase work directly. It delegates to sub-agents via Cursor's `Task` tool, tracks DAG state, and synthesizes summaries between phases.

2. **Phase-specialized sub-agents** (roles under `.agents/roles/`):

   | Role | Phase | Produces |
   |---|---|---|
   | Founder | Init | `openspec/` bootstrap |
   | Scout | Explore | `exploration.md` (optional) |
   | Advocate | Propose | `proposal.md` |
   | Scribe | Spec | `specs/{domain}/spec.md` (delta) |
   | Architect | Design | `design.md` |
   | Strategist | Tasks | `tasks.md` |
   | Builder | Apply | Code changes + task checkoffs |
   | Sentinel | Verify | `verify-report.md` |
   | Archivist | Archive | Merged specs + archived change |
   | Curator | Curation | Repo organization (standalone or delegated) |

3. **openspec as sole persistence**: All workflow artifacts live in `openspec/`. The `docs/` hierarchy continues for general documentation and ADRs but is deprecated for workflow artifacts (CRs, plans, task prompts).

4. **Role merges**:
   - Developer + Task Developer → **Builder** (single implementation agent)
   - Curator of Order + Task Curator of Order → **Curator** (single curation agent)
   - Product Owner → decomposed into Scout, Advocate, Scribe, Architect, Strategist

5. **Structured result contract**: Every sub-agent returns a JSON envelope with `status`, `executive_summary`, `artifacts`, `next_recommended`, and `risks`.

6. **DAG-based phase orchestration**: `exploration? → proposal → specs ∥ design → tasks → apply → verify → archive`.

### Key choices

- **openspec-only persistence** (no engram, no ephemeral mode): Simplifies the system to a single, file-based, inspectable artifact store. Trade-off: every change produces files. Accepted because auditability and human review are priorities.
- **Fresh context per sub-agent**: Each sub-agent starts clean, reads only its role file and relevant artifacts. Prevents context window exhaustion on long feature arcs.
- **Specs ∥ design parallelism**: Scribe and Architect can run concurrently after proposal, improving throughput.
- **Command prefix `/flow:`**: Distinguishes SDD commands from other interactions. Avoids collision with any future tool-level commands.

## Consequences

**Positive:**
- Sub-agents get focused context → better output quality, fewer hallucinations.
- Orchestrator stays lightweight → can handle longer feature development sessions.
- openspec artifacts are inspectable, diffable, and version-controlled.
- Clear phase boundaries with approval gates → safer incremental delivery.
- Role merges reduce routing confusion (5 roles → effectively 4 active paths).

**Negative:**
- More files in `.agents/roles/` and `.agents/skills/` to maintain.
- Sub-agent spawning adds latency compared to inline execution.
- Existing `docs/requests/`, `docs/plans/`, `docs/prompts/` conventions are deprecated (old artifacts stay as historical record).
- Team must learn new `/flow:*` commands.

## Alternatives Considered

- **Keep single-agent routing, just add more skills** — rejected: does not solve context window exhaustion on large features.
- **Use engram (memory-based) persistence** — rejected: adds external dependency; file-based openspec is sufficient and more transparent.
- **Adopt agent-teams-lite as-is** — rejected: naming and structure don't match project conventions; we adapt the pattern, not the implementation.
- **Keep separate Developer/Task Developer roles** — rejected: the distinction adds routing complexity without meaningful specialization benefit.

## Follow-ups

- Execute Epics 1–6 of the Multi-Agent SDD Migration plan.
- Write initial `openspec/specs/` for existing system domains after migration is complete.
- Consider adding a `/flow:status` command for pipeline introspection.
