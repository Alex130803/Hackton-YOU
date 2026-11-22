// OWNER: Person A — Company -> Brief with cited sources
import { NextResponse } from "next/server";
import { USE_MOCKS, sleep } from "@/lib/env";
import { CallLog } from "@/lib/you/client";
import { research } from "@/lib/you/research";
import { mockBriefs } from "@/lib/mocks";
import type { ApiResult, Brief, Company } from "@/lib/types";

export async function POST(req: Request) {
  const { company, niche } = (await req.json()) as { company: Company; niche?: string };
  const log = new CallLog();

  if (USE_MOCKS) {
    await sleep(700);
    log.mock("extract", company.trigger.sourceUrl, 520);
    log.mock("research", "why now + creator fit (lite)", 1900);
    const data: Brief = mockBriefs[company.id] ?? {
      companyId: company.id,
      whyNow: company.trigger.type === "other"
        ? `You picked ${company.name} yourself. Once live research is on, recent launches, funding and hiring news show up here.`
        : company.trigger.summary,
      creatorFit: `Your ${niche ?? company.niche} audience could be a fit. Look at who ${company.name} sells to before you send.`,
      sources: [{ title: `${company.name} website`, url: company.trigger.sourceUrl }],
    };
    return NextResponse.json<ApiResult<Brief>>({ data, calls: log.calls });
  }

  // TODO(Person A): split output.content into whyNow / creatorFit (or use output_schema — check docs).
  const r = await log.track("research", "why now + creator fit", () =>
    research(`Why is now a good time for a ${niche ?? company.niche} content creator to pitch ${company.name} (${company.domain})? Trigger: ${company.trigger.summary}`, "lite"),
  );
  const data: Brief = {
    companyId: company.id,
    whyNow: r.output.content,
    creatorFit: "",
    sources: r.output.sources.map((s) => ({ title: s.title ?? s.url, url: s.url })),
  };
  return NextResponse.json<ApiResult<Brief>>({ data, calls: log.calls });
}
