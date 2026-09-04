/**
 * WebMCP tool contracts for the Maryland AI Governance Monitor briefing desk.
 *
 * These handlers are pure functions over the locally bundled dated report and
 * the local source ledger. They make no network request, no database call, no
 * AI call, and no external navigation. Editorial status, confidence labels,
 * publication dates, and underlying event dates are passed through exactly as
 * recorded; nothing is normalized into a legal conclusion.
 */
import { activeReportDate, filterCards, getCards, getReport } from "@/data/monitor";
import { sourceLedger } from "@/data/sources";
import type { NewsFeedCard } from "@/data/types";
import {
  cancelledIfAborted,
  clip,
  errorResult,
  okResult,
  payloadLength,
  MAX_RESULT_CHARS,
} from "./serialize";
import {
  asObject,
  boundedInteger,
  msrIdentifier,
  optionalString,
  rejectUnknownFields,
  requiredString,
  slugArray,
} from "./validation";

export const REPORT_DATE = activeReportDate;
export const CHECKED_ON = "2026-08-22";

export const TOOL_NAMES = [
  "search_updates",
  "get_source_record",
  "compare_updates",
  "build_briefing",
] as const;

export type ToolName = (typeof TOOL_NAMES)[number];

export interface ToolCatalogEntry {
  name: ToolName;
  summary: string;
  writeScope: "Read only" | "Session write";
  example: string;
}

/** Human facing catalog copy, kept in sync with the registered descriptors. */
export const TOOL_CATALOG: ToolCatalogEntry[] = [
  {
    name: "search_updates",
    summary:
      "Searches the dated 22 August 2026 report and returns up to five matching records with jurisdiction, status, confidence, both date fields, and the primary source.",
    writeScope: "Read only",
    example: "Use search_updates to find Maryland records in the 22 August 2026 report.",
  },
  {
    name: "get_source_record",
    summary:
      "Returns one exact source ledger record by its MSR identifier, including source class, check result, and canonical URL as checked on 22 August 2026.",
    writeScope: "Read only",
    example: "Use get_source_record to retrieve MSR-025 from the source ledger.",
  },
  {
    name: "compare_updates",
    summary:
      "Places two or three records side by side without collapsing publication dates, underlying event dates, status wording, or confidence labels. It draws no conclusion.",
    writeScope: "Read only",
    example:
      "Use compare_updates on the Maryland workgroup record and the EU AI Act enforcement record.",
  },
  {
    name: "build_briefing",
    summary:
      "Assembles a visible, session-only briefing from one to four records for a named audience and opens the briefing workspace so a person can review and revise it.",
    writeScope: "Session write",
    example:
      "Use build_briefing titled Maryland weekly for an audience of state policy staff with those two records.",
  },
];

/* ------------------------------------------------------------------ */
/* Shared shaping helpers                                              */
/* ------------------------------------------------------------------ */

function searchRow(card: NewsFeedCard, headlineMax: number, statusMax: number) {
  return {
    slug: card.unique_slug,
    headline: clip(card.headline, headlineMax),
    jurisdiction: clip(card.jurisdiction, 40),
    status: clip(card.status, statusMax),
    confidence: clip(card.confidence, 40),
    publication_date: card.publication_date,
    event_date: card.underlying_event_date,
    primary_source: clip(card.primary_source.name, 48),
  };
}

/* ------------------------------------------------------------------ */
/* search_updates                                                      */
/* ------------------------------------------------------------------ */

const SEARCH_FIELDS = [
  "query",
  "jurisdiction",
  "category",
  "status",
  "confidence",
  "max_results",
] as const;

