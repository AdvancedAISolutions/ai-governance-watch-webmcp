/**
 * Visible, session-only briefing workspace.
 *
 * Agent-created and human-edited briefings update the same React state, so a
 * person can always review and revise whatever an assistant assembled.
 */
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { getCardBySlug } from "@/data/monitor";
import { useBriefing } from "./briefing-context";

export function BriefingWorkspace() {
  const { briefing, updateField, removeSlug, moveSlug, clearBriefing } = useBriefing();
  const hasItems = briefing.slugs.length > 0;

  return (
    <section aria-labelledby="briefing-workspace-heading" className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2
          id="briefing-workspace-heading"
          className="font-serif text-2xl font-bold text-foreground"
        >
          Briefing workspace
        </h2>
        <p className="rounded-full border border-border bg-paper-raised px-3 py-1 text-xs font-bold uppercase tracking-wide text-foreground">
          Session-only
        </p>
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">
        This draft exists in the current page session only. It is never saved, published, emailed,
        downloaded, or marked approved. Reloading the page clears it.
      </p>

      <p aria-live="polite" className="min-h-6 text-sm font-medium text-foreground">
        {briefing.lastChangeNote}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="briefing-title" className="data-label block">
            Title
          </label>
          <input
            id="briefing-title"
            type="text"
            value={briefing.title}
            onChange={(e) => updateField("title", e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal-red"
          />
        </div>
        <div>
          <label htmlFor="briefing-audience" className="data-label block">
            Audience
          </label>
          <input
            id="briefing-audience"
            type="text"
            value={briefing.audience}
            onChange={(e) => updateField("audience", e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal-red"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="briefing-focus" className="data-label block">
            Focus note
          </label>
          <textarea
            id="briefing-focus"
            rows={2}
            value={briefing.focus}
            onChange={(e) => updateField("focus", e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal-red"
          />
        </div>
      </div>

      <div>
        <h3 className="font-serif text-lg font-bold text-foreground">
          Records in this briefing ({briefing.slugs.length})
        </h3>
        {!hasItems ? (
          <p className="mt-2 rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
            No records yet. Ask an assistant to run build_briefing while this page is open, or read
            the news feed and note the record slugs you want.
          </p>
        ) : (
          <ol className="mt-3 space-y-3">
            {briefing.slugs.map((slug, index) => {
              const card = getCardBySlug(slug);
              return (
                <li key={slug} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wide text-signal-red">
                        Position {index + 1}
                      </p>
                      <h4 className="mt-1 font-serif text-base font-bold text-foreground">
                        {card ? card.headline : slug}
                      </h4>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => moveSlug(slug, -1)}
                        disabled={index === 0}
                        aria-label={`Move ${card ? card.headline : slug} up to position ${index}`}
                        className="rounded-md border border-border p-1.5 text-foreground disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal-red"
                      >
                        <ArrowUp className="size-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSlug(slug, 1)}
                        disabled={index === briefing.slugs.length - 1}
                        aria-label={`Move ${card ? card.headline : slug} down to position ${index + 2}`}
                        className="rounded-md border border-border p-1.5 text-foreground disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal-red"
                      >
                        <ArrowDown className="size-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSlug(slug)}
                        aria-label={`Remove ${card ? card.headline : slug} from the briefing`}
                        className="rounded-md border border-border p-1.5 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal-red"
                      >
                        <X className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  {card ? (
                    <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="data-label">Jurisdiction</dt>
                        <dd className="text-foreground">{card.jurisdiction}</dd>
                      </div>
                      <div>
                        <dt className="data-label">Status as recorded</dt>
                        <dd className="text-foreground">{card.status}</dd>
                      </div>
                      <div>
                        <dt className="data-label">Publication date</dt>
                        <dd className="text-foreground">{card.publication_date}</dd>
                      </div>
                      <div>
                        <dt className="data-label">Underlying event date</dt>
                        <dd className="text-foreground">{card.underlying_event_date}</dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="data-label">Confidence as recorded</dt>
                        <dd className="text-foreground">{card.confidence}</dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="data-label">Primary source</dt>
                        <dd>
                          <a
                            href={card.primary_source.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="text-foreground underline underline-offset-4 hover:text-signal-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal-red"
                          >
                            {card.primary_source.name}
                          </a>
                        </dd>
                      </div>
                    </dl>
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">
                      This slug is not present in the dated report.
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <button
        type="button"
        onClick={clearBriefing}
        className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground hover:border-signal-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal-red"
      >
        Clear briefing
      </button>
    </section>
  );
}
