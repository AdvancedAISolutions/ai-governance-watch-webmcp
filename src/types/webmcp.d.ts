/**
 * Minimal ambient types for the browser WebMCP surface (`document.modelContext`).
 *
 * These declarations describe only the subset this project uses. They do not
 * polyfill, shim, or emulate WebMCP. When the browser does not provide
 * `document.modelContext`, the application reports the capability as
 * unavailable and explains how to enable it.
 *
 * Two contract details matter here:
 * - `registerTool` is asynchronous and returns a promise the caller awaits,
 * - `execute` returns a directly JSON-serializable object shaped as
 *   `{ ok: true, ... }` or `{ ok: false, ... }`, never an MCP server-style
 *   `{ content: [...] }` wrapper. A single `JSON.parse()` of the
 *   `executeTool()` string therefore exposes `ok` at the top level.
 */

export interface WebMCPToolAnnotations {
  readOnlyHint: boolean;
  untrustedContentHint: boolean;
}

/** A single-layer, JSON-serializable tool payload with a top-level `ok`. */
export interface WebMCPToolResult {
  ok: boolean;
  [key: string]: unknown;
}

export interface WebMCPToolDescriptor {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: WebMCPToolAnnotations;
  execute: (
    args: unknown,
    context?: { signal?: AbortSignal },
  ) => Promise<WebMCPToolResult> | WebMCPToolResult;
}

export interface WebMCPRegistrationOptions {
  signal?: AbortSignal;
}

export interface WebMCPModelContext {
  registerTool: (
    descriptor: WebMCPToolDescriptor,
    options?: WebMCPRegistrationOptions,
  ) => Promise<unknown>;
  executeTool?: (name: string, args?: unknown) => Promise<string>;
}

declare global {
  interface Document {
    modelContext?: WebMCPModelContext;
  }
}

export {};