export function runSearchUpdates(input: unknown, signal?: AbortSignal): string {
  const cancelled = cancelledIfAborted(signal);
  if (cancelled) return cancelled;

  const parsed = asObject(input);
  if (!parsed.ok) return errorResult("INVALID_INPUT", parsed.message);
  const args = parsed.value;

  const unknown = rejectUnknownFields(args, SEARCH_FIELDS);
  if (!unknown.ok) return errorResult("INVALID_INPUT", unknown.message);

  const query = optionalString(args, "query", 140);
  if (!query.ok) return errorResult("INVALID_INPUT", query.message);
  const jurisdiction = optionalString(args, "jurisdiction", 80);
  if (!jurisdiction.ok) return errorResult("INVALID_INPUT", jurisdiction.message);
  const category = optionalString(args, "category", 80);
  if (!category.ok) return errorResult("INVALID_INPUT", category.message);
  const status = optionalString(args, "status", 140);
  if (!status.ok) return errorResult("INVALID_INPUT", status.message);
  const confidence = optionalString(args, "confidence", 140);
  if (!confidence.ok) return errorResult("INVALID_INPUT", confidence.message);
  const maxResults = boundedInteger(args, "max_results", 1, 5, 5);
  if (!maxResults.ok) return errorResult("INVALID_INPUT", maxResults.message);

  try {
    const cards = getCards();
    let matches = filterCards(cards, {
      query: query.value ?? "",
      category: "",
      jurisdiction: jurisdiction.value ?? "",
      status: "",
      confidence: "",
      tag: "",
    });
    if (category.value) {
      const needle = category.value.toLowerCase();
      matches = matches.filter((c) => c.category.toLowerCase().includes(needle));
    }
    if (status.value) {
      const needle = status.value.toLowerCase();
      matches = matches.filter((c) => c.status.toLowerCase().includes(needle));
    }
    if (confidence.value) {
      const needle = confidence.value.toLowerCase();
      matches = matches.filter((c) => c.confidence.toLowerCase().includes(needle));
    }

    const total = matches.length;
    const capped = matches.slice(0, maxResults.value);

    if (cancelledIfAborted(signal)) {
      return errorResult("TOOL_CANCELLED", "The tool call was cancelled before it completed.");
    }

    // Pre-limit before serialization: shrink field budgets, then the row
    // count, so the emitted JSON is always complete and within the ceiling.
    for (const budget of [
      { headline: 110, status: 90 },
      { headline: 80, status: 60 },
      { headline: 60, status: 40 },
    ]) {
      for (let count = capped.length; count >= 1; count -= 1) {
        const payload = {
          report_date: REPORT_DATE,
          total_matches: total,
          returned: count,
          results: capped.slice(0, count).map((c) => searchRow(c, budget.headline, budget.status)),
        };
        if (payloadLength(payload) <= MAX_RESULT_CHARS) return okResult(payload);
      }
    }

    if (total === 0) {
      return okResult({ report_date: REPORT_DATE, total_matches: 0, returned: 0, results: [] });
    }
    return errorResult(
      "RESULT_TOO_LARGE",
      "The matching records do not fit the result limit. Add a jurisdiction or category filter.",
    );
  } catch {
    return errorResult("INTERNAL_ERROR", "The dated report could not be read.");
  }
}

/* ------------------------------------------------------------------ */
/* get_source_record                                                   */
/* ------------------------------------------------------------------ */

export function runGetSourceRecord(input: unknown, signal?: AbortSignal): string {
  const cancelled = cancelledIfAborted(signal);
  if (cancelled) return cancelled;

  const parsed = asObject(input);
  if (!parsed.ok) return errorResult("INVALID_INPUT", parsed.message);
  const unknown = rejectUnknownFields(parsed.value, ["source_id"]);
  if (!unknown.ok) return errorResult("INVALID_INPUT", unknown.message);

  const id = msrIdentifier(parsed.value, "source_id");
  if (!id.ok) return errorResult("INVALID_INPUT", id.message);

  try {
    const source = sourceLedger.find((entry) => entry.id === id.value);
    if (!source) {
      return errorResult(
        "SOURCE_NOT_FOUND",
        `No source ledger record exists for ${id.value} in the 22 August 2026 check.`,
      );
    }
    if (cancelledIfAborted(signal)) {
      return errorResult("TOOL_CANCELLED", "The tool call was cancelled before it completed.");
    }
    return okResult({
      source: {
        id: source.id,
        name: clip(source.name, 120),
        source_class: source.source_class,
        check_result: clip(source.check_result, 120),
        canonical_url: clip(source.canonical_url, 220),
        checked_on: CHECKED_ON,
      },
    });
  } catch {
    return errorResult("INTERNAL_ERROR", "The source ledger could not be read.");
  }
}

/* ------------------------------------------------------------------ */
/* compare_updates                                                     */
/* ------------------------------------------------------------------ */

export const COMPARE_NOTE =
  "Statuses, dates, and confidence labels are source-record fields and are not normalized into legal conclusions.";

