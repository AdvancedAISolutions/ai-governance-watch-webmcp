/**
 * Public standalone WebMCP Desk.
 *
 * This route sits outside the gated monitor hierarchy on purpose: it is the
 * public challenge surface, reachable without a sign-in. It renders its own
 * standalone shell branded "AI Governance Watch" and never renders the
 * Maryland AI Governance Monitor masthead, MRAC badge, monitor navigation,
 * monitor footer, or the Ask Jay launcher and panel. Every other monitor
 * route stays protected behind /unlock exactly as before.
 */
import { createFileRoute } from "@tanstack/react-router";
import { BriefingProvider } from "@/components/webmcp/briefing-context";
import { useWebMCPRegistration } from "@/components/webmcp/WebMCPProvider";
import { WebMCPStatus } from "@/components/webmcp/WebMCPStatus";
import { ToolCatalog } from "@/components/webmcp/ToolCatalog";
import { BriefingWorkspace } from "@/components/webmcp/BriefingWorkspace";
import { getReportMeta } from "@/lib/webmcp/contracts";

export const Route = createFileRoute("/webmcp")({
  head: () => ({
    meta: [
      { title: "AI Governance Watch | A Source-Grounded WebMCP Briefing Desk" },
      {
        name: "description",
        content:
          "A public WebMCP briefing desk where an assistant can search a dated 22 August 2026 AI governance snapshot and assemble a session-only briefing for human review.",
      },
      {
        property: "og:title",
        content: "AI Governance Watch | A Source-Grounded WebMCP Briefing Desk",
      },
      {
        property: "og:description",
        content:
          "Browser-native tools for searching a dated AI governance snapshot and assembling a session-only briefing a person reviews.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow, noarchive, nosnippet" },
    ],
  }),
  component: WebMCPDeskRoute,
});

function WebMCPDeskRoute() {
  return (
    <BriefingProvider>
      <WebMCPDesk />
    </BriefingProvider>
  );
}

function WebMCPDesk() {
  const status = useWebMCPRegistration();
  const meta = getReportMeta();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-paper-raised">
        <div className="mx-auto flex max-w-4xl flex-wrap items-baseline justify-between gap-2 px-4 py-4 sm:px-6">
          <span className="font-serif text-lg font-bold tracking-tight text-foreground">
            AI Governance Watch
          </span>
          <span className="data-label">WebMCP Challenge Project</span>
        </div>
      </header>

      <main
        id="main-content"
        className="mx-auto w-full max-w-4xl flex-1 space-y-10 px-4 py-10 sm:px-6"
      >
        <header className="space-y-3">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            A Source-Grounded WebMCP Briefing Desk
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            This page hands a browser assistant a small set of explicit tools instead of asking it
            to guess. Without tools, an assistant reads rendered text and often blurs a publication
            date into an event date, or softens a recorded status into a legal conclusion. With
            these tools, it calls a named function, receives the exact recorded fields, and every
            result is shown to you here for review before it means anything.
          </p>
          <p className="text-sm text-muted-foreground">
            Working from the bundled snapshot dated {meta.reportDate}, containing {meta.cardCount}{" "}
            records and a 62 entry source ledger. Nothing on this page fetches, crawls, or refreshes
            anything.
          </p>
        </header>

        <WebMCPStatus status={status} />
        <ToolCatalog status={status} />
        <BriefingWorkspace />

        <footer className="space-y-4 rounded-lg border border-border bg-paper-raised p-5 text-sm leading-relaxed text-muted-foreground">
          <div>
            <h2 className="font-serif text-base font-bold text-foreground">
              Snapshot and independence
            </h2>
            <p className="mt-2">
              Every record here is a dated snapshot captured on {meta.reportDate}. It is not a live
              feed, and it is not automated legal analysis. This project is an independent editorial
              prototype by Justin Gallucci. It is not affiliated with, endorsed by, or published by
              the Maryland Responsible AI Council, the State of Maryland, or any government body.
              Linked third-party materials remain the property of their owners.
            </p>
          </div>
          <p>
            <a
              href="https://md-gov-watch.lovable.app/"
              className="font-semibold text-foreground underline underline-offset-4"
            >
              Open the full Maryland AI Governance Monitor (sign-in required)
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
