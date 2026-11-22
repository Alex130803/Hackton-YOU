// OWNER: Person A
import type { Brief, Company, CreatorProfile, Draft } from "@/lib/types";

/**
 * Template draft (works with no keys). Every claim in the message must map to a Brief source.
 * TODO(Person A): replace with an LLM call (LLM_API_KEY) — prompt: only use facts from `brief`,
 * keep it < 480 chars for SMS, return which source URLs were used.
 */
export function draftMessage(company: Company, brief: Brief, creator: CreatorProfile): Draft {
  const links = creator.links.slice(0, 2).join(" · ");
  const message =
    `Hi ${company.name} team! Saw the news: ${company.trigger.summary} ` +
    `${brief.creatorFit} I'd love to create content around it for my ${creator.niche} audience. ` +
    `My work: ${links || "(add your links)"}. Open to a quick chat this week?`;
  return {
    companyId: company.id,
    message,
    citedSourceUrls: [company.trigger.sourceUrl, ...brief.sources.map((s) => s.url)].filter((v, i, a) => a.indexOf(v) === i),
  };
}
