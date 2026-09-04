/**
 * Serialization and size discipline for WebMCP tool results.
 *
 * Every tool returns a single JSON string. The hard ceiling is 1,450
 * characters. Fields are pre-limited before serialization so a JSON string
 * value is never cut in the middle of the encoded payload.
 */

export const MAX_RESULT_CHARS = 1450;

export type WebMCPErrorCode =
  | "WEBMCP_UNAVAILABLE"
  | "INVALID_INPUT"
  | "RECORD_NOT_FOUND"
  | "SOURCE_NOT_FOUND"
  | "RESULT_TOO_LARGE"
  | "TOOL_CANCELLED"
  | "INTERNAL_ERROR";

/** Trims and shortens a field at a word boundary before serialization. */
export function clip(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  const cut = trimmed.slice(0, max - 3);
  const lastSpace = cut.lastIndexOf(" ");
  const base = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${base.trimEnd()}...`;
}

export function errorResult(code: WebMCPErrorCode, message: string): string {
  return JSON.stringify({ ok: false, error: code, message: clip(message, 300) });
}

/**
 * Serializes a successful payload and enforces the character ceiling.
 * Callers pre-limit their own fields; this is the final backstop.
 */
export function okResult(payload: Record<string, unknown>): string {
  let text: string;
  try {
    text = JSON.stringify({ ok: true, ...payload });
  } catch {
    return errorResult("INTERNAL_ERROR", "The result could not be serialized.");
  }
  if (text.length > MAX_RESULT_CHARS) {
    return errorResult(
      "RESULT_TOO_LARGE",
      "The result exceeds the 1450 character limit. Narrow the request with fewer items or more specific filters.",
    );
  }
  return text;
}

/** Measures a candidate payload without emitting it. */
export function payloadLength(payload: Record<string, unknown>): number {
  try {
    return JSON.stringify({ ok: true, ...payload }).length;
  } catch {
    return Number.MAX_SAFE_INTEGER;
  }
}

export function cancelledIfAborted(signal?: AbortSignal): string | null {
  if (signal?.aborted) {
    return errorResult("TOOL_CANCELLED", "The tool call was cancelled before it completed.");
  }
  return null;
}
