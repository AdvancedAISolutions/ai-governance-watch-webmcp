import { CheckCircle2, CircleAlert, Loader2 } from "lucide-react";
import type { WebMCPStatusValue } from "./WebMCPProvider";

export function WebMCPStatus({ status }: { status: WebMCPStatusValue }) {
  const label =
    status === "available"
      ? "WebMCP available: four tools registered"
      : status === "checking"
        ? "Checking for WebMCP support"
        : "WebMCP not available in this browser";

  const Icon =
    status === "available" ? CheckCircle2 : status === "checking" ? Loader2 : CircleAlert;

  return (
    <section
      aria-labelledby="webmcp-status-heading"
      className="rounded-lg border border-border bg-card p-5"
    >
      <h2 id="webmcp-status-heading" className="sr-only">
        WebMCP capability status
      </h2>
      <p role="status" className="flex items-start gap-3 text-sm font-semibold text-foreground">
        <Icon
          className={`mt-0.5 size-5 shrink-0 ${
            status === "checking" ? "animate-spin motion-reduce:animate-none" : ""
          } ${status === "available" ? "text-foreground" : "text-signal-red"}`}
          aria-hidden="true"
        />
        <span>{label}</span>
      </p>

      {status === "unavailable" ? (
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            This page did not find <code className="font-mono">document.modelContext</code>, so no
            tools were registered. Nothing was polyfilled or simulated. The briefing workspace below
            still works for a person on their own.
          </p>
          <p className="font-semibold text-foreground">To test the tools:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Open this page inside the ChatGPT in-app browser, or</li>
            <li>
              Use Chrome 149 or newer, visit{" "}
              <code className="font-mono">chrome://flags/#enable-webmcp-testing</code>, enable the
              flag, restart the browser, then reload this page.
            </li>
          </ul>
        </div>
      ) : null}

      {status === "available" ? (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          An assistant in this browser can now call the four tools listed below. Three read the
          dated snapshot and return exact record fields. One writes a session-only briefing into the
          workspace on this page for you to review.
        </p>
      ) : null}
    </section>
  );
}
