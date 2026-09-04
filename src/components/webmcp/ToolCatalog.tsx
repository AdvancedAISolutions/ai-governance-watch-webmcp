import { TOOL_CATALOG } from "@/lib/webmcp/contracts";
import type { WebMCPStatusValue } from "./WebMCPProvider";

const EXAMPLE_REQUESTS = [
  "Use search_updates to list the Maryland records in the 22 August 2026 report, then show the status and confidence for each.",
  "Use get_source_record for MSR-025 and tell me the check result and canonical URL without changing the wording.",
  "Use build_briefing titled Maryland weekly rollup for an audience of state policy staff, with the Maryland workgroup record and the Maryland laws in effect record.",
];

export function ToolCatalog({ status }: { status: WebMCPStatusValue }) {
  return (
    <section aria-labelledby="tool-catalog-heading" className="space-y-5">
      <h2 id="tool-catalog-heading" className="font-serif text-2xl font-bold text-foreground">
        Registered tool catalog
      </h2>

      <ul className="grid gap-4 sm:grid-cols-2">
        {TOOL_CATALOG.map((tool) => (
          <li key={tool.name} className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-mono text-sm font-bold text-foreground">{tool.name}</h3>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-signal-red">
              {tool.writeScope}
              {status === "available" ? " and registered" : " and not registered"}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tool.summary}</p>
          </li>
        ))}
      </ul>

      <div>
        <h3 className="font-serif text-lg font-bold text-foreground">Example requests</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Copy one of these into your assistant while this page is open.
        </p>
        <ul className="mt-3 space-y-3">
          {EXAMPLE_REQUESTS.map((example) => (
            <li key={example}>
              <pre className="overflow-x-auto whitespace-pre-wrap rounded-md border border-border bg-paper-raised p-3 font-mono text-xs leading-relaxed text-foreground">
                {example}
              </pre>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
