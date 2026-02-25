# Spec: host-config-ui

---

## Overview

The host configuration UI domain governs the user-facing controls on the mode selection screen that allow configuring the API server address and observing server health before entering online mode. The mode selection screen MUST present a host input field pre-filled with the current API base URL and a health-check semaphore indicator that communicates server reachability using a tri-state color system (green, yellow, red). When a health check fails, the user MUST be able to inspect error details through a dismissible overlay without leaving the screen.

---

## Requirements

### Host Input

**REQ-HOST-1** -- The mode selection screen MUST display a text input field for the API host URL.

**REQ-HOST-2** -- The host input MUST show a placeholder of `http://localhost:3001` (the typical direct-connect host origin). The input value defaults to `import.meta.env.VITE_API_HOST ?? ''` — an empty string represents proxy mode.

**REQ-HOST-3** -- The user MUST be able to edit the host input value before selecting a mode.

**REQ-HOST-4** -- The host input MUST accept any valid host origin string (e.g., `http://localhost:3001`, `https://myserver.example.com:3001`). An empty value means proxy mode (`/api`).

**REQ-HOST-5** -- When the user edits the host input, the updated value MUST become the effective API base URL used by the application upon entering online mode.

### Health-Check Mechanism

**REQ-HEALTH-1** -- The system MUST perform a health check by issuing a GET request to the `/health` path appended to the current host value.

**REQ-HEALTH-2** -- The health check MUST run automatically when the mode selection screen is displayed (on mount).

**REQ-HEALTH-3** -- The health check MUST re-run when the user changes the host URL value. Re-runs SHOULD be debounced to avoid excessive network requests during active typing.

**REQ-HEALTH-4** -- A health check MUST be considered successful only when the response has an HTTP 200 status code AND the response body is valid JSON containing an `ok` property with a truthy value.

**REQ-HEALTH-5** -- A health check MUST be considered failed when any of the following occurs: network error, non-200 HTTP status code, response body is not valid JSON, response JSON does not contain a truthy `ok` property, or the request exceeds a reasonable timeout.

**REQ-HEALTH-6** -- The health-check mechanism MUST handle proxy gateway errors (e.g., HTTP 502, 504) as failures, not as successful responses.

### Semaphore Indicator

**REQ-SEM-1** -- The mode selection screen MUST display a semaphore indicator adjacent to the host input that reflects the current health-check status.

**REQ-SEM-2** -- The semaphore MUST display a **yellow** state while a health check request is in flight (checking).

**REQ-SEM-3** -- The semaphore MUST display a **green** state when the most recent health check succeeded.

**REQ-SEM-4** -- The semaphore MUST display a **red** state when the most recent health check failed.

**REQ-SEM-5** -- When the user edits the host input and triggers a new health check, the semaphore MUST transition to the yellow (checking) state, replacing any previous green or red state.

### Error Detail Overlay

**REQ-ERR-1** -- When the semaphore is in the red state, the system MUST display a "View Error" affordance (e.g., a button or link).

**REQ-ERR-2** -- The "View Error" affordance MUST NOT be visible when the semaphore is in the green or yellow state.

**REQ-ERR-3** -- Activating the "View Error" affordance MUST display an overlay containing the error message from the failed health check.

**REQ-ERR-4** -- The error overlay MUST be dismissible by the user.

**REQ-ERR-5** -- The error overlay MUST follow the application's dark-theme visual style.

**REQ-ERR-6** -- The error overlay MUST NOT obstruct the mode selection cards or prevent the user from selecting a mode.

### Online Mode Gating

**REQ-GATE-1** -- The Online mode card MUST be disabled (non-clickable, `disabled` attribute) when the health-check status is not `'healthy'`.

**REQ-GATE-2** -- When disabled, the Online mode card MUST have a `mode-card-disabled` CSS class applying `opacity: 0.4` and `cursor: not-allowed`, with hover and active effects suppressed via `:not(:disabled)`.

**REQ-GATE-3** -- The Offline mode card MUST remain always enabled regardless of health-check status.

**REQ-GATE-4** -- When the health-check status transitions to `'healthy'` (green), the Online mode card MUST become enabled.

---

## Scenarios

### Scenario HOST-1 (REQ-HOST-1, REQ-HOST-2): Host input is displayed with placeholder

**Given** the mode selection screen is rendered
**When** the screen finishes loading
**Then** a text input field is visible in the server configuration section
**And** the input has placeholder text `http://localhost:3001`
**And** the input value is empty by default (proxy mode).

### Scenario HOST-2 (REQ-HOST-3, REQ-HOST-5): User edits the host input

**Given** the mode selection screen is displayed with the host input empty (proxy mode)
**When** the user types `http://192.168.1.50:3001`
**Then** the input displays `http://192.168.1.50:3001`
**And** the updated value becomes the effective API host origin for online mode.

### Scenario HOST-3 (REQ-HOST-4): Host input accepts host origins

**Given** the mode selection screen is displayed
**When** the user enters `http://localhost:3001`
**Then** the value is accepted without validation error.

**Given** the mode selection screen is displayed
**When** the user enters `https://myserver.example.com:3001`
**Then** the value is accepted without validation error.

