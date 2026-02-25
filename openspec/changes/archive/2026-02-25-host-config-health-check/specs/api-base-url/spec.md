# Spec: api-base-url

---

## Overview

The API base URL domain governs how the frontend application resolves the base URL used for all API communication (HTTP requests and SSE connections). The system MUST support a runtime-configurable API base URL that can be set by the user before entering online mode, while maintaining full backward compatibility with the compile-time environment variable as the default. A centralized provider MUST serve as the single source of truth for base URL resolution, replacing all direct reads of the environment variable in infrastructure modules.

---

## Requirements

### Host Configuration State

**REQ-STATE-1** -- The system MUST maintain a runtime-mutable store holding the current API host URL value.

**REQ-STATE-2** -- The store MUST be initialized with `import.meta.env.VITE_API_HOST ?? ''`. An empty string represents proxy mode (Vite dev proxy at `/api`). A non-empty value is a host origin like `http://localhost:3001`.

**REQ-STATE-3** -- The store MUST expose a setter that allows updating the API host URL value at runtime.

**REQ-STATE-4** -- The store MUST be session-scoped (not persisted across page reloads), consistent with the existing state management pattern in the application.

### Base URL Provider

**REQ-PROV-1** -- The system MUST provide a centralized function for resolving the effective API base URL.

**REQ-PROV-2** -- When the host configuration store holds a non-empty value, the provider MUST return that value directly (the host origin, with no `/api` suffix appended). Backend routes are at root level (`/health`, `/universes`), not under `/api`.

**REQ-PROV-3** -- When the host configuration store holds an empty string (proxy mode), the provider MUST return `'/api'`, so that requests go through the Vite dev proxy.

**REQ-PROV-4** -- The provider MUST normalize the returned URL by stripping any trailing slash, so that consumers can safely append path segments.

### Infrastructure Integration

**REQ-INFRA-1** -- All existing infrastructure modules that resolve the API base URL MUST be updated to use the centralized provider function instead of reading the environment variable directly.

**REQ-INFRA-2** -- The HTTP API client MUST resolve the base URL from the provider on each request, ensuring that runtime changes to the host value are reflected in subsequent API calls.

**REQ-INFRA-3** -- The SSE connection module MUST resolve the base URL from the provider when establishing a new connection.

**REQ-INFRA-4** -- When no user override has been applied, the behavior of all infrastructure modules MUST be identical to their behavior before this change (no regression in the default path).

---

## Scenarios

### Scenario STATE-1 (REQ-STATE-1, REQ-STATE-2): Store initializes with environment variable

**Given** the compile-time environment variable `VITE_API_HOST` is set to `http://myserver:3001`
**When** the host configuration store is initialized
**Then** the store holds the value `http://myserver:3001`.

### Scenario STATE-2 (REQ-STATE-2): Store defaults when environment variable is absent

**Given** the compile-time environment variable `VITE_API_HOST` is not set
**When** the host configuration store is initialized
**Then** the store holds an empty string `''` (proxy mode).

### Scenario STATE-3 (REQ-STATE-3): Store value can be updated at runtime

**Given** the host configuration store holds the value `''` (proxy mode)
**When** the setter is called with `http://192.168.1.50:3001`
**Then** the store holds the value `http://192.168.1.50:3001`.

### Scenario STATE-4 (REQ-STATE-4): Store is not persisted across reloads

**Given** the user has set the host configuration store to `http://custom-host:3001`
**When** the page is reloaded
**Then** the host configuration store is re-initialized with the compile-time environment variable value
**And** the custom value is no longer present.

### Scenario PROV-1 (REQ-PROV-1, REQ-PROV-2): Provider returns host directly when set

**Given** the host configuration store holds `http://myserver:3001`
**When** the provider function is called
**Then** the returned value is `http://myserver:3001` (no `/api` suffix appended).

### Scenario PROV-2 (REQ-PROV-3): Provider returns /api in proxy mode

**Given** the host configuration store holds `''` (empty string, proxy mode)
**When** the provider function is called
**Then** the returned value is `/api`.

### Scenario PROV-3 (REQ-PROV-4): Provider strips trailing slash

**Given** the host configuration store holds `http://myserver:3001/`
**When** the provider function is called
**Then** the returned value is `http://myserver:3001` (no trailing slash).

### Scenario INFRA-1 (REQ-INFRA-1, REQ-INFRA-2): HTTP client uses provider for base URL

**Given** the host configuration store has been updated to `http://remote-host:3001`
**When** the HTTP API client makes a request to the universe endpoint
**Then** the request URL is prefixed with `http://remote-host:3001`.

### Scenario INFRA-2 (REQ-INFRA-1, REQ-INFRA-3): SSE module uses provider for connection URL

**Given** the host configuration store has been updated to `http://remote-host:3001`
**When** the SSE module establishes a new connection
**Then** the connection URL is prefixed with `http://remote-host:3001`.

### Scenario INFRA-3 (REQ-INFRA-4): Default behavior unchanged when no override is set

**Given** the host configuration store retains its initial value (empty string, proxy mode)
**And** no user override has been applied
**When** the HTTP API client makes a request
**Then** the request URL is prefixed with `/api`
**And** the behavior is identical to the application's behavior before this change (Vite proxy forwards to backend).

### Scenario INFRA-4 (REQ-INFRA-2): HTTP client reflects runtime host changes

**Given** the HTTP API client previously made requests to `/api` (proxy mode)
**When** the host configuration store is updated to `http://new-server:3001`
**And** the HTTP API client makes a subsequent request
**Then** the subsequent request URL is prefixed with `http://new-server:3001` (no `/api` suffix)
**And** no application restart or module reinitialization is required.
