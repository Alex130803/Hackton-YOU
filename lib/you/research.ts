import { youFetch, YOU_API } from "./client";

// Docs: https://you.com/docs/guides/research.md
// POST https://api.you.com/v1/research  { input, research_effort }
// research_effort: lite (<10s) | standard (10-30s, default) | deep (<120s) | exhaustive (<300s)
//                  | frontier (background: true only). Demo: use "lite" or "standard".
export type ResearchEffort = "lite" | "standard" | "deep" | "exhaustive" | "frontier";

export interface ResearchResponse {
  output: {
    content: string; // Markdown with [[1, 2]] citations
    content_type: string;
    sources: { url: string; title?: string; snippets?: string[] }[];
  };
}

const TIMEOUTS: Record<ResearchEffort, number> = {
  lite: 20_000,
  standard: 45_000,
  deep: 130_000,
  exhaustive: 310_000,
  frontier: 310_000,
};

/** TODO(Person A): wire for Brief; consider output_schema (structured output) — see docs before using. */
export async function research(input: string, research_effort: ResearchEffort = "lite"): Promise<ResearchResponse> {
  return youFetch<ResearchResponse>(YOU_API, "/v1/research", { input, research_effort }, { timeoutMs: TIMEOUTS[research_effort] });
}

/**
 * TODO(Person B): Deal Check "leverage" — POST https://api.you.com/v1/finance_research.
 * Read https://you.com/docs/guides/finance-research.md for the request shape before wiring.
 */
export async function financeResearch(input: string, research_effort: ResearchEffort = "lite"): Promise<ResearchResponse> {
  return youFetch<ResearchResponse>(YOU_API, "/v1/finance_research", { input, research_effort }, { timeoutMs: TIMEOUTS[research_effort] });
}
