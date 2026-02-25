# Spec: docs-organization

_Domain: `docs-organization`_
_Change: `repo-presentation`_
_Date: 2026-02-25_
_Format: Full (new domain)_

---

## Overview

Defines the requirements for the organization and integrity of documentation files within the repository. This covers: (a) relocating root-level documentation files to their correct positions within the `docs/` taxonomy, (b) ensuring the documentation index (`docs/README.md`) accurately reflects all documentation files, (c) ensuring all internal documentation links across the repository resolve correctly, and (d) cleaning up relocated file content.

---

## Requirements

### File Relocation

**REQ-DOCS-1**: The file `QUICKSTART.md` MUST NOT exist at the repository root. Its content MUST reside at `docs/guides/QUICKSTART.md`.

**REQ-DOCS-2**: The file `TROUBLESHOOTING.md` MUST NOT exist at the repository root. Its content MUST reside at `docs/guides/TROUBLESHOOTING.md`.

**REQ-DOCS-3**: The file `docs/mcp-server-usage.md` MUST NOT exist at `docs/mcp-server-usage.md` (the docs root level, outside taxonomy folders). Its content MUST reside at `docs/guides/mcp-server-usage.md`.

### Content Cleanup

**REQ-DOCS-4**: The relocated `docs/guides/QUICKSTART.md` MUST be written entirely in English. Any Spanish-language content (including roadmap items) present in the original `QUICKSTART.md` MUST be removed or translated to English during relocation.

**REQ-DOCS-5**: The relocated `docs/guides/QUICKSTART.md` MUST NOT contain hardcoded local file paths that are specific to a single developer's environment. Paths MUST be relative to the repository root or use generic placeholders.

**REQ-DOCS-6**: The relocated `docs/guides/TROUBLESHOOTING.md` MUST preserve its existing troubleshooting content. Any internal links within the file MUST be updated to reflect the file's new location.

**REQ-DOCS-7**: The relocated `docs/guides/mcp-server-usage.md` MUST preserve its existing content. Any internal links or self-references within the file MUST be updated to reflect the file's new location.

### Documentation Index

**REQ-DOCS-8**: The documentation index file (`docs/README.md`) MUST include entries for all three relocated files:

- `docs/guides/QUICKSTART.md`
- `docs/guides/TROUBLESHOOTING.md`
- `docs/guides/mcp-server-usage.md`

**REQ-DOCS-9**: Every file listed in `docs/README.md` MUST exist at the referenced path. The index MUST NOT contain entries pointing to files that do not exist.

### Link Integrity

**REQ-DOCS-10**: All internal links in the repository's `README.md` MUST resolve to existing files. Specifically, any links that previously referenced pre-migration paths (such as root-level `KEYBOARD_SHORTCUTS.md`, `docs/BODY_POV_CAMERA.md`, or `docs/GROUP_ISOLATION_FEATURE.md`) MUST be updated to their current correct paths under the `docs/` taxonomy.

**REQ-DOCS-11**: All internal links within relocated documentation files MUST be updated to account for their new directory position. Relative paths MUST be recalculated from the file's new location.

**REQ-DOCS-12**: Any references to `docs/mcp-server-usage.md` elsewhere in the repository (including in application source content files that surface documentation paths) MUST be updated to reference `docs/guides/mcp-server-usage.md`.

### Non-Modification Constraints

**REQ-DOCS-13**: No application source code files (frontend, backend, or shared packages) SHALL be modified for the purpose of this change, except where a source file contains a hardcoded documentation path string that references a relocated file (per REQ-DOCS-12).

---

## Scenarios

### Scenario 1 (REQ-DOCS-1): QUICKSTART.md relocated from root

- **Given** the change has been applied
- **When** the repository root directory is listed
- **Then** no file named `QUICKSTART.md` exists at the root
- **And** the file `docs/guides/QUICKSTART.md` exists and contains quick-start instructions

### Scenario 2 (REQ-DOCS-2): TROUBLESHOOTING.md relocated from root

- **Given** the change has been applied
- **When** the repository root directory is listed
- **Then** no file named `TROUBLESHOOTING.md` exists at the root
- **And** the file `docs/guides/TROUBLESHOOTING.md` exists and contains troubleshooting content

### Scenario 3 (REQ-DOCS-3): mcp-server-usage.md relocated to guides

- **Given** the change has been applied
- **When** the `docs/` directory is listed
- **Then** no file named `mcp-server-usage.md` exists at `docs/mcp-server-usage.md`
- **And** the file `docs/guides/mcp-server-usage.md` exists and contains MCP usage documentation

### Scenario 4 (REQ-DOCS-4): Spanish content removed from QUICKSTART

- **Given** the relocated `docs/guides/QUICKSTART.md` is opened
- **When** its full text is reviewed
- **Then** all content is in English with no Spanish-language text present

### Scenario 5 (REQ-DOCS-5): No hardcoded local paths in QUICKSTART

- **Given** the relocated `docs/guides/QUICKSTART.md` is opened
- **When** its content is searched for absolute local file paths (e.g., `/Users/`, `/home/`, `C:\`)
- **Then** no hardcoded local paths are found

### Scenario 6 (REQ-DOCS-6): TROUBLESHOOTING internal links updated

- **Given** the `docs/guides/TROUBLESHOOTING.md` file has been relocated
- **When** each internal link within the file is followed
- **Then** every link resolves to an existing file at the correct relative path from the file's new location

### Scenario 7 (REQ-DOCS-7): mcp-server-usage internal links updated

- **Given** the `docs/guides/mcp-server-usage.md` file has been relocated
- **When** each internal link within the file is followed
- **Then** every link resolves to an existing file at the correct relative path from the file's new location

### Scenario 8 (REQ-DOCS-8): Documentation index includes relocated files

- **Given** the `docs/README.md` file is opened
- **When** its content is reviewed
- **Then** it contains entries (with correct paths) for `docs/guides/QUICKSTART.md`, `docs/guides/TROUBLESHOOTING.md`, and `docs/guides/mcp-server-usage.md`

### Scenario 9 (REQ-DOCS-9): Documentation index has no dead entries

- **Given** the `docs/README.md` file lists documentation paths
- **When** each referenced path is checked against the file system
- **Then** every referenced file exists at the listed path

### Scenario 10 (REQ-DOCS-10): README broken links fixed

- **Given** the repository `README.md` has been rewritten
- **When** each internal documentation link is followed
- **Then** every link resolves to an existing file (specifically, links to keyboard shortcuts, body POV camera, and group isolation feature point to their current locations under `docs/`)

### Scenario 11 (REQ-DOCS-11): Relocated file links recalculated

- **Given** a documentation file has been moved to a new directory
- **When** any relative link in that file is followed from its new location
- **Then** the link resolves to the intended target file

### Scenario 12 (REQ-DOCS-12): MCP docs path references updated globally

- **Given** the MCP usage guide has moved from `docs/mcp-server-usage.md` to `docs/guides/mcp-server-usage.md`
- **When** a repository-wide search is performed for the old path `docs/mcp-server-usage.md`
- **Then** zero occurrences of the old path are found (all references have been updated)

### Scenario 13 (REQ-DOCS-13): No unrelated source code modifications

- **Given** the change has been applied
- **When** the git diff is reviewed
- **Then** no application source code files are modified except where a file contains a hardcoded documentation path string that required updating
