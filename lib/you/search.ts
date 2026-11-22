import { youFetch, YOU_INDEX } from "./client";

// Docs: https://you.com/docs/guides/search.md , https://you.com/docs/guides/search/request-controls.md
export interface SearchParams {
  query: string;
  count?: number; // default 10, max 100
  freshness?: "day" | "week" | "month" | "year" | string; // or "YYYY-MM-DDtoYYYY-MM-DD"
  country?: string; // ISO 3166-1 alpha-2
  language?: string; // BCP 47
  safesearch?: "off" | "moderate" | "strict";
}

export interface SearchHit {
  url: string;
  title: string;
  description?: string;
  snippets?: string[];
  page_age?: string;
  thumbnail_url?: string; // article/page image -> Company.imageUrl
  favicon_url?: string; // site icon -> Company.logoUrl
}

export interface SearchResponse {
  results: { web?: SearchHit[]; news?: SearchHit[] };
  metadata: { query: string; search_uuid: string; latency: number };
}

/**
 * TODO(Person A): wire and test against the live API.
 * POST https://ydc-index.io/v1/search  — raw call returns `snippets` unless `extraction` is passed.
 * Re-read the docs before adding params (domain filters, extraction, pagination); don't guess.
 */
export async function search(params: SearchParams): Promise<SearchResponse> {
  return youFetch<SearchResponse>(YOU_INDEX, "/v1/search", params);
}
