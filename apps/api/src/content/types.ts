export interface DocsSection {
  id: string;
  heading: string;
  body: string;
}

export interface DocsContent {
  title: string;
  version: string;
  sections: DocsSection[];
}

export interface McpToolAnnotations {
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
}

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
    $defs?: Record<string, unknown>;
  };
  annotations?: McpToolAnnotations;
}
