# Spec: repo-licensing

_Domain: `repo-licensing`_
_Change: `repo-presentation`_
_Date: 2026-02-25_
_Format: Full (new domain)_

---

## Overview

Defines the requirements for the repository's license file. The project's README has historically stated an MIT license, but no `LICENSE` file exists at the repository root. This spec ensures the license claim is backed by a valid, machine-readable license file that meets GitHub's recognition criteria and standard open-source conventions.

---

## Requirements

### License File Existence

**REQ-LIC-1**: A file named `LICENSE` (no extension) MUST exist at the repository root.

**REQ-LIC-2**: The `LICENSE` file MUST NOT be placed in a subdirectory. It MUST reside at the top level of the repository so that GitHub and other platforms automatically detect and display it.

### License Content

**REQ-LIC-3**: The `LICENSE` file MUST contain the full text of the MIT License as published by the Open Source Initiative.

**REQ-LIC-4**: The copyright line in the `LICENSE` file MUST include the current year (2026) or an appropriate year range.

**REQ-LIC-5**: The copyright line in the `LICENSE` file MUST include the project name or the copyright holder's name.

### Consistency

**REQ-LIC-6**: The license type stated in the repository's `README.md` MUST match the license in the `LICENSE` file (both MUST be MIT).

**REQ-LIC-7**: If the `package.json` at the repository root contains a `license` field, its value MUST be consistent with the `LICENSE` file (i.e., `"MIT"`).

---

## Scenarios

### Scenario 1 (REQ-LIC-1, REQ-LIC-2): LICENSE file exists at root

- **Given** the change has been applied
- **When** the repository root directory is listed
- **Then** a file named `LICENSE` exists at the root (not in a subdirectory)

### Scenario 2 (REQ-LIC-3): LICENSE contains valid MIT text

- **Given** the `LICENSE` file is opened
- **When** its content is compared against the standard MIT License text
- **Then** it contains the complete MIT License text including the permission grant, conditions, and warranty disclaimer

### Scenario 3 (REQ-LIC-4): Copyright year is current

- **Given** the `LICENSE` file is opened
- **When** the copyright line is examined
- **Then** it includes the year 2026 (or a range ending in 2026)

### Scenario 4 (REQ-LIC-5): Copyright holder is identified

- **Given** the `LICENSE` file is opened
- **When** the copyright line is examined
- **Then** it includes the project name or the copyright holder's name (not a placeholder like `[year] [fullname]`)

### Scenario 5 (REQ-LIC-6): README license matches LICENSE file

- **Given** the `README.md` states a license type
- **When** the stated license is compared against the `LICENSE` file
- **Then** both indicate MIT

### Scenario 6 (REQ-LIC-7): package.json license field is consistent

- **Given** the root `package.json` contains a `license` field
- **When** its value is compared against the `LICENSE` file
- **Then** the value is `"MIT"`, consistent with the license file
