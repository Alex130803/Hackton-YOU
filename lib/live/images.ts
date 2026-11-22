// OWNER: Person A — pick a cover image and logo for a company from You.com search results.
import { search, type SearchHit } from "@/lib/you/search";
import type { CallLog } from "@/lib/you/client";

/** Logo: You.com's favicon service (public, no key). Same URL format as `favicon_url` in search results. */
export const logoFor = (domain: string) => `https://you.com/favicon?domain=${encodeURIComponent(domain)}&size=128`;

/**
 * Cover: the thumbnail of the article that triggered the suggestion if we can find it,
 * otherwise the first recent result about the company that has a thumbnail.
 */
export async function coverFor(name: string, domain: string, sourceUrl: string | undefined, log: CallLog): Promise<{ imageUrl?: string; hits: SearchHit[] }> {
  try {
    const res = await log.track("search", `"${name}" image`, () => search({ query: `"${name}" ${domain}`, count: 8, freshness: "year" }));
    const hits = [...(res.results.news ?? []), ...(res.results.web ?? [])];
    const exact = sourceUrl ? hits.find((h) => h.url === sourceUrl && h.thumbnail_url) : undefined;
    const any = hits.find((h) => h.thumbnail_url && !/logo|favicon|avatar|icon/i.test(h.thumbnail_url));
    return { imageUrl: (exact ?? any)?.thumbnail_url, hits };
  } catch {
    return { hits: [] };
  }
}
