/**
 * Data adapter for the Maryland AI Governance Monitor.
 *
 * Reports are bundled locally as dated JSON exports. To add a future daily
 * report, drop a new `report-YYYY-MM-DD.json` next to the inaugural export,
 * register it in `reportRegistry`, and point `activeReportDate` at it — no
 * interface redesign is required.
 */
import report20260822 from "./report-2026-08-22.json";
import type { MonitorReport, NewsFeedCard } from "./types";

const reportRegistry: Record<string, MonitorReport> = {
  "2026-08-22": report20260822 as MonitorReport,
};

export const activeReportDate = "2026-08-22";

export function getReport(date: string = activeReportDate): MonitorReport {
  const report = reportRegistry[date];
  if (!report) throw new Error(`No report registered for ${date}`);
  return report;
}

export function getCards(date: string = activeReportDate): NewsFeedCard[] {
  return getReport(date).news_feed_cards;
}

export function getCardBySlug(
  slug: string,
  date: string = activeReportDate,
): NewsFeedCard | undefined {
  return getReport(date).news_feed_cards.find((c) => c.unique_slug === slug);
}

/**
 * Editorial approval gate. A card is eligible for a future public mode ONLY
 * when its approval status explicitly authorizes publication. Every other
 * value — including any unknown future value — fails closed to hidden.
 */
export const APPROVED_PUBLICATION_STATUS = "Approved for publication";

export function isApprovedForPublication(card: NewsFeedCard): boolean {
  return card.editorial_approval_status === APPROVED_PUBLICATION_STATUS;
}

export function getPublicCards(date: string = activeReportDate): NewsFeedCard[] {
  return getCards(date).filter(isApprovedForPublication);
}

/**
 * Image-rights gate. An image may render only when the editorial artwork
 * registry holds an entry for this story whose manifest status is exactly
 * "approved" (entry carries alt text, disclosure caption, and credit).
 * Otherwise the caller must fail closed to the rights-safe placeholder.
 * Story-level publication approval is a separate, unchanged gate.
 */
export interface FeedFilters {
  query: string;
  category: string;
  jurisdiction: string;
  status: string;
  confidence: string;
  tag: string;
}

export const emptyFilters: FeedFilters = {
  query: "",
  category: "",
  jurisdiction: "",
  status: "",
  confidence: "",
  tag: "",
};

export type FeedSort = "newest" | "oldest" | "headline";

function matchesLooseDate(dateValue: string, query: string): boolean {
  return dateValue.toLowerCase().includes(query);
}

export function filterCards(cards: NewsFeedCard[], filters: FeedFilters): NewsFeedCard[] {
  const q = filters.query.trim().toLowerCase();
  return cards.filter((card) => {
    if (q) {
      const haystack = [
        card.headline,
        card.short_deck,
        card.summary,
        card.category,
        card.jurisdiction,
        card.status,
        card.confidence,
        card.primary_source.name,
        card.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      const inText = haystack.includes(q);
      const inDates =
        matchesLooseDate(card.publication_date, q) ||
        matchesLooseDate(card.underlying_event_date, q);
      if (!inText && !inDates) return false;
    }
    if (filters.category && card.category !== filters.category) return false;
    if (
      filters.jurisdiction &&
      !card.jurisdiction.toLowerCase().includes(filters.jurisdiction.toLowerCase())
    )
      return false;
    if (filters.status && card.status !== filters.status) return false;
    if (filters.confidence && card.confidence !== filters.confidence) return false;
    if (filters.tag && !card.tags.some((t) => t.toLowerCase() === filters.tag.toLowerCase()))
      return false;
    return true;
  });
}

/** Sorts without merging distinct publication/event dates. */
export function sortCards(cards: NewsFeedCard[], sort: FeedSort): NewsFeedCard[] {
  const sorted = [...cards];
  if (sort === "headline") {
    sorted.sort((a, b) => a.headline.localeCompare(b.headline));
  } else {
    sorted.sort((a, b) => {
      const da = a.publication_date;
      const db = b.publication_date;
      return sort === "newest" ? db.localeCompare(da) : da.localeCompare(db);
    });
  }
  return sorted;
}

export function distinctValues(
  cards: NewsFeedCard[],
  pick: (card: NewsFeedCard) => string,
): string[] {
  return Array.from(new Set(cards.map(pick))).sort((a, b) => a.localeCompare(b));
}

export function distinctTags(cards: NewsFeedCard[]): string[] {
  return Array.from(new Set(cards.flatMap((c) => c.tags))).sort((a, b) => a.localeCompare(b));
}

/** Jurisdiction facets use substring matching (e.g. "Maryland / United States federal"). */
export const jurisdictionFacets = [
  "Maryland",
  "United States federal",
  "European Union",
  "Pennsylvania",
  "California",
];

export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
