import { search, type SearchHit } from "./search";

// Docs: https://you.com/docs/guides/search/live-news.md
// There is no separate news endpoint: news comes from the Web Search API, ranked by query intent.
// Use `freshness` to keep triggers fresh and read `page_age` for the trigger date.

/**
 * TODO(Person A): tune queries per trigger type, e.g.
 *   `${niche} startup raises seed OR series A`, `${niche} product launch`, `${niche} hiring head of marketing`.
 * Dedupe by domain, map hits -> Company in lib/discover.
 */
export async function freshNews(query: string, freshness: "day" | "week" | "month" = "week"): Promise<SearchHit[]> {
  const res = await search({ query, freshness, count: 20 });
  return [...(res.results.news ?? []), ...(res.results.web ?? [])];
}
