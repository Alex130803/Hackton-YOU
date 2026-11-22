// OWNER: Person A — pasted company link -> Company (so the creator can pitch a specific brand)
import { NextResponse } from "next/server";
import { USE_MOCKS, sleep } from "@/lib/env";
import { CallLog } from "@/lib/you/client";
import { extract } from "@/lib/you/contents";
import { search } from "@/lib/you/search";
import { coverFor, logoFor } from "@/lib/live/images";
import { mockCompanies } from "@/lib/mocks";
import type { ApiResult, Company, TriggerType } from "@/lib/types";
import { toDomain } from "@/lib/domain";

function nameFromDomain(domain: string) {
  const label = domain.split(".")[0];
  return label.split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function triggerType(text: string): TriggerType {
  const t = text.toLowerCase();
  if (/rais(es|ed)|funding|series [a-d]|seed round|invest/.test(t)) return "funding";
  if (/hiring|hires|job opening|influencer marketing|creator marketing/.test(t)) return "marketing_hire";
  if (/launch|unveil|introduc|debut|releases?|new collection|new line|\badds\b|\bnew\b/.test(t)) return "launch";
  return "other";
}

/** "Patagonia | Outdoor Clothing & Gear" -> "Patagonia" */
const cleanTitle = (t?: string) => (t ?? "").split(/\s[|–—-]\s|:\s/)[0].trim();

export async function POST(req: Request) {
  const { url = "", niche = "" } = (await req.json()) as { url?: string; niche?: string };
  const domain = toDomain(url);
  if (!domain) return NextResponse.json({ error: "That doesn't look like a website. Try something like acme.com" }, { status: 400 });
  const log = new CallLog();

  if (USE_MOCKS) {
    await sleep(600);
    log.mock("extract", `https://${domain}`, 540);
    log.mock("news", `"${domain}" news, freshness=month`, 360);
    const known = mockCompanies.find((c) => c.domain === domain);
    const data: Company = known ?? {
      id: `user_${domain}`,
      name: nameFromDomain(domain),
      domain,
      niche,
      trigger: {
        type: "other",
        summary: "Added by you. No recent news found in demo mode.",
        sourceUrl: `https://${domain}`,
        date: new Date().toISOString().slice(0, 10),
      },
      contactHints: [`Look for a partnerships or contact page on ${domain}`],
      logoUrl: `https://you.com/favicon?domain=${domain}&size=128`, // works without a key
    };
    return NextResponse.json<ApiResult<Company>>({ data, calls: log.calls });
  }

  try {
    const today = new Date().toISOString().slice(0, 10);
    // Homepage (name) and recent news (trigger) in parallel.
    const [page, news] = await Promise.all([
      log.track("extract", `https://${domain}`, () => extract(`https://${domain}`)).catch(() => null),
      log.track("news", `"${domain.split(".")[0]}" news, last month`, () =>
        search({ query: `${domain.split(".")[0]} announces OR launches OR raises OR new`, count: 10, freshness: "month" })).catch(() => null),
    ]);
    const name = cleanTitle(page?.metadata?.site_name) || cleanTitle(page?.title) || nameFromDomain(domain);
    // Prefer real news from the last ~60 days that mentions the brand; never encyclopedias, socials or shops.
    const NOT_NEWS = /(wikipedia|linkedin|facebook|instagram|tiktok|youtube|x\.com|twitter|reddit|amazon|ebay|pinterest)\./i;
    const label = domain.split(".")[0].toLowerCase();
    const cutoff = Date.now() - 60 * 86_400_000;
    const hits = [...(news?.results.news ?? []), ...(news?.results.web ?? [])].filter(
      (h) => !NOT_NEWS.test(h.url) && (!h.page_age || new Date(h.page_age).getTime() > cutoff),
    );
    const mentions = (h: (typeof hits)[number]) => `${h.title} ${h.description ?? ""}`.toLowerCase().includes(label);
    const hit = hits.find((h) => mentions(h) && !h.url.includes(domain)) ?? hits.find((h) => mentions(h));
    const imageUrl = hit?.thumbnail_url ?? (await coverFor(name, domain, undefined, log)).imageUrl;

    const data: Company = {
      id: `live_${domain}`,
      name,
      domain,
      niche,
      trigger: hit
        ? { type: triggerType(`${hit.title} ${hit.description ?? ""}`), summary: hit.title, sourceUrl: hit.url, date: hit.page_age?.slice(0, 10) ?? today }
        : { type: "other", summary: "Added by you. No news about them in the last month.", sourceUrl: `https://${domain}`, date: today },
      contactHints: [`Look for a partnerships or press contact on ${domain}`],
      imageUrl,
      logoUrl: logoFor(domain),
    };
    return NextResponse.json<ApiResult<Company>>({ data, calls: log.calls });
  } catch (e) {
    return NextResponse.json({ error: `Couldn't look up ${domain} (${(e as Error).message.slice(0, 120)}).` }, { status: 502 });
  }
}
