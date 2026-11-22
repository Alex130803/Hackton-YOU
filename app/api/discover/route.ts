// OWNER: Person A — niche -> Company[] (live: You.com Research finds brands with a fresh trigger)
// Speed: "lite" research answering in JSON (~4s) instead of structured "standard" (~20s); structured is only the
// fallback when lite's answer can't be parsed. Results are cached in SQLite, so a repeat search is instant.
import { NextResponse } from "next/server";
import { USE_MOCKS, sleep } from "@/lib/env";
import { CallLog } from "@/lib/you/client";
import { research, researchStructured } from "@/lib/you/research";
import { getCached, setCached, HOUR } from "@/lib/cache";
import { coverFor, logoFor } from "@/lib/live/images";
import { toDomain } from "@/lib/domain";
import { mockCompanies, mockCompaniesMore } from "@/lib/mocks";
import type { ApiResult, Company, TriggerType } from "@/lib/types";

export const maxDuration = 60;

interface Found { name: string; domain: string; trigger_type: TriggerType; summary: string; source_url: string; date: string | null }

const SCHEMA = {
  type: "object",
  properties: {
    companies: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          domain: { type: "string" },
          trigger_type: { type: "string", enum: ["launch", "funding", "marketing_hire", "other"] },
          summary: { type: "string" },
          source_url: { type: "string" },
          date: { type: ["string", "null"] },
        },
        required: ["name", "domain", "trigger_type", "summary", "source_url", "date"],
        additionalProperties: false,
      },
    },
  },
  required: ["companies"],
  additionalProperties: false,
};

// News sites and marketplaces that are never the brand itself.
const NOT_A_BRAND = /(gearjunkie|prnewswire|businesswire|globenewswire|techcrunch|outdoorindustry|forbes|reuters|bloomberg|linkedin|indeed|amazon|wikipedia|youtube|instagram|tiktok|medium)\./i;

const TRIGGERS: TriggerType[] = ["launch", "funding", "marketing_hire", "other"];

/** Pull the JSON array out of lite research's answer (it may wrap it in a code fence or add a line of text). */
function parseFound(text: string): Found[] {
  const a = text.indexOf("["), b = text.lastIndexOf("]");
  if (a < 0 || b <= a) return [];
  try {
    const raw = JSON.parse(text.slice(a, b + 1)) as Partial<Found>[];
    return raw
      .filter((f) => f && typeof f.name === "string" && typeof f.domain === "string" && f.name && f.domain)
      .map((f) => ({
        name: f.name!,
        domain: f.domain!,
        trigger_type: TRIGGERS.includes(f.trigger_type as TriggerType) ? (f.trigger_type as TriggerType) : "other",
        summary: String(f.summary ?? "").replace(/\s*\[\[[\d,\s]+\]\]/g, "").trim(),
        source_url: String(f.source_url ?? ""),
        date: typeof f.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(f.date) ? f.date : null,
      }));
  } catch {
    return [];
  }
}

export async function POST(req: Request) {
  // `exclude`: domains already shown on earlier pages, so every page brings new brands.
  // `fresh`: skip the cache (the Refresh button).
  const { niche = "", exclude = [], fresh = false } = (await req.json()) as { niche?: string; exclude?: string[]; fresh?: boolean };
  const log = new CallLog();

  if (USE_MOCKS) {
    await sleep(500);
    log.mock("search", `"${niche}" launches / funding / marketing hires`, 420);
    log.mock("news", "freshness=week", 380);
    const pool = exclude.length ? mockCompaniesMore : mockCompanies;
    const data = pool.filter((c) => !exclude.includes(c.domain)).map((c) => ({ ...c, niche: niche || c.niche }));
    return NextResponse.json<ApiResult<Company[]>>({ data, calls: log.calls });
  }

  const key = `discover2:${niche.trim().toLowerCase()}:${[...exclude].sort().join(",")}`;
  if (!fresh) {
    const hit = getCached<Company[]>(key, 6 * HOUR);
    if (hit) return NextResponse.json<ApiResult<Company[]>>({ data: hit, calls: log.calls });
  }

  try {
    const today = new Date().toISOString().slice(0, 10);
    const ask =
      `Find 8 real brands in the niche "${niche}" that in the last 60 days (today is ${today}) launched a new product, raised funding, ` +
      `or posted a job for influencer or creator marketing. They should be brands a content creator could pitch for a paid collaboration. ` +
      `For each give the brand's own official website domain (not a news site or marketplace), the trigger type, one plain sentence about what happened, ` +
      `the URL of the article or page that reports it, and the date (YYYY-MM-DD).` +
      (exclude.length ? ` Do not include any of these brands, they were already suggested: ${exclude.join(", ")}.` : "");

    // Fast path: lite research, told to answer with a bare JSON array.
    let companies = await log
      .track("research", `brands in "${niche}" (lite)`, () =>
        research(`${ask} Answer ONLY with a JSON array, no prose and no citations: [{"name":"","domain":"","trigger_type":"launch|funding|marketing_hire|other","summary":"","source_url":"","date":"YYYY-MM-DD"}]`, "lite"),
      )
      .then((r) => parseFound(r.output.content))
      .catch(() => [] as Found[]);
    // Fallback: structured output (slower, always valid JSON).
    if (companies.length < 3) {
      const { content } = await log.track("research", `brands in "${niche}" (structured)`, () =>
        researchStructured<{ companies: Found[] }>(ask, SCHEMA),
      );
      companies = content.companies ?? [];
    }
    const content = { companies };

    const seen = new Set<string>();
    const found = (content.companies ?? [])
      .map((f) => ({ ...f, domain: toDomain(f.domain) ?? "" }))
      .filter((f) => {
        if (!f.domain || NOT_A_BRAND.test(f.domain) || seen.has(f.domain) || exclude.includes(f.domain)) return false;
        seen.add(f.domain);
        return true;
      });

    let data: Company[] = await Promise.all(
      found.map(async (f) => {
        // Never let a slow image lookup hold up the list: after 4s the brand counts as having no photo.
        const { imageUrl } = await Promise.race([coverFor(f.name, f.domain, f.source_url, log), sleep(4000).then(() => ({ imageUrl: undefined }))]);
        return {
          id: `live_${f.domain}`,
          name: f.name,
          domain: f.domain,
          niche,
          trigger: { type: f.trigger_type, summary: f.summary, sourceUrl: f.source_url, date: f.date ?? today },
          contactHints: [`Look for a partnerships or press contact on ${f.domain}`],
          imageUrl,
          logoUrl: logoFor(f.domain),
        };
      }),
    );
    // Show brands with a real photo; brands with only a logo are dropped, unless that would leave fewer than 3.
    const withPhoto = data.filter((c) => c.imageUrl);
    if (withPhoto.length >= 3) data = withPhoto;
    if (data.length) setCached(key, data);
    return NextResponse.json<ApiResult<Company[]>>({ data, calls: log.calls });
  } catch (e) {
    return NextResponse.json({ error: `Couldn't find brands right now (${(e as Error).message.slice(0, 120)}). Try Refresh.` }, { status: 502 });
  }
}
