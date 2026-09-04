/**
 * TypeScript data model for the Maryland AI Governance Monitor.
 *
 * The card schema mirrors the controlling machine-readable JSON export
 * exactly. Do not collapse publication/event dates and do not reinterpret
 * status, confidence, or editorial approval values.
 */

export interface SourceRef {
  name: string;
  url: string;
}

export interface NewsFeedCard {
  unique_slug: string;
  publication_date: string;
  underlying_event_date: string;
  headline: string;
  short_deck: string;
  category: string;
  jurisdiction: string;
  status: string;
  summary: string;
  why_it_matters: string;
  maryland_and_mrac_relevance: string;
  primary_source: SourceRef;
  secondary_source: SourceRef | null;
  exact_urls: string[];
  tags: string[];
  confidence: string;
  image_recommendation: string;
  image_url: string | null;
  image_creator_or_owner: string | null;
  image_license_or_usage_basis: string;
  required_attribution: string | null;
  alt_text: string;
  editorial_approval_status: string;
}

export interface MonitorReport {
  schema_version: string;
  report_name: string;
  report_date: string;
  timezone: string;
  editorial_status: string;
  comparison_note: string;
  news_feed_cards: NewsFeedCard[];
}

export interface LedgerSource {
  id: string;
  name: string;
  source_class: string;
  check_result: string;
  canonical_url: string;
}

export interface PriorityAlert {
  urgency: string;
  jurisdiction: string;
  alert: string;
  dateOrDeadline: string;
  editorialAction: string;
}

export interface UseCaseRow {
  useCase: string;
  lifecycle: string;
  potentialBenefit: string;
  disclosedControl: string;
  openEvidenceQuestions: string;
}

export interface PolicyTrackerRow {
  instrument: string;
  status: string;
  whatChanged: string;
  nextEvidence: string;
}

export interface SocialSignalRow {
  sourceCluster: string;
  dominantNarrative: string;
  editorialCountercheck: string;
}

export interface BriefContent {
  reportDateLong: string;
  timezone: string;
  firstReportNote: string;
  executivePulse: { lead: string; body: string }[];
  priorityAlerts: PriorityAlert[];
  marylandMracRelevance: { lead: string; body: string }[];
  useCases: UseCaseRow[];
  policyTracker: PolicyTrackerRow[];
  procurementDevelopments: { lead: string; body: string }[];
  researchDevelopments: { lead: string; body: string }[];
  socialSignals: SocialSignalRow[];
  socialPostRule: string;
  watchlist: string[];
  ledgerOperationalNote: string;
  editorialNotes: string[];
}
