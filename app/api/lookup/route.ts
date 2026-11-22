// OWNER: Person A — pasted company link -> Company (so the creator can pitch a specific brand)
import { NextResponse } from "next/server";
import { USE_MOCKS, sleep } from "@/lib/env";
import { CallLog } from "@/lib/you/client";
import { mockCompanies } from "@/lib/mocks";
import type { ApiResult, Company } from "@/lib/types";
import { toDomain } from "@/lib/domain";

function nameFromDomain(domain: string) {
  const label = domain.split(".")[0];
  return label.split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

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

  // TODO(Person A): extract(`https://${domain}`) for name/description, freshNews(`"${domain}"`, "month")
  // for the latest trigger (launch / funding / marketing hire), then build the Company.
  // imageUrl = first news hit's thumbnail_url; logoUrl = favicon_url (or extract().metadata.favicon_url).
  return NextResponse.json({ error: "Live lookup not wired yet. Run with USE_MOCKS=true." }, { status: 501 });
}
