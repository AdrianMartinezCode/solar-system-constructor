# Spec: api-content

> **Change**: mcp-docs-and-tools
> **Domain**: api-content (new)
> **Format**: Full spec

---

## Overview

The API content layer provides two categories of static, developer-authored content as typed module exports: natural-language documentation describing the solar-system universe domain, and machine-readable MCP tool specifications. A barrel module re-exports both for unified access. Content modules are pure data — they carry no framework dependencies and perform no I/O.

---

## Requirements

### Documentation Content

**REQ-DOC-1** — The documentation content module MUST export a single typed object containing a `title` (string), a `version` (string), and a `sections` array.

**REQ-DOC-2** — Each documentation section MUST contain an `id` (string), a `heading` (string), and a `body` (string containing Markdown-formatted text).

**REQ-DOC-3** — Section `id` values MUST be unique within the documentation content.

**REQ-DOC-4** — The documentation content MUST include sections covering at least the following topics:

1. System overview (what the MCP server does and how an AI model uses it)
2. Universe structure (stars, groups, small body fields, protoplanetary disks, nebulae, and the 9 state fields)
3. Commands reference (all 25 command types across their 10 categories)
4. Validation rules (cycle detection for stars and groups, existence checks)
5. Real-time streaming (SSE-based command streaming)

**REQ-DOC-5** — The commands reference section SHOULD enumerate all 25 command types grouped by category, listing each command's name and required parameters.

**REQ-DOC-6** — The validation rules section SHOULD describe the invariants enforced during command application (cycle detection for star and group hierarchies, entity existence checks).

### MCP Tool Specifications

**REQ-TOOL-1** — The MCP tool specifications module MUST export an array of exactly three tool definitions.

**REQ-TOOL-2** — Each tool definition MUST contain the fields `name` (string), `description` (string), `inputSchema` (a valid JSON Schema object), and `annotations` (an object with behavioral hint booleans).

**REQ-TOOL-3** — Tool `annotations` MUST include at minimum the fields `readOnlyHint`, `destructiveHint`, `idempotentHint`, and `openWorldHint`, each as a boolean value.

**REQ-TOOL-4** — The tool array MUST include a tool named `get_universe_state` whose `inputSchema` requires a `universeId` parameter. Its annotations MUST indicate it is read-only and non-destructive.

**REQ-TOOL-5** — The tool array MUST include a tool named `list_universe_commands` whose `inputSchema` requires a `universeId` parameter and MAY accept optional pagination or filtering parameters. Its annotations MUST indicate it is read-only and non-destructive.

**REQ-TOOL-6** — The tool array MUST include a tool named `send_universe_command` whose `inputSchema` requires a `universeId` parameter and a `command` parameter. Its annotations MUST indicate it is NOT read-only and is potentially destructive.

**REQ-TOOL-7** — The `command` parameter schema for `send_universe_command` MUST represent a discriminated union (using `oneOf` with a `type` discriminator) covering all 25 command types defined in the domain:

| Category | Commands |
|---|---|
| Simulation | `tick` |
| Star CRUD | `addStar`, `updateStar`, `removeStar` |
| Star hierarchy | `attachStar`, `detachStar` |
| Group CRUD | `addGroup`, `updateGroup`, `removeGroup` |
| Group hierarchy | `addToGroup`, `removeFromGroup`, `moveToGroup` |
| Small body fields | `setSmallBodyFields`, `updateSmallBodyField`, `removeSmallBodyField` |
| Protoplanetary disks | `setProtoplanetaryDisks`, `addProtoplanetaryDisk`, `updateProtoplanetaryDisk`, `removeProtoplanetaryDisk` |
| Nebulae | `setNebulae`, `updateNebula`, `removeNebula` |
| Rings | `updateRing`, `removeRing` |
| Snapshot | `replaceSnapshot` |

**REQ-TOOL-8** — Each command variant in the discriminated union MUST include a `type` property whose value matches the command name, plus the required parameters for that command type as defined by the domain model.

