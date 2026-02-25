# Spec: topbar-ui

---

## Overview

The top bar UI domain governs the application header's contextual display behavior. When the user is editing a universe in online mode, the top bar MUST display the universe name as the primary title and MUST surface the universe identifier with a copy-to-clipboard affordance. When no universe is active (offline mode or lobby), the top bar MUST display the default application title and MUST NOT display universe-specific elements.

---

## Requirements

### Contextual Title Display

**REQ-TITLE-1** -- When the user is editing a universe in online mode, the top bar MUST display the universe name as the primary center title, replacing the default application title.

**REQ-TITLE-2** -- When no universe is active (offline mode, lobby screen, or universe name unavailable), the top bar MUST display the default application title ("Nested Solar System Constructor").

**REQ-TITLE-3** -- The universe name display MUST handle long names gracefully. The title MUST be visually truncated with an ellipsis indicator when the name exceeds the available display width.

**REQ-TITLE-4** -- The universe name previously displayed in the left section of the header SHOULD be removed or repurposed to avoid duplicate display of the same information.

### Universe Identifier Display

**REQ-ID-1** -- When the user is editing a universe in online mode, the top bar MUST display the universe identifier.

**REQ-ID-2** -- The displayed universe identifier SHOULD be visually truncated (e.g., showing only a leading portion) to conserve horizontal space while remaining recognizable.

**REQ-ID-3** -- When no universe is active (offline mode or lobby), the top bar MUST NOT display a universe identifier element.

### Copy-to-Clipboard

**REQ-COPY-1** -- The top bar MUST provide a copy button adjacent to the displayed universe identifier. Activating this button MUST copy the full, untruncated universe identifier to the user's system clipboard.

**REQ-COPY-2** -- After a successful copy action, the system MUST provide brief visual feedback indicating the copy succeeded (e.g., a "Copied!" label or tooltip). The feedback MUST be temporary and auto-dismiss.

**REQ-COPY-3** -- If the clipboard write operation fails (e.g., due to browser permissions), the system MUST handle the failure gracefully without crashing. The system SHOULD provide visual feedback indicating the copy failed.

---

## Scenarios

### Scenario TITLE-1 (REQ-TITLE-1): Universe name shown as title in online mode

**Given** the user is editing a universe named "Alpha Centauri System" in online mode
**When** the top bar renders
**Then** the center title area displays "Alpha Centauri System" instead of the default application title.

### Scenario TITLE-2 (REQ-TITLE-2): Default title shown when no universe is active

**Given** the user is on the lobby screen (no universe loaded)
**When** the top bar renders
**Then** the center title area displays "Nested Solar System Constructor".

### Scenario TITLE-3 (REQ-TITLE-2): Default title shown in offline mode

**Given** the user is operating in offline mode
**When** the top bar renders
**Then** the center title area displays "Nested Solar System Constructor"
**And** no universe-specific elements are displayed.

### Scenario TITLE-4 (REQ-TITLE-3): Long universe name is truncated

**Given** the user is editing a universe with a name exceeding the available title width (e.g., "My Extremely Long Universe Name That Exceeds Display Bounds")
**When** the top bar renders
**Then** the title is visually truncated with an ellipsis indicator
**And** no layout overflow or broken formatting occurs in the header.

### Scenario TITLE-5 (REQ-TITLE-4): No duplicate universe name display

**Given** the user is editing a universe in online mode
**When** the top bar renders with the universe name as the center title
**Then** the universe name does not appear a second time in the left section of the header.

### Scenario ID-1 (REQ-ID-1, REQ-ID-2): Universe identifier displayed in online mode

**Given** the user is editing a universe with identifier "a1b2c3d4-e5f6-7890-abcd-ef1234567890" in online mode
**When** the top bar renders
**Then** a universe identifier element is visible in the top bar
**And** the displayed text is a truncated representation of the full identifier.

### Scenario ID-2 (REQ-ID-3): Universe identifier hidden when no universe is active

**Given** the user is on the lobby screen (no universe loaded)
**When** the top bar renders
**Then** no universe identifier element is visible in the top bar.

### Scenario COPY-1 (REQ-COPY-1): Copy button copies full identifier

**Given** the user is editing a universe with identifier "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
**And** the universe identifier and copy button are visible in the top bar
**When** the user activates the copy button
**Then** the full string "a1b2c3d4-e5f6-7890-abcd-ef1234567890" is written to the system clipboard.

### Scenario COPY-2 (REQ-COPY-2): Visual feedback after successful copy

**Given** the user is editing a universe in online mode
**And** the copy button is visible
**When** the user activates the copy button and the clipboard write succeeds
**Then** a brief visual confirmation (e.g., "Copied!" text) appears near the copy button
**And** the confirmation auto-dismisses after a short interval without user interaction.

### Scenario COPY-3 (REQ-COPY-3): Graceful handling of clipboard failure

**Given** the user is editing a universe in online mode
**And** the browser denies clipboard write permission
**When** the user activates the copy button
**Then** the application does not crash or display an unhandled error
**And** visual feedback indicates the copy operation did not succeed.
