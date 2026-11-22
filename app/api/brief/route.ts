// OWNER: Person A — Company -> Brief with cited sources (live: You.com Research with structured output)
import { NextResponse } from "next/server";
import { USE_MOCKS, sleep } from "@/lib/env";
import { CallLog } from "@/lib/you/client";
import { researchStructured } from "@/lib/you/research";
import { mockBriefs } from "@/lib/mocks";
import type { ApiResult, Brief, Company } from "@/lib/types";

export const maxDuration = 60;

const SCHEMA = {
  type: "object",
  properties: {
    why_now: { type: "string" },
    why_you: { type: "string" },
  },
  required: ["why_now", "why_you"],
  additionalProperties: false,
};

const clean = (t: string) => t.replace(/\s*\[\[[\d,\s]+\]\]/g, "").trim();

export async function POST(req: Request) {
  const { company, niche, links = [] } = (await req.json()) as { company: Company; niche?: string; links?: string[] };
  const log = new CallLog();
  const creatorNiche = niche ?? company.niche;

  if (USE_MOCKS) {
    await sleep(700);
    log.mock("extract", company.trigger.sourceUrl, 520);
    log.mock("research", "why now + creator fit (lite)", 1900);
    const data: Brief = mockBriefs[company.id] ?? {
      companyId: company.id,
      whyNow: company.trigger.type === "other"
        ? `You picked ${company.name} yourself. Once live research is on, recent launches, funding and hiring news show up here.`
        : company.trigger.summary,
      creatorFit: `Your ${creatorNiche} audience could be a fit. Look at who ${company.name} sells to before you send.`,
      sources: [{ title: `${company.name} website`, url: company.trigger.sourceUrl }],
    };
    return NextResponse.json<ApiResult<Brief>>({ data, calls: log.calls });
  }

  try {
    const { content, sources } = await log.track("research", `why now + fit for ${company.name}`, () =>
      researchStructured<{ why_now: string; why_you: string }>(
        `A content creator in the niche "${creatorNiche}" (channels: ${links.join(", ") || "not given"}) wants to pitch ${company.name} (${company.domain}) for a paid collaboration. ` +
          `Recent news: ${company.trigger.summary} (${company.trigger.sourceUrl}). ` +
          `Write two short, plain-English paragraphs, 2 sentences each, using only facts you can source: ` +
          `"why_now": why this is a good moment to reach out (recent launch, funding, campaigns, hiring); ` +
          `"why_you": why a ${creatorNiche} creator's audience fits ${company.name}'s customers and products.`,
        SCHEMA,
      ),
    );
    const data: Brief = {
      companyId: company.id,
      whyNow: clean(content.why_now),
      creatorFit: clean(content.why_you),
      sources: [
        { title: "The news that triggered this", url: company.trigger.sourceUrl },
        ...sources.slice(0, 4).map((s) => ({ title: s.title || s.url, url: s.url })),
      ].filter((s, i, a) => a.findIndex((x) => x.url === s.url) === i),
    };
    return NextResponse.json<ApiResult<Brief>>({ data, calls: log.calls });
  } catch (e) {
    return NextResponse.json({ error: `Research didn't finish (${(e as Error).message.slice(0, 120)}). Try again.` }, { status: 502 });
  }
}
