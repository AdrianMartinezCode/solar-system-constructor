# Agent Roles (`.agents/roles/`)

Sub-agent roles are specialized personas delegated by the orchestrator (`.agents/agents.md`). Each role receives fresh context via the Task tool, executes one phase of work, and returns a structured result envelope.

## Active Roles (SDD Pipeline)

| Role | File | Phase | Purpose |
|------|------|-------|---------|
| **Founder** | `founder.md` | Init | Bootstrap `openspec/` structure and `config.yaml` |
| **Scout** | `scout.md` | Explore | Investigate codebase, compare approaches |
| **Advocate** | `advocate.md` | Propose | Create structured change proposals |
| **Scribe** | `scribe.md` | Specs | Write delta specifications (RFC 2119 + Given/When/Then) |
| **Architect** | `architect.md` | Design | Create technical design documents |
| **Strategist** | `strategist.md` | Tasks | Break down into phased task checklists |
| **Builder** | `builder.md` | Apply | Implement code (pipeline or direct mode) |
| **Sentinel** | `sentinel.md` | Verify | Validate implementation quality |
| **Archivist** | `archivist.md` | Archive | Merge specs and close changes |
| **Curator** | `curator.md` | Curation | Repo organization (standalone or delegated) |

## Migration Notes

The following legacy roles were removed as part of the SDD migration (see `docs/decisions/ADR_0004_multi_agent_sdd_migration.md`):

- **Product Owner** → decomposed into Scout, Advocate, Scribe, Architect, Strategist
- **Developer** + **Task Developer** → merged into Builder
- **Curator of Order** + **Task Curator of Order** → merged into Curator
