// OWNER: Person A — niche -> Company[] (live: You.com Research finds brands with a fresh trigger)
import { NextResponse } from "next/server";
import { USE_MOCKS, sleep } from "@/lib/env";
import { CallLog } from "@/lib/you/client";
import { researchStructured } from "@/lib/you/research";
import { coverFor, logoFor } from "@/lib/live/images";
import { toDomain } from "@/lib/domain";
import { mockCompanies } from "@/lib/mocks";
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

export async function POST(req: Request) {
  const { niche = "" } = (await req.json()) as { niche?: string };
  const log = new CallLog();

  if (USE_MOCKS) {
    await sleep(500);
    log.mock("search", `"${niche}" launches / funding / marketing hires`, 420);
    log.mock("news", "freshness=week", 380);
    const data = mockCompanies.map((c) => ({ ...c, niche: niche || c.niche }));
    return NextResponse.json<ApiResult<Company[]>>({ data, calls: log.calls });
  }

  try {
    const today = new Date().toISOString().slice(0, 10);
    const { content } = await log.track("research", `brands in "${niche}" with a fresh trigger`, () =>
      researchStructured<{ companies: Found[] }>(
        `Find 6 real brands in the niche "${niche}" that in the last 60 days (today is ${today}) launched a new product, raised funding, ` +
          `or posted a job for influencer or creator marketing. They should be brands a content creator could pitch for a paid collaboration. ` +
          `For each give the brand's own official website domain (not a news site or marketplace), the trigger type, one plain sentence about what happened, ` +
          `the URL of the article or page that reports it, and the date (YYYY-MM-DD).`,
        SCHEMA,
      ),
    );

    const seen = new Set<string>();
    const found = (content.companies ?? [])
      .map((f) => ({ ...f, domain: toDomain(f.domain) ?? "" }))
      .filter((f) => {
        if (!f.domain || NOT_A_BRAND.test(f.domain) || seen.has(f.domain)) return false;
        seen.add(f.domain);
        return true;
      });

    const data: Company[] = await Promise.all(
      found.map(async (f) => {
        const { imageUrl } = await coverFor(f.name, f.domain, f.source_url, log);
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
    return NextResponse.json<ApiResult<Company[]>>({ data, calls: log.calls });
  } catch (e) {
    return NextResponse.json({ error: `Couldn't find brands right now (${(e as Error).message.slice(0, 120)}). Try Refresh.` }, { status: 502 });
  }
}
