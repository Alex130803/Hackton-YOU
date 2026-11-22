// OWNER: Person A
import type { Brief, Company, CreatorProfile, Draft } from "@/lib/types";

/** First sentence, without the trailing period, capped so the SMS stays short. */
function firstSentence(text: string, max = 140): string {
  const s = text.split(/(?<=[.!?])\s/)[0].replace(/[.!?]$/, "").trim();
  return s.length > max ? `${s.slice(0, max).replace(/\s+\S*$/, "")}…` : s;
}

/**
 * Template draft (works with no keys), written as a short SMS (~2 segments).
 * It only uses the trigger (which has a source) and the creator's own profile, so every claim is sourced.
 * TODO(Person A): replace with an LLM call (LLM_API_KEY) — prompt: only use facts from `brief`,
 * keep it < 320 chars for SMS, return which source URLs were used.
 */
export function draftMessage(company: Company, brief: Brief, creator: CreatorProfile): Draft {
  const links = creator.links.slice(0, 2).join(" · ");
  const hook = company.trigger.type === "other"
    ? `I've been following ${company.name} and think my audience would love what you make.`
    : `Saw the news: ${firstSentence(company.trigger.summary)}. Congrats!`;
  const message =
    `Hi ${company.name} team! ${hook} ` +
    `I make ${creator.niche} content and my audience is exactly who you build for. ` +
    `I'd love to work together. My work: ${links || "(add your links)"}. Open to a quick chat this week?`;
  return {
    companyId: company.id,
    message,
    citedSourceUrls: [company.trigger.sourceUrl, ...brief.sources.map((s) => s.url)].filter((v, i, a) => a.indexOf(v) === i),
  };
}