export function runCompareUpdates(input: unknown, signal?: AbortSignal): string {
  const cancelled = cancelledIfAborted(signal);
  if (cancelled) return cancelled;

  const parsed = asObject(input);
  if (!parsed.ok) return errorResult("INVALID_INPUT", parsed.message);
  const unknown = rejectUnknownFields(parsed.value, ["slugs"]);
  if (!unknown.ok) return errorResult("INVALID_INPUT", unknown.message);

  const slugs = slugArray(parsed.value, "slugs", 2, 3);
  if (!slugs.ok) return errorResult("INVALID_INPUT", slugs.message);

  try {
    const cards: NewsFeedCard[] = [];
    for (const slug of slugs.value) {
      const card = getCards().find((c) => c.unique_slug === slug);
      if (!card) {
        return errorResult("RECORD_NOT_FOUND", `No record in the dated report matches ${slug}.`);
      }
      cards.push(card);
    }
    if (cancelledIfAborted(signal)) {
      return errorResult("TOOL_CANCELLED", "The tool call was cancelled before it completed.");
    }

    for (const budget of [
      { headline: 90, status: 70 },
      { headline: 60, status: 45 },
      { headline: 44, status: 30 },
    ]) {
      const payload = {
        items: cards.map((card) => ({
          slug: card.unique_slug,
          headline: clip(card.headline, budget.headline),
          jurisdiction: clip(card.jurisdiction, 36),
          status: clip(card.status, budget.status),
          confidence: clip(card.confidence, 34),
          publication_date: card.publication_date,
          event_date: card.underlying_event_date,
          primary_source: clip(card.primary_source.name, 40),
        })),
        note: COMPARE_NOTE,
      };
      if (payloadLength(payload) <= MAX_RESULT_CHARS) return okResult(payload);
    }
    return errorResult(
      "RESULT_TOO_LARGE",
      "The comparison does not fit the result limit. Compare two records instead of three.",
    );
  } catch {
    return errorResult("INTERNAL_ERROR", "The dated report could not be read.");
  }
}

/* ------------------------------------------------------------------ */
/* build_briefing                                                      */
/* ------------------------------------------------------------------ */

export interface BriefingDraft {
  title: string;
  audience: string;
  focus: string;
  slugs: string[];
}

export type BriefingBuildOutcome =
  { ok: true; draft: BriefingDraft; result: string } | { ok: false; result: string };

const BUILD_FIELDS = ["title", "audience", "slugs", "focus"] as const;

/**
 * Validates a briefing request and produces the draft plus the serialized
 * tool result. State is only mutated by the caller when `ok` is true, so an
 * invalid request never changes the visible workspace.
 */
export function runBuildBriefing(input: unknown, signal?: AbortSignal): BriefingBuildOutcome {
  const cancelled = cancelledIfAborted(signal);
  if (cancelled) return { ok: false, result: cancelled };

  const parsed = asObject(input);
  if (!parsed.ok) return { ok: false, result: errorResult("INVALID_INPUT", parsed.message) };
  const unknown = rejectUnknownFields(parsed.value, BUILD_FIELDS);
  if (!unknown.ok) return { ok: false, result: errorResult("INVALID_INPUT", unknown.message) };

  const title = requiredString(parsed.value, "title", 3, 100);
  if (!title.ok) return { ok: false, result: errorResult("INVALID_INPUT", title.message) };
  const audience = requiredString(parsed.value, "audience", 2, 100);
  if (!audience.ok) return { ok: false, result: errorResult("INVALID_INPUT", audience.message) };
  const focus = optionalString(parsed.value, "focus", 240);
  if (!focus.ok) return { ok: false, result: errorResult("INVALID_INPUT", focus.message) };
  const slugs = slugArray(parsed.value, "slugs", 1, 4);
  if (!slugs.ok) return { ok: false, result: errorResult("INVALID_INPUT", slugs.message) };

  try {
    const known = new Set(getCards().map((c) => c.unique_slug));
    for (const slug of slugs.value) {
      if (!known.has(slug)) {
        return {
          ok: false,
          result: errorResult(
            "RECORD_NOT_FOUND",
            `No record in the dated report matches ${slug}. The briefing was not changed.`,
          ),
        };
      }
    }
    if (cancelledIfAborted(signal)) {
      return {
        ok: false,
        result: errorResult("TOOL_CANCELLED", "The tool call was cancelled before it completed."),
      };
    }

    const draft: BriefingDraft = {
      title: title.value,
      audience: audience.value,
      focus: focus.value ?? "",
      slugs: slugs.value,
    };

    const result = okResult({
      briefing: {
        title: clip(draft.title, 100),
        audience: clip(draft.audience, 100),
        focus: clip(draft.focus, 160),
        item_count: draft.slugs.length,
        slugs: draft.slugs,
        route: "/webmcp",
        persistence: "session-only",
      },
      message: "The visible briefing workspace is ready for human review.",
    });
    return { ok: true, draft, result };
  } catch {
    return {
      ok: false,
      result: errorResult("INTERNAL_ERROR", "The dated report could not be read."),
    };
  }
}

