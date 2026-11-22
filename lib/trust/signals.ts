// OWNER: Person B
import type { Company, TrustSignal } from "@/lib/types";
import type { CallLog } from "@/lib/you/client";
import { search } from "@/lib/you/search";
import { lookupDomain } from "./rdap";

/** A signal plus how much it moves the score (negative = risk). */
export interface WeightedSignal extends TrustSignal {
  weight: number;
}

/**
 * Basic live company check (first version, written so live mode works end to end — Person B can extend it):
 *  - domain age via RDAP (lib/trust/rdap)
 *  - independent coverage: recent results about the brand that are NOT on its own domain
 *  - scam reports: results that pair the brand name with scam / fraud / fake
 * TODO(Person B): add sender/brand mismatch, social profiles, Trustpilot-style reviews, weights tuning.
 */
export async function collectCompanySignals(company: Company, log: CallLog): Promise<WeightedSignal[]> {
  const [domainInfo, coverage, scam] = await Promise.all([
    lookupDomain(company.domain).catch(() => ({ domain: company.domain }) as Awaited<ReturnType<typeof lookupDomain>>),
    log.track("search", `"${company.name}" coverage`, () => search({ query: `"${company.name}"`, count: 10, freshness: "year" })).catch(() => null),
    log.track("search", `"${company.name}" scam reports`, () => search({ query: `"${company.name}" scam OR fraud OR fake brand deal`, count: 10 })).catch(() => null),
  ]);
  const out: WeightedSignal[] = [];
  const rdapUrl = `https://rdap.org/domain/${company.domain}`;

  // Domain age
  if (domainInfo.ageDays == null) {
    out.push({ label: "Domain age unknown", detail: "We couldn't read when the website was registered", weight: 0 });
  } else if (domainInfo.ageDays < 120) {
    out.push({ label: "Brand-new website", detail: `Registered ${domainInfo.ageDays} days ago`, sourceUrl: rdapUrl, weight: -35 });
  } else {
    const years = Math.floor(domainInfo.ageDays / 365);
    out.push({
      label: "Domain age",
      detail: years >= 1 ? `Registered ${domainInfo.registeredAt?.slice(0, 4)} (${years} year${years > 1 ? "s" : ""})` : `Registered ${Math.round(domainInfo.ageDays / 30)} months ago`,
      sourceUrl: rdapUrl,
      weight: years >= 5 ? 20 : years >= 1 ? 10 : 0,
    });
  }

  // Independent coverage
  const hits = [...(coverage?.results.news ?? []), ...(coverage?.results.web ?? [])];
  const independent = hits.filter((h) => !h.url.includes(company.domain));
  const sites = new Set(independent.map((h) => { try { return new URL(h.url).hostname.replace(/^www\./, ""); } catch { return h.url; } }));
  if (sites.size >= 3) out.push({ label: "Independent coverage", detail: `Mentioned on ${sites.size} other sites this year`, sourceUrl: independent[0]?.url, weight: 15 });
  else if (sites.size > 0) out.push({ label: "Little coverage", detail: `Only ${sites.size} other site${sites.size > 1 ? "s" : ""} mention them this year`, sourceUrl: independent[0]?.url, weight: 0 });
  else out.push({ label: "No coverage found", detail: "No other sites mention them this year", weight: -15 });

  // Scam reports. Big real brands get impersonated a lot ("fake JanSport offer"), which says nothing bad
  // about the brand itself. So scam mentions only count against an established brand when its site is new
  // or few others write about it; otherwise we turn them into a warning about impersonators.
  const scamHits = [...(scam?.results.news ?? []), ...(scam?.results.web ?? [])].filter((h) => {
    const text = `${h.title} ${h.description ?? ""} ${(h.snippets ?? []).join(" ")}`.toLowerCase();
    return text.includes(company.name.toLowerCase().split(" ")[0]) && /scam|fraud|fake|impersonat|phishing/.test(text);
  });
  const established = (domainInfo.ageDays ?? 0) > 3 * 365 && sites.size >= 3;
  if (scamHits.length === 0) {
    out.push({ label: "No scam reports", detail: "No results link this brand to scams", weight: 5 });
  } else if (established) {
    out.push({ label: "Watch for impersonators", detail: `Scammers use this brand's name. Only trust offers from @${company.domain}`, sourceUrl: scamHits[0].url, weight: 0 });
  } else if (scamHits.length >= 2) {
    out.push({ label: "Scam reports", detail: `${scamHits.length} results link this name to scams or fake offers`, sourceUrl: scamHits[0].url, weight: -30 });
  } else {
    out.push({ label: "One scam mention", detail: "One result links this name to a scam. Check the sender carefully", sourceUrl: scamHits[0].url, weight: -10 });
  }

  return out;
}

/**
 * TODO(Person B): signals for an inbound offer text:
 *  - extract sender email/domain + links (regex below), compare to brand's real domain
 *  - red flags: free-mail sender, upfront fees, urgency, Telegram/WhatsApp-only, sign-in links
 *  - open each link with lib/you/contents.extract (server-side!) and look for login forms / bad terms
 */
export async function collectOfferSignals(offerText: string, log: CallLog): Promise<WeightedSignal[]> {
  void log;
  return heuristicOfferSignals(offerText); // cheap local heuristics so something works now
}

const URL_RE = /https?:\/\/[^\s)>"']+/g;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/g;

export function extractLinks(text: string): string[] {
  return [...new Set(text.match(URL_RE) ?? [])];
}
export function extractEmails(text: string): string[] {
  return [...new Set(text.match(EMAIL_RE) ?? [])];
}

export function heuristicOfferSignals(text: string): WeightedSignal[] {
  const t = text.toLowerCase();
  const out: WeightedSignal[] = [];
  if (/gmail\.|outlook\.|yahoo\.|hotmail\./.test(t)) out.push({ label: "Free-mail sender", detail: "Brands usually email from their own domain", weight: -25 });
  if (/(pay|cover|fee|shipping).{0,30}\$\d/.test(t)) out.push({ label: "Upfront payment", detail: "Asks the creator to pay", weight: -40 });
  if (/24h|24 hours|limited|urgent|asap/.test(t)) out.push({ label: "Urgency", detail: "Pressure to act fast", weight: -10 });
  if (/telegram|whatsapp/.test(t)) out.push({ label: "Off-platform contact", detail: "Moves conversation to Telegram/WhatsApp", weight: -20 });
  if (/sign in|log in|login|confirm your (channel|account)/.test(t)) out.push({ label: "Sign-in request", detail: "Asks to sign in via a link — account-hijack pattern", weight: -40 });
  if (out.length === 0) out.push({ label: "No obvious red flags", detail: "Heuristics only — verify with live checks", weight: 0 });
  return out;
}
