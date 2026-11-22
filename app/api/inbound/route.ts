// OWNER: Person B — offer text -> DealCheck (TrustVerdict + link scans + fair rate + reply)
import { NextResponse } from "next/server";
import { USE_MOCKS, sleep } from "@/lib/env";
import { CallLog } from "@/lib/you/client";
import { collectOfferSignals, extractLinks } from "@/lib/trust/signals";
import { scoreSignals } from "@/lib/trust/score";
import { mockOffers } from "@/lib/mocks";
import { screenshotResultFor } from "@/lib/mocks/screenshots";
import type { ApiResult, DealCheck } from "@/lib/types";

export async function POST(req: Request) {
  const { text = "" } = (await req.json()) as { text?: string };
  const log = new CallLog();

  if (USE_MOCKS) {
    await sleep(900);
    log.mock("search", "sender domain vs brand site", 340);
    log.mock("search", "creator scam reports", 360);
    log.mock("extract", "open brief link server-side", 610);
    log.mock("research", "fair rate (research_effort=lite)", 2100);
    log.mock("finance_research", "brand earnings leverage", 1800);
    const known = mockOffers.find((o) => o.text.trim() === text.trim())?.result ?? screenshotResultFor(text);
    console.log("[inbound] mock", { chars: text.length, known: !!known });
    if (known) return NextResponse.json<ApiResult<DealCheck>>({ data: known, calls: log.calls });
  }

  // Heuristic fallback (also used for pasted text that isn't a mock sample).
  // TODO(Person B): replace with live signals + extract() each link + research() fair rate.
  const verdict = scoreSignals(await collectOfferSignals(text, log));
  const data: DealCheck = {
    verdict,
    linkScans: extractLinks(text).map((url) => ({ url, verdict: "suspicious", findings: ["Not scanned yet — Extract not wired"] })),
    suggestedReply:
      verdict.level === "red"
        ? "Thanks, but I only work through official brand email domains. Please send details from your company address."
        : "Thanks for reaching out! Could you share the deliverables, usage rights and budget so I can review?",
  };
  return NextResponse.json<ApiResult<DealCheck>>({ data, calls: log.calls });
}
