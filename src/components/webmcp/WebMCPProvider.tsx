/**
 * Registers the four WebMCP tools with the browser after the public standalone
 * WebMCP desk route has mounted.
 *
 * Registration rules held here:
 * - never registered on /unlock or on any gated monitor route (this component
 *   only ever renders inside the public standalone /webmcp route),
 * - one AbortController per mount lifecycle, its signal passed to
 *   registerTool, aborted on unmount,
 * - every registerTool promise is awaited, and the status only becomes
 *   "available" after all four resolve,
 * - no cross-origin exposure option is passed, so the secure same-origin
 *   default applies,
 * - no polyfill and no impersonation when document.modelContext is absent.
 *
 * Result contract: each execute callback returns a directly JSON-serializable
 * object with a top-level `ok` field. The MCP server-style text-content
 * wrapper is not used, so one JSON.parse() of an executeTool() string
 * exposes ok, results, source, items, or briefing directly.
 */
import { useEffect, useState } from "react";
import {
  BUILD_BRIEFING_DESCRIPTOR,
  COMPARE_UPDATES_DESCRIPTOR,
  GET_SOURCE_RECORD_DESCRIPTOR,
  SEARCH_UPDATES_DESCRIPTOR,
  runBuildBriefing,
  runCompareUpdates,
  runGetSourceRecord,
  runSearchUpdates,
} from "@/lib/webmcp/contracts";
import { errorResult } from "@/lib/webmcp/serialize";
import { useBriefing } from "./briefing-context";
import type { WebMCPToolDescriptor, WebMCPToolResult } from "@/types/webmcp";

export type WebMCPStatusValue = "checking" | "available" | "unavailable";

/**
 * The contract helpers already emit a single-layer JSON string. Parsing it
 * back into a plain object keeps the tool result directly serializable, so
 * the browser re-encodes exactly one JSON layer.
 */
export function jsonResult(serialized: string): WebMCPToolResult {
  try {
    const parsed: unknown = JSON.parse(serialized);
    if (parsed && typeof parsed === "object" && "ok" in parsed) {
      return parsed as WebMCPToolResult;
    }
  } catch {
    // fall through to the internal error below
  }
  return {
    ok: false,
    error: "INTERNAL_ERROR",
    message: "The tool result could not be serialized.",
  };
}

export function useWebMCPRegistration(): WebMCPStatusValue {
  const [status, setStatus] = useState<WebMCPStatusValue>("checking");
  const { applyAgentDraft } = useBriefing();

  useEffect(() => {
    const modelContext = typeof document !== "undefined" ? document.modelContext : undefined;
    if (!modelContext || typeof modelContext.registerTool !== "function") {
      setStatus("unavailable");
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    const descriptors: WebMCPToolDescriptor[] = [
      {
        ...SEARCH_UPDATES_DESCRIPTOR,
        inputSchema: SEARCH_UPDATES_DESCRIPTOR.inputSchema as unknown as Record<string, unknown>,
        annotations: { ...SEARCH_UPDATES_DESCRIPTOR.annotations },
        execute: (args, ctx) =>
          jsonResult(runSearchUpdates(args, ctx?.signal ?? controller.signal)),
      },
      {
        ...GET_SOURCE_RECORD_DESCRIPTOR,
        inputSchema: GET_SOURCE_RECORD_DESCRIPTOR.inputSchema as unknown as Record<string, unknown>,
        annotations: { ...GET_SOURCE_RECORD_DESCRIPTOR.annotations },
        execute: (args, ctx) =>
          jsonResult(runGetSourceRecord(args, ctx?.signal ?? controller.signal)),
      },
      {
        ...COMPARE_UPDATES_DESCRIPTOR,
        inputSchema: COMPARE_UPDATES_DESCRIPTOR.inputSchema as unknown as Record<string, unknown>,
        annotations: { ...COMPARE_UPDATES_DESCRIPTOR.annotations },
        execute: (args, ctx) =>
          jsonResult(runCompareUpdates(args, ctx?.signal ?? controller.signal)),
      },
      {
        ...BUILD_BRIEFING_DESCRIPTOR,
        inputSchema: BUILD_BRIEFING_DESCRIPTOR.inputSchema as unknown as Record<string, unknown>,
        annotations: { ...BUILD_BRIEFING_DESCRIPTOR.annotations },
        execute: (args, ctx) => {
          const outcome = runBuildBriefing(args, ctx?.signal ?? controller.signal);
          if (!outcome.ok) return jsonResult(outcome.result);
          applyAgentDraft(outcome.draft);
          return jsonResult(outcome.result);
        },
      },
    ];

    void (async () => {
      try {
        for (const descriptor of descriptors) {
          await modelContext.registerTool(descriptor, { signal: controller.signal });
        }
        if (!cancelled && !controller.signal.aborted) setStatus("available");
      } catch {
        if (!cancelled) setStatus("unavailable");
        controller.abort();
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [applyAgentDraft]);

  return status;
}

/** Result helper used by the status panel when tools cannot be registered. */
export function unavailableResult(): string {
  return errorResult(
    "WEBMCP_UNAVAILABLE",
    "This browser does not expose document.modelContext, so the briefing tools are not registered.",
  );
}