**REQ-TOOL-9** — Each tool's `inputSchema` MUST be a valid JSON Schema (draft-07 or later) with `type: "object"` at the root level and a `required` array listing mandatory properties.

### Module Structure

**REQ-MOD-1** — A barrel module MUST re-export all public exports from both the documentation content module and the MCP tool specifications module.

**REQ-MOD-2** — Both the documentation content and the MCP tool specifications MUST include a `version` field (string) for freshness tracking.

**REQ-MOD-3** — Content modules MUST NOT import or depend on any HTTP framework, server library, or runtime I/O module. They SHALL export only pure data and type definitions.

**REQ-MOD-4** — All content modules MUST compile without errors under the project's TypeScript configuration.

---

## Scenarios

### Documentation Content

**Scenario DOC-1** (REQ-DOC-1):
- **Given** a consumer imports the documentation content export
- **When** the consumer inspects the export
- **Then** it is an object with a `title` property of type string, a `version` property of type string, and a `sections` property that is an array

**Scenario DOC-2** (REQ-DOC-2):
- **Given** the documentation content has a `sections` array
- **When** the consumer iterates over each section
- **Then** every section has an `id` of type string, a `heading` of type string, and a `body` of type string that contains Markdown text

**Scenario DOC-3** (REQ-DOC-3):
- **Given** the documentation content has a `sections` array with N sections
- **When** the consumer collects all `id` values into a set
- **Then** the set size equals N (no duplicates)

**Scenario DOC-4a** (REQ-DOC-4):
- **Given** the documentation content has a `sections` array
- **When** the consumer searches for a section with a heading or id related to "system overview"
- **Then** exactly one matching section exists and its body is a non-empty Markdown string

**Scenario DOC-4b** (REQ-DOC-4):
- **Given** the documentation content has a `sections` array
- **When** the consumer searches for a section covering universe structure
- **Then** exactly one matching section exists and its body references stars, groups, small body fields, protoplanetary disks, and nebulae

**Scenario DOC-4c** (REQ-DOC-4):
- **Given** the documentation content has a `sections` array
- **When** the consumer searches for a section covering commands
- **Then** exactly one matching section exists and its body references all 10 command categories

**Scenario DOC-4d** (REQ-DOC-4):
- **Given** the documentation content has a `sections` array
- **When** the consumer searches for a section covering validation rules
- **Then** exactly one matching section exists and its body mentions cycle detection and existence checks

**Scenario DOC-4e** (REQ-DOC-4):
- **Given** the documentation content has a `sections` array
- **When** the consumer searches for a section covering real-time streaming
- **Then** exactly one matching section exists and its body describes SSE-based command streaming

**Scenario DOC-5** (REQ-DOC-5):
- **Given** the commands reference section body
- **When** the consumer parses the Markdown content
- **Then** all 25 command names appear, grouped by their 10 categories, each with a description of required parameters

**Scenario DOC-6** (REQ-DOC-6):
- **Given** the validation rules section body
- **When** the consumer reads the content
- **Then** it describes star hierarchy cycle detection, group hierarchy cycle detection, and entity existence validation

### MCP Tool Specifications

**Scenario TOOL-1** (REQ-TOOL-1):
- **Given** a consumer imports the MCP tool specifications export
- **When** the consumer inspects the export
- **Then** it is an array with exactly 3 elements

**Scenario TOOL-2** (REQ-TOOL-2):
- **Given** the MCP tool specifications array
- **When** the consumer inspects any element
- **Then** it has `name` (string), `description` (string), `inputSchema` (object), and `annotations` (object) properties

**Scenario TOOL-3** (REQ-TOOL-3):
- **Given** a tool definition's `annotations` object
- **When** the consumer inspects it
- **Then** it contains `readOnlyHint` (boolean), `destructiveHint` (boolean), `idempotentHint` (boolean), and `openWorldHint` (boolean)

**Scenario TOOL-4a** (REQ-TOOL-4):
- **Given** the MCP tool specifications array
- **When** the consumer searches for a tool with name `get_universe_state`
- **Then** exactly one match is found

