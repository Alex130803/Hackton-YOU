// OWNER: Person A
import type { Brief, Company, CreatorProfile, Draft } from "@/lib/types";

/** First sentence, without the trailing period, capped so the SMS stays short. */
function firstSentence(text: string, max = 140): string {
  const s = text.split(/(?<=[.!?])\s/)[0].replace(/[.!?]$/, "").trim();
  return s.length > max ? `${s.slice(0, max).replace(/\s+\S*$/, "")}…` : s;
}

const NETWORKS: [RegExp, string][] = [
  [/youtube\.com|youtu\.be/i, "YouTube"],
  [/instagram\.com/i, "Instagram"],
  [/tiktok\.com/i, "TikTok"],
  [/(twitter|x)\.com/i, "X"],
  [/twitch\.tv/i, "Twitch"],
  [/linkedin\.com/i, "LinkedIn"],
];

/** "https://www.youtube.com/@ana" -> "YouTube: youtube.com/@ana" (short, still tappable in SMS apps). */
export function linkLine(url: string): string {
  const short = url.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "");
  const label = NETWORKS.find(([re]) => re.test(url))?.[1];
  return label ? `${label}: ${short}` : short;
}

/**
 * The SMS: a short sourced body (written by research when live, a template otherwise)
 * plus the creator's channels, one per line, so the brand can look right away.
 * TODO(Person A): swap the template for an LLM once a model key is available.
 */
export function draftMessage(company: Company, brief: Brief, creator: CreatorProfile): Draft {
  // Research sometimes adds its own "Hi Danner —"; we write the greeting ourselves, so drop theirs.
  const researched = brief.suggestedMessage?.trim().replace(/^(hi|hello|hey|dear)\b[^.!?—–\-,]{0,40}[.!?—–\-,]\s*/i, "");
  const body = researched
    || (company.trigger.type === "other"
      ? `I've been following ${company.name} and think my ${creator.niche} audience would love what you make. I'd love to work together, open to a quick chat this week?`
      : `Saw the news: ${firstSentence(company.trigger.summary)}. Congrats! I make ${creator.niche} content for exactly the people you build for and would love to work together. Open to a quick chat this week?`);
  const links = creator.links.slice(0, 3).map(linkLine);
  const message = [`Hi ${company.name} team! ${body}`, links.length ? `See my work:\n${links.join("\n")}` : ""].filter(Boolean).join("\n\n");
  return {
    companyId: company.id,
    message,
    citedSourceUrls: [company.trigger.sourceUrl, ...brief.sources.map((s) => s.url)].filter((v, i, a) => a.indexOf(v) === i),
  };
}
