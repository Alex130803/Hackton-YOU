// OWNER: Person A
import type { Brief, Company, CreatorProfile, Draft } from "@/lib/types";

/**
 * Template draft (works with no keys). Every claim in the message must map to a Brief source.
 * TODO(Person A): replace with an LLM call (LLM_API_KEY) — prompt: only use facts from `brief`,
 * keep it < 480 chars for SMS, return which source URLs were used.
 */
export function draftMessage(company: Company, brief: Brief, creator: CreatorProfile): Draft {
  const links = creator.links.slice(0, 2).join(" · ");
  const hook = company.trigger.type === "other"
    ? `I've been following ${company.name} and I think my audience would love what you make.`
    : `Saw the news: ${company.trigger.summary} ${brief.creatorFit}`;
  const message =
    `Hi ${company.name} team! ${hook} ` +
    `I'd love to create content with you for my ${creator.niche} audience. ` +
    `My work: ${links || "(add your links)"}. Open to a quick chat this week?`;
  return {
    companyId: company.id,
    message,
    citedSourceUrls: [company.trigger.sourceUrl, ...brief.sources.map((s) => s.url)].filter((v, i, a) => a.indexOf(v) === i),
  };
}