**Scenario TOOL-4b** (REQ-TOOL-4):
- **Given** the `get_universe_state` tool's `inputSchema`
- **When** the consumer inspects the `required` array
- **Then** it includes `universeId`

**Scenario TOOL-4c** (REQ-TOOL-4):
- **Given** the `get_universe_state` tool's `annotations`
- **When** the consumer inspects them
- **Then** `readOnlyHint` is `true` and `destructiveHint` is `false`

**Scenario TOOL-5a** (REQ-TOOL-5):
- **Given** the MCP tool specifications array
- **When** the consumer searches for a tool with name `list_universe_commands`
- **Then** exactly one match is found

**Scenario TOOL-5b** (REQ-TOOL-5):
- **Given** the `list_universe_commands` tool's `inputSchema`
- **When** the consumer inspects the `required` array
- **Then** it includes `universeId`

**Scenario TOOL-5c** (REQ-TOOL-5):
- **Given** the `list_universe_commands` tool's `annotations`
- **When** the consumer inspects them
- **Then** `readOnlyHint` is `true` and `destructiveHint` is `false`

**Scenario TOOL-6a** (REQ-TOOL-6):
- **Given** the MCP tool specifications array
- **When** the consumer searches for a tool with name `send_universe_command`
- **Then** exactly one match is found

**Scenario TOOL-6b** (REQ-TOOL-6):
- **Given** the `send_universe_command` tool's `inputSchema`
- **When** the consumer inspects the `required` array
- **Then** it includes both `universeId` and `command`

**Scenario TOOL-6c** (REQ-TOOL-6):
- **Given** the `send_universe_command` tool's `annotations`
- **When** the consumer inspects them
- **Then** `readOnlyHint` is `false` and `destructiveHint` is `true`

**Scenario TOOL-7** (REQ-TOOL-7):
- **Given** the `send_universe_command` tool's `inputSchema`
- **When** the consumer navigates to the `command` property schema
- **Then** it uses `oneOf` containing exactly 25 sub-schemas, each with a `type` property whose `const` value matches one of the 25 defined command names

**Scenario TOOL-8** (REQ-TOOL-8):
- **Given** one command variant sub-schema (e.g., the variant with `type: "addStar"`)
- **When** the consumer inspects its `properties`
- **Then** it contains a `type` property with a `const` value of `"addStar"` and includes `required` entries for all mandatory parameters of that command type as defined by the domain model

**Scenario TOOL-9** (REQ-TOOL-9):
- **Given** any tool definition's `inputSchema`
- **When** the consumer validates it against JSON Schema meta-schema (draft-07 or later)
- **Then** validation passes, and the schema has `type: "object"` at the root with a non-empty `required` array

### Module Structure

**Scenario MOD-1** (REQ-MOD-1):
- **Given** a consumer imports from the barrel module
- **When** the consumer accesses the documentation content and the MCP tool specifications
- **Then** both are accessible from the barrel module's public exports

**Scenario MOD-2a** (REQ-MOD-2):
- **Given** the documentation content export
- **When** the consumer inspects its `version` property
- **Then** it is a non-empty string

**Scenario MOD-2b** (REQ-MOD-2):
- **Given** the MCP tool specifications export (or a companion metadata export)
- **When** the consumer inspects the `version` field
- **Then** it is a non-empty string

**Scenario MOD-3a** (REQ-MOD-3):
- **Given** the content module source files
- **When** the consumer inspects their import statements
- **Then** no imports reference HTTP frameworks, server libraries, or I/O modules (e.g., Express, http, fs, net)

**Scenario MOD-3b** (REQ-MOD-3):
- **Given** the content modules are loaded
- **When** any export is accessed
- **Then** no network requests, file system operations, or side effects occur

**Scenario MOD-4** (REQ-MOD-4):
- **Given** the project's TypeScript configuration
- **When** the type checker runs against the content modules
- **Then** no type errors are reported
