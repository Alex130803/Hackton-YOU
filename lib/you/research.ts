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

/**
 * Research with `output_schema`: `output.content` comes back as a JSON object.
 * Docs: https://you.com/docs/guides/research/structured-output.md — needs effort "standard" or higher
 * (lite returns 422). Schema rules: object root, every property required (use ["string","null"] for optional),
 * additionalProperties: false everywhere.
 */
export async function researchStructured<T>(
  input: string,
  output_schema: Record<string, unknown>,
  research_effort: Exclude<ResearchEffort, "lite"> = "standard",
): Promise<{ content: T; sources: ResearchResponse["output"]["sources"] }> {
  const r = await youFetch<{ output: { content: T; content_type: string; sources: ResearchResponse["output"]["sources"] } }>(
    YOU_API, "/v1/research", { input, research_effort, output_schema }, { timeoutMs: TIMEOUTS[research_effort] },
  );
  return { content: r.output.content, sources: r.output.sources ?? [] };
}
