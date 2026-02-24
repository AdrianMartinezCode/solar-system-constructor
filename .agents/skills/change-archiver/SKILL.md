---
name: change-archiver
description: Merge delta specs into main specs and archive completed changes to openspec/changes/archive/ with ISO date prefix.
metadata:
  owner: Archivist
  version: "0.1.0"
---
# Change Archiver

## Purpose

Finalize a completed SDD change by merging delta specifications into the main spec store and moving the change folder to the archive. Ensures the spec baseline stays current and provides a permanent audit trail.

## When to Use This Skill

- When acting as the Archivist sub-agent for the Archive phase.
- When `/flow:archive` is invoked for a named change.
- When verification has passed (no CRITICAL issues) and the change is ready to close.

## Inputs

- Change name (kebab-case)
- `openspec/changes/<change-name>/verify-report.md` (MUST read first)
- `openspec/changes/<change-name>/proposal.md`
- `openspec/changes/<change-name>/specs/` (delta specs with ADDED/MODIFIED/REMOVED sections)
- `openspec/changes/<change-name>/design.md`
- `openspec/changes/<change-name>/tasks.md`
- `openspec/specs/{domain}/spec.md` (main specs to merge into)
- `openspec/config.yaml` (for rules.archive)

## Outputs

- Updated `openspec/specs/{domain}/spec.md` (merged requirements)
- Archived folder: `openspec/changes/archive/YYYY-MM-DD-<change-name>/`
- Original `openspec/changes/<change-name>/` removed (contents moved to archive)

## Algorithm / Steps

1. **Read verify-report.md first**:
   - If verdict is FAIL or any CRITICAL issues exist → STOP. Return failed status. Do NOT archive.
   - If PASS or PASS_WITH_WARNINGS → proceed.
2. **Load config**: Read `openspec/config.yaml` for `rules.archive` and conventions.
3. **Read full change folder**:
   - proposal.md, specs/, design.md, tasks.md
   - Identify which domains are affected by delta specs
4. **For each delta spec** in `openspec/changes/<change-name>/specs/`:
   - Parse ADDED, MODIFIED, REMOVED sections
   - Locate the corresponding main spec: `openspec/specs/{domain}/spec.md`
   - If main spec does not exist for a domain, create the domain folder and spec file
5. **Merge logic**:
   - **ADDED**: Append new requirements to the main spec. Preserve structure (e.g., RFC 2119 format, scenario blocks).
   - **MODIFIED**: Find the requirement in the main spec by identifier or text match; replace with the new content.
   - **REMOVED**: Find and delete the requirement from the main spec. **Warn the user** — destructive merge.
   - **Preserve**: Requirements not mentioned in the delta remain unchanged.
6. **Write updated main specs** to disk.
7. **Create archive folder**: `openspec/changes/archive/YYYY-MM-DD-<change-name>/` using today's date in ISO format (YYYY-MM-DD).
8. **Move change folder**: Move entire `openspec/changes/<change-name>/` contents to the archive folder. Remove the original folder.
9. **Never modify archived content** after move — archive is immutable.
10. **Return artifacts**: List paths to updated specs and the archive folder.

## Task Sizing Rules

- Archival is a single-phase activity — one change per invocation.
- If CRITICAL issues exist, do not proceed. Return immediately.
- Delta spec merge should be deterministic: same delta → same result.

## Example Output Headings

### Merge summary (for detailed_report)

- Domains merged: (list)
- ADDED requirements: (count per domain)
- MODIFIED requirements: (count per domain)
- REMOVED requirements: (count per domain) — with warning if any
- Archive path: `openspec/changes/archive/YYYY-MM-DD-<change-name>/`

### Delta spec format (reference)

Delta specs use these sections:

- **ADDED**: New requirements to append
- **MODIFIED**: Requirements to replace (include identifier or anchor)
- **REMOVED**: Requirements to delete (include identifier or anchor)

Requirements not in ADDED/MODIFIED/REMOVED are preserved in the main spec.