**Given** the mode selection screen is displayed
**When** the user clears the input (empty string)
**Then** the value is accepted (proxy mode).

### Scenario HEALTH-1 (REQ-HEALTH-1, REQ-HEALTH-2, REQ-HEALTH-4): Health check runs on mount and succeeds

**Given** the API server at the default host URL is running and healthy
**When** the mode selection screen mounts
**Then** a GET request is issued to `{hostValue}/health`
**And** the response returns HTTP 200 with JSON body `{ "ok": true, ... }`
**And** the health check is recorded as successful.

### Scenario HEALTH-2 (REQ-HEALTH-3): Health check re-runs on host change

**Given** the mode selection screen is displayed and a previous health check completed
**When** the user changes the host input value to `http://other-server:3001`
**Then** a new health check is issued to `http://other-server:3001/health` after a debounce interval
**And** any in-flight previous health check is superseded by the new one.

### Scenario HEALTH-3 (REQ-HEALTH-5): Health check fails on network error

**Given** the host input is set to `http://unreachable-host:9999`
**When** the health check runs
**Then** the fetch request produces a network error
**And** the health check is recorded as failed with an appropriate error message.

### Scenario HEALTH-4 (REQ-HEALTH-5): Health check fails on non-200 response

**Given** the host input points to a server that returns HTTP 500 for `/health`
**When** the health check runs
**Then** the health check is recorded as failed
**And** the error message includes the HTTP status code.

### Scenario HEALTH-5 (REQ-HEALTH-6): Health check fails on proxy gateway error

**Given** the host input is set to `/api` and the Vite proxy is running but the backend is down
**When** the health check runs and the proxy returns HTTP 502
**Then** the health check is recorded as failed
**And** the semaphore does not show green.

### Scenario HEALTH-6 (REQ-HEALTH-5): Health check fails on non-JSON response

**Given** the host input points to a server that returns HTTP 200 with a plain text body
**When** the health check runs
**Then** the response JSON parsing fails
**And** the health check is recorded as failed.

### Scenario SEM-1 (REQ-SEM-1, REQ-SEM-2): Semaphore shows yellow while checking

**Given** the mode selection screen is displayed
**When** a health check request is in flight
**Then** the semaphore indicator displays a yellow state.

### Scenario SEM-2 (REQ-SEM-3): Semaphore turns green on success

**Given** a health check request is in flight (semaphore is yellow)
**When** the health check succeeds (HTTP 200, JSON `{ ok: true }`)
**Then** the semaphore transitions to a green state.

### Scenario SEM-3 (REQ-SEM-4): Semaphore turns red on failure

**Given** a health check request is in flight (semaphore is yellow)
**When** the health check fails (network error, non-200, or invalid JSON)
**Then** the semaphore transitions to a red state.

### Scenario SEM-4 (REQ-SEM-5): Semaphore resets to yellow on re-check

**Given** the semaphore is currently green (previous check succeeded)
**When** the user changes the host input value
**Then** the semaphore transitions to yellow while the new health check runs.

### Scenario ERR-1 (REQ-ERR-1, REQ-ERR-2): View Error button appears only on red

**Given** the semaphore is in the red state after a failed health check
**Then** a "View Error" affordance is visible near the semaphore.

**Given** the semaphore is in the green state
**Then** no "View Error" affordance is visible.

**Given** the semaphore is in the yellow state
**Then** no "View Error" affordance is visible.

### Scenario ERR-2 (REQ-ERR-3): Error overlay shows error message

**Given** the semaphore is red and the "View Error" affordance is visible
**When** the user activates the "View Error" affordance
**Then** an overlay appears displaying the error message from the failed health check.

### Scenario ERR-3 (REQ-ERR-4): Error overlay can be dismissed

**Given** the error overlay is visible
**When** the user dismisses the overlay (e.g., clicks a close or dismiss control)
**Then** the overlay is no longer visible.

### Scenario ERR-4 (REQ-ERR-5): Error overlay uses dark theme

**Given** the error overlay is displayed after a failed health check
**When** the user views the overlay
**Then** the overlay's visual appearance (background, text color, borders) is consistent with the application's dark-theme styling.

### Scenario ERR-5 (REQ-ERR-6): Error overlay does not block mode selection

**Given** the error overlay is visible
**When** the user attempts to select a mode card (online or offline)
**Then** the mode selection is not blocked by the overlay.

### Scenario GATE-1 (REQ-GATE-1, REQ-GATE-2): Online card is disabled when health is not green

**Given** the semaphore is in the red state (health check failed)
**Then** the Online mode card has the `disabled` attribute and `mode-card-disabled` class
**And** the card appears dimmed (`opacity: 0.4`) with `cursor: not-allowed`
**And** hover and active effects are suppressed.

### Scenario GATE-2 (REQ-GATE-4): Online card becomes enabled when health turns green

**Given** the semaphore transitions from red/yellow to green (healthy)
**Then** the Online mode card loses the `disabled` attribute and `mode-card-disabled` class
**And** the user can click the Online card to enter online mode.

### Scenario GATE-3 (REQ-GATE-3): Offline card is always enabled

**Given** the semaphore is in any state (green, yellow, or red)
**When** the user selects the Offline mode card
**Then** the application enters offline mode normally.
