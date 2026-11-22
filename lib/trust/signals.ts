// OWNER: Person B
import type { Company, TrustSignal } from "@/lib/types";
import type { CallLog } from "@/lib/you/client";

/** A signal plus how much it moves the score (negative = risk). */
export interface WeightedSignal extends TrustSignal {
  weight: number;
}

/**
 * TODO(Person B): gather signals in parallel (Promise.all) using You.com:
 *  - search `"${company.name}" scam OR fake offer creator` -> scam reports
 *  - search `site:${company.domain}` vs claimed brand -> sender/brand mismatch
 *  - news coverage count in last 90 days (lib/you/news) -> legitimacy
 *  - lookupDomain(company.domain) (lib/trust/rdap) -> domain age
 * Wrap each You.com call with log.track("search", "...") so the UI timeline shows it.
 */
export async function collectCompanySignals(company: Company, log: CallLog): Promise<WeightedSignal[]> {
  void company;
  void log;
  throw new Error("collectCompanySignals not implemented — run with USE_MOCKS=true");
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