/* ------------------------------------------------------------------ */
/* Registered descriptors                                              */
/* ------------------------------------------------------------------ */

export const SEARCH_UPDATES_DESCRIPTOR = {
  name: "search_updates",
  description:
    "Search the locally bundled Maryland AI Governance Monitor report dated 2026-08-22 and return up to five matching records. Reads bundled data only; no network, database, or AI call. Returns slug, headline, jurisdiction, status, confidence, publication date, underlying event date, and primary source name exactly as recorded.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      query: {
        type: "string",
        maxLength: 140,
        description: "Free text to match across headline, summary, tags, and dates.",
      },
      jurisdiction: {
        type: "string",
        maxLength: 80,
        description: "Jurisdiction filter, for example Maryland or European Union.",
      },
      category: {
        type: "string",
        maxLength: 80,
        description: "Category filter matched against the record category field.",
      },
      status: {
        type: "string",
        maxLength: 140,
        description: "Status filter matched against the recorded status wording.",
      },
      confidence: {
        type: "string",
        maxLength: 140,
        description: "Confidence filter matched against the recorded confidence label.",
      },
      max_results: {
        type: "integer",
        minimum: 1,
        maximum: 5,
        description: "Maximum records to return, from 1 to 5. Defaults to 5.",
      },
    },
  },
  annotations: { readOnlyHint: true, untrustedContentHint: true },
} as const;

export const GET_SOURCE_RECORD_DESCRIPTOR = {
  name: "get_source_record",
  description:
    "Retrieve one exact record from the Maryland AI Governance Monitor source ledger by its MSR identifier. Reads bundled data only. Returns the identifier, source name, source class, check result, canonical URL, and the 2026-08-22 check date. Returns SOURCE_NOT_FOUND when the identifier is not in the ledger.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    required: ["source_id"],
    properties: {
      source_id: {
        type: "string",
        pattern: "^MSR-[0-9]{3}$",
        description: "Source ledger identifier such as MSR-025.",
      },
    },
  },
  annotations: { readOnlyHint: true, untrustedContentHint: true },
} as const;

export const COMPARE_UPDATES_DESCRIPTOR = {
  name: "compare_updates",
  description:
    "Place two or three records from the 2026-08-22 report side by side for review. Preserves the publication date and the underlying event date as separate fields and passes status, confidence, jurisdiction, and primary source through unchanged. Draws no conclusion and offers no legal interpretation.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    required: ["slugs"],
    properties: {
      slugs: {
        type: "array",
        minItems: 2,
        maxItems: 3,
        uniqueItems: true,
        items: { type: "string", maxLength: 140 },
        description: "Two or three unique record slugs from the dated report.",
      },
    },
  },
  annotations: { readOnlyHint: true, untrustedContentHint: true },
} as const;

export const BUILD_BRIEFING_DESCRIPTOR = {
  name: "build_briefing",
  description:
    "Assemble a visible session-only briefing from one to four records in the 2026-08-22 report and open the briefing workspace at /webmcp so a person can review and revise it. Nothing is saved, published, emailed, downloaded, or approved, and no external link is opened. An invalid request leaves the workspace unchanged.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    required: ["title", "audience", "slugs"],
    properties: {
      title: {
        type: "string",
        minLength: 3,
        maxLength: 100,
        description: "Working title for the briefing draft.",
      },
      audience: {
        type: "string",
        minLength: 2,
        maxLength: 100,
        description: "Who the briefing is being prepared for.",
      },
      slugs: {
        type: "array",
        minItems: 1,
        maxItems: 4,
        uniqueItems: true,
        items: { type: "string", maxLength: 140 },
        description: "One to four unique record slugs from the dated report.",
      },
      focus: {
        type: "string",
        maxLength: 240,
        description: "Optional framing note for the human reviewer.",
      },
    },
  },
  annotations: { readOnlyHint: false, untrustedContentHint: true },
} as const;

export function getReportMeta() {
  const report = getReport();
  return { reportDate: report.report_date, cardCount: report.news_feed_cards.length };
}
