Continue the SDD pipeline for the active change: $ARGUMENTS

You are the **orchestrator**. Determine the next phase by checking which artifacts exist in `openspec/changes/$ARGUMENTS/`:

| File Present | Phase Complete | Next Phase |
|-------------|---------------|------------|
| `exploration.md` only | Explore | Propose (Advocate) |
| `proposal.md` | Propose | Specs (Scribe) + Design (Architect) in parallel |
| `specs/` + `design.md` | Specs & Design | Tasks (Strategist) |
| `tasks.md` | Tasks | Apply (Builder) |
| Code changes + `[x]` in tasks.md | Apply | Verify (Sentinel) |
| `verify-report.md` | Verify | Archive (Archivist) |

1. Read `openspec/config.yaml` for project context.
2. Check which artifacts exist to determine the current state.
3. Delegate to the next sub-agent in the DAG, passing:
   - Their role file path
   - Their core skill paths
   - All existing artifact paths for context
   - The change name: `$ARGUMENTS`
4. Present the result and ask whether to continue to the next phase.
