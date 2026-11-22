// OWNER: Person A — Company -> Brief with cited sources (live: You.com Research)
// Speed: "lite" research answering in JSON (~5s); structured "standard" (~20-30s) only when lite's answer can't be used.
// Cached in SQLite for 24h per brand + creator, so opening the same brand again is instant.
import { NextResponse } from "next/server";
import { USE_MOCKS, sleep } from "@/lib/env";
import { CallLog } from "@/lib/you/client";
import { research, researchStructured } from "@/lib/you/research";
import { getCached, setCached, HOUR } from "@/lib/cache";
import { mockBriefs } from "@/lib/mocks";
import type { ApiResult, Brief, Company } from "@/lib/types";

export const maxDuration = 60;

const SCHEMA = {
  type: "object",
  properties: {
    why_now: { type: "string" },
    why_you: { type: "string" },
    phone: { type: ["string", "null"] },
    email: { type: ["string", "null"] },
    contact_source_url: { type: ["string", "null"] },
    sms_message: { type: "string" },
  },
  required: ["why_now", "why_you", "phone", "email", "contact_source_url", "sms_message"],
  additionalProperties: false,
};

const clean = (t: string) => t.replace(/\s*\[\[[\d,\s]+\]\]/g, "").trim();

/** Keep a phone number only if it looks like one (7+ digits); never show half-guesses. */
function cleanPhone(p: string | null): string | null {
  if (!p) return null;
  const v = p.replace(/[^\d+()\-.\s]/g, "").trim();
  return v.replace(/\D/g, "").length >= 7 ? v : null;
}

interface Out { why_now: string; why_you: string; phone: string | null; email: string | null; contact_source_url: string | null; sms_message: string }

/** Pull the JSON object out of lite research's answer; null if a required field is missing. */
function parseOut(text: string): Out | null {
  const a = text.indexOf("{"), b = text.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  try {
    const o = JSON.parse(text.slice(a, b + 1)) as Partial<Out>;
    if (!o.why_now || !o.why_you || !o.sms_message) return null;
    const str = (v: unknown) => (typeof v === "string" && v.trim() && v !== "null" ? v.trim() : null);
    return { why_now: o.why_now, why_you: o.why_you, sms_message: o.sms_message, phone: str(o.phone), email: str(o.email), contact_source_url: str(o.contact_source_url) };
  } catch {
    return null;
  }
}

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

  const key = `brief:${company.domain}:${creatorNiche.trim().toLowerCase()}:${links.join(",")}`;
  const hit = getCached<Brief>(key, 24 * HOUR);
  if (hit) return NextResponse.json<ApiResult<Brief>>({ data: { ...hit, companyId: company.id }, calls: log.calls });

  try {
    const ask =
      `A content creator in the niche "${creatorNiche}" (channels: ${links.join(", ") || "not given"}) wants to pitch ${company.name} (${company.domain}) for a paid collaboration. ` +
      `Recent news: ${company.trigger.summary} (${company.trigger.sourceUrl}). ` +
      `Write two short, plain-English paragraphs, 2 sentences each, using only facts you can source: ` +
      `"why_now": why this is a good moment to reach out (recent launch, funding, campaigns, hiring); ` +
      `"why_you": why a ${creatorNiche} creator's audience fits ${company.name}'s customers and products. ` +
      `"phone": the public phone number ${company.name} lists for partnerships, press, marketing or, if none, general business contact, exactly as published on their official website or an official listing (null if you can't find one; never guess). ` +
      `"email": the matching public email for partnerships or press (null if none). "contact_source_url": the page where you found them (null if none). ` +
      `"sms_message": a short SMS from the creator to ${company.name}, first person, max 230 characters, 2-3 plain sentences: mention the specific recent news, ` +
      `say in concrete words what the creator would make and why their audience fits, and ask for a quick chat. No greeting, no links, no hashtags, no emojis, no sign-off.`;

    // Fast path: lite research, told to answer with one bare JSON object.
    let content: Out | null = null;
    let sources: { url: string; title?: string }[] = [];
    try {
      const r = await log.track("research", `why now + fit for ${company.name} (lite)`, () =>
        research(`${ask} Answer ONLY with one JSON object, no prose and no citations: {"why_now":"","why_you":"","phone":null,"email":null,"contact_source_url":null,"sms_message":""}`, "lite"),
      );
      content = parseOut(r.output.content);
      sources = r.output.sources ?? [];
    } catch { /* fall through to structured */ }
    // Fallback: structured output (slower, always valid JSON).
    if (!content) {
      const r = await log.track("research", `why now + fit for ${company.name} (structured)`, () => researchStructured<Out>(ask, SCHEMA));
      content = r.content;
      sources = r.sources;
    }

    const data: Brief = {
      companyId: company.id,
      whyNow: clean(content.why_now),
      creatorFit: clean(content.why_you),
      contact: { phone: cleanPhone(content.phone), email: content.email || null, sourceUrl: content.contact_source_url || null },
      suggestedMessage: clean(content.sms_message),
      sources: [
        { title: "The news that triggered this", url: company.trigger.sourceUrl },
        ...sources.slice(0, 4).map((s) => ({ title: s.title || s.url, url: s.url })),
      ].filter((s, i, a) => a.findIndex((x) => x.url === s.url) === i),
    };
    setCached(key, data);
    return NextResponse.json<ApiResult<Brief>>({ data, calls: log.calls });
  } catch (e) {
    return NextResponse.json({ error: `Research didn't finish (${(e as Error).message.slice(0, 120)}). Try again.` }, { status: 502 });
  }
}
