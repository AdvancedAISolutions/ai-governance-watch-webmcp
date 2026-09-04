/**
 * Session-only briefing state shared by the WebMCP tool layer and the visible
 * workspace. The state lives in React memory for the current page session
 * only: nothing is written to a database, a cookie, localStorage, or a file.
 */
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { BriefingDraft } from "@/lib/webmcp/contracts";

export interface BriefingState extends BriefingDraft {
  lastChangeBy: "agent" | "person" | null;
  lastChangeNote: string;
}

const EMPTY: BriefingState = {
  title: "",
  audience: "",
  focus: "",
  slugs: [],
  lastChangeBy: null,
  lastChangeNote: "",
};

interface BriefingContextValue {
  briefing: BriefingState;
  applyAgentDraft: (draft: BriefingDraft) => void;
  updateField: (field: "title" | "audience" | "focus", value: string) => void;
  removeSlug: (slug: string) => void;
  moveSlug: (slug: string, direction: -1 | 1) => void;
  clearBriefing: () => void;
}

const BriefingContext = createContext<BriefingContextValue | null>(null);

export function BriefingProvider({ children }: { children: ReactNode }) {
  const [briefing, setBriefing] = useState<BriefingState>(EMPTY);

  const applyAgentDraft = useCallback((draft: BriefingDraft) => {
    setBriefing({
      ...draft,
      lastChangeBy: "agent",
      lastChangeNote: `An agent assembled a briefing with ${draft.slugs.length} record${
        draft.slugs.length === 1 ? "" : "s"
      }. It is session only and awaiting your review.`,
    });
  }, []);

  const updateField = useCallback((field: "title" | "audience" | "focus", value: string) => {
    setBriefing((prev) => ({
      ...prev,
      [field]: value,
      lastChangeBy: "person",
      lastChangeNote: `You edited the briefing ${field}.`,
    }));
  }, []);

  const removeSlug = useCallback((slug: string) => {
    setBriefing((prev) => ({
      ...prev,
      slugs: prev.slugs.filter((s) => s !== slug),
      lastChangeBy: "person",
      lastChangeNote: "You removed a record from the briefing.",
    }));
  }, []);

  const moveSlug = useCallback((slug: string, direction: -1 | 1) => {
    setBriefing((prev) => {
      const index = prev.slugs.indexOf(slug);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= prev.slugs.length) return prev;
      const slugs = [...prev.slugs];
      const moved = slugs[index] as string;
      slugs[index] = slugs[target] as string;
      slugs[target] = moved;

      return {
        ...prev,
        slugs,
        lastChangeBy: "person",
        lastChangeNote: `You moved a record to position ${target + 1}.`,
      };
    });
  }, []);

  const clearBriefing = useCallback(() => {
    setBriefing({ ...EMPTY, lastChangeBy: "person", lastChangeNote: "You cleared the briefing." });
  }, []);

  const value = useMemo(
    () => ({ briefing, applyAgentDraft, updateField, removeSlug, moveSlug, clearBriefing }),
    [briefing, applyAgentDraft, updateField, removeSlug, moveSlug, clearBriefing],
  );

  return <BriefingContext.Provider value={value}>{children}</BriefingContext.Provider>;
}

export function useBriefing(): BriefingContextValue {
  const ctx = useContext(BriefingContext);
  if (!ctx) throw new Error("useBriefing must be used inside BriefingProvider");
  return ctx;
}
