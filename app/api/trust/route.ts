// OWNER: Person B — Company -> TrustVerdict
import { NextResponse } from "next/server";
import { USE_MOCKS, sleep } from "@/lib/env";
import { CallLog } from "@/lib/you/client";
import { collectCompanySignals } from "@/lib/trust/signals";
import { scoreSignals } from "@/lib/trust/score";
import { mockVerdicts } from "@/lib/mocks";
import { getCached, setCached, HOUR } from "@/lib/cache";
import type { ApiResult, Company, TrustVerdict } from "@/lib/types";

export async function POST(req: Request) {
  const { company } = (await req.json()) as { company: Company };
  const log = new CallLog();

  if (USE_MOCKS) {
    await sleep(400);
    log.mock("search", `"${company.name}" scam reports`, 310);
    log.mock("search", `${company.domain} brand match`, 290);
    const data: TrustVerdict = mockVerdicts[company.id] ?? {
      level: "yellow",
      score: 50,
      signals: [{ label: "Not much to go on yet", detail: "We found little about this company. Check their website and socials before you pitch." }],
    };
    return NextResponse.json<ApiResult<TrustVerdict>>({ data, calls: log.calls });
  }

  // Same domain checked in the last 24h: reuse the verdict (domain age and coverage barely change in a day).
  const key = `trust:${company.domain}`;
  const hit = getCached<TrustVerdict>(key, 24 * HOUR);
  if (hit) return NextResponse.json<ApiResult<TrustVerdict>>({ data: hit, calls: log.calls });

  const signals = await collectCompanySignals(company, log);
  const data = scoreSignals(signals, 55);
  setCached(key, data);
  return NextResponse.json<ApiResult<TrustVerdict>>({ data, calls: log.calls });
}
