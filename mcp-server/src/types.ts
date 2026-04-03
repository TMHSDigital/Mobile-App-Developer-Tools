export interface ToolResponse {
  [key: string]: unknown;
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}

export function textResponse(text: string): ToolResponse {
  return { content: [{ type: "text" as const, text }] };
}

export function errorResponse(error: unknown): ToolResponse {
  const message =
    error instanceof Error ? error.message : String(error);

  return {
    content: [{ type: "text" as const, text: `Error: ${message}` }],
    isError: true,
  };
}

export function stubResponse(toolName: string, version: string): ToolResponse {
  return textResponse(
    `${toolName} is not yet implemented. Coming in ${version}.`
  );
}
