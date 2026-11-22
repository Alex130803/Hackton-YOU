// OWNER: Person A — pick a cover photo and logo for a company from You.com search results.
import { search, type SearchHit } from "@/lib/you/search";
import type { CallLog } from "@/lib/you/client";

/** Logo: You.com's favicon service (public, no key). Same URL format as `favicon_url` in search results. */
export const logoFor = (domain: string) => `https://you.com/favicon?domain=${encodeURIComponent(domain)}&size=128`;

// Images that are never a good cover: logos and icons, rating badges, app-store art, data-site cards,
// and Wikipedia (it often matches the word, not the brand: "Osprey" the bird).
const NOT_A_PHOTO =
  /logo|favicon|icon|sprite|avatar|badge|placeholder|company-rating|android-chrome|apple-touch|\.svg(\?|$)|wikimedia|wikipedia|trustpilot|tracxn|crunchbase|linktr\.ee|play-lh\.googleusercontent|mzstatic|licdn|pitchbook|globenewswire\.com\/Resource|gravatar|brandfetch/i;
// The URL has to look like an image: a file extension, or an image CDN / image path.
const LOOKS_LIKE_IMAGE = /\.(jpe?g|png|webp|avif)(\?|$)|scene7|\/image|\/img|\/media|cdn|static/i;

export const isGoodPhoto = (url?: string): url is string => !!url && /^https?:\/\//i.test(url) && !NOT_A_PHOTO.test(url) && LOOKS_LIKE_IMAGE.test(url);

const onDomain = (url: string, domain: string) => {
  try { return new URL(url).hostname.replace(/^www\./, "").endsWith(domain.replace(/^www\./, "")); } catch { return false; }
};

/** The page's share image (og:image / twitter:image), read from the first part of its HTML. */
async function shareImage(pageUrl: string, timeoutMs = 2500): Promise<string | undefined> {
  try {
    const res = await fetch(pageUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15", Accept: "text/html" },
      signal: AbortSignal.timeout(timeoutMs),
      redirect: "follow",
    });
    if (!res.ok) return undefined;
    const html = (await res.text()).slice(0, 300_000);
    const m = html.match(/<meta[^>]+(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image)["'][^>]*>/i);
    const content = m?.[0].match(/content=["']([^"']+)["']/i)?.[1]?.replace(/&amp;/g, "&");
    return content ? new URL(content, res.url).toString() : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Cover photo, best first:
 *  1. a thumbnail from the brand's own site (product and campaign shots),
 *  2. the thumbnail of the article that triggered the suggestion,
 *  3. any other recent result about the brand with a real photo,
 *  4. the brand homepage's share image.
 * Logos, icons, badges and other non-photos are skipped; no photo -> undefined (the card falls back to the logo).
 */
export async function coverFor(name: string, domain: string, sourceUrl: string | undefined, log: CallLog): Promise<{ imageUrl?: string; hits: SearchHit[] }> {
  const homepage = shareImage(`https://${domain}`); // in parallel with the search; only used if nothing better turns up
  let hits: SearchHit[] = [];
  try {
    const res = await log.track("search", `"${name}" image`, () => search({ query: `"${name}" ${domain}`, count: 10, freshness: "year" }));
    hits = [...(res.results.news ?? []), ...(res.results.web ?? [])];
  } catch { /* fall through to the homepage image */ }
  const photos = hits.filter((h) => isGoodPhoto(h.thumbnail_url));
  const pick =
    photos.find((h) => onDomain(h.url, domain)) ??
    (sourceUrl ? photos.find((h) => h.url === sourceUrl) : undefined) ??
    photos[0];
  if (pick) return { imageUrl: pick.thumbnail_url, hits };
  const home = await homepage;
  return { imageUrl: isGoodPhoto(home) ? home : undefined, hits };
}
