// OWNER: Person A — niche -> Company[]
import { NextResponse } from "next/server";
import { USE_MOCKS, sleep } from "@/lib/env";
import { CallLog } from "@/lib/you/client";
import { freshNews } from "@/lib/you/news";
import { mockCompanies } from "@/lib/mocks";
import type { ApiResult, Company } from "@/lib/types";

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

  // TODO(Person A): run 3 queries in parallel (launch, funding, marketing hire), map hits -> Company,
  // dedupe by domain, keep only items with page_age in the last ~30 days.
  const hits = await log.track("news", `${niche} funding launch hiring`, () => freshNews(`${niche} startup funding OR launch OR hiring marketing`));
  void hits;
  return NextResponse.json<ApiResult<Company[]>>({ data: [], calls: log.calls }, { status: 501 });
}
