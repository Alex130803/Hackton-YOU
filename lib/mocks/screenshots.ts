// Demo email screenshots (doc/screenshots/*.png) and the message text each one shows.
// Image reading isn't built: the demo checks each screenshot's known text.
// Regenerate the images with: node scripts/make-sample-screenshots.mjs
import type { DealCheck } from "@/lib/types";
import data from "./screenshots.json";
import hollylandFirst from "@/doc/screenshots/hollyland-first.png";
import hollylandFollowup from "@/doc/screenshots/hollyland-followup.png";
import creoventuraAndaseat from "@/doc/screenshots/creoventura-andaseat.png";

const IMAGE_SRC: Record<string, string> = {
  "hollyland-first.png": hollylandFirst.src,
  "hollyland-followup.png": hollylandFollowup.src,
  "creoventura-andaseat.png": creoventuraAndaseat.src,
};

export interface ScreenshotSample {
  id: string;
  file: string;
  title: string;
  fromName: string;
  from: string;
  date: string;
  time: string;
  subject: string;
  body: string;
  sha256: string;
  bytes: number;
}

export const screenshotSamples: ScreenshotSample[] = data;

export const screenshotUrl = (s: ScreenshotSample) => IMAGE_SRC[s.file];

/** The text an image reader would return for this screenshot. */
export function screenshotText(s: ScreenshotSample): string {
  return `From: ${s.fromName} <${s.from}>\nTo: me\nDate: ${s.date}\nSubject: ${s.subject}\n\n${s.body}`;
}

/**
 * Demo-mode verdicts for the three screenshots (USE_MOCKS=true), so the demo shows the right reasons
 * until the live checks are wired. Facts come from our 2026-11-21/22 checks and the cited reports.
 */
export const screenshotResults: Record<string, DealCheck> = {
  "hollyland-followup": {
    verdict: {
      level: "red",
      score: 4,
      signals: [
        { label: "Fake sender", detail: "dealinteriors.co, not hollyland.com", sourceUrl: "https://www.hollyland.com/contact" },
        { label: "1-day-old link", detail: "joinmatchy.com was registered Jul 10, 2026, the day before", sourceUrl: "https://rdap.org/domain/joinmatchy.com" },
        { label: "Reported scam", detail: "ESET: this Hollyland/Matchy offer steals Google accounts", sourceUrl: "https://www.welivesecurity.com/en/social-media/brand-deal-scam-targeting-youtube-creators/" },
      ],
    },
    linkScans: [{ url: "https://joinmatchy.com/hollyland", verdict: "dangerous", findings: ["Fake Google sign-in, per ESET", "Site is now offline"] }],
    suggestedReply: "Don't click. Ask Hollyland at marketing@hollyland.com if it's real.",
  },
  "hollyland-first": {
    verdict: {
      level: "red",
      score: 12,
      signals: [
        { label: "Fake sender", detail: "dealinteriors.co, not hollyland.com", sourceUrl: "https://www.hollyland.com/contact" },
        { label: "7-week-old domain", detail: "dealinteriors.co was created May 19, 2026" },
        { label: "Reported scam", detail: "Same offer ESET traced to a Google-account scam", sourceUrl: "https://www.welivesecurity.com/en/social-media/brand-deal-scam-targeting-youtube-creators/" },
      ],
    },
    linkScans: [],
    suggestedReply: "Don't send your rates. Ask Hollyland at marketing@hollyland.com first.",
  },
  "creoventura-andaseat": {
    verdict: {
      level: "red",
      score: 5,
      signals: [
        { label: "Brand says fake", detail: "AndaSeat: Creoventura is not affiliated", sourceUrl: "https://x.com/andaseatchair/status/2105628802260816151" },
        { label: "New domain", detail: "creoventura.com was registered Aug 11, 2026", sourceUrl: "https://rdap.org/domain/creoventura.com" },
        { label: "Reported scam", detail: "Help Net Security, Oct 8, 2026", sourceUrl: "https://www.helpnetsecurity.com/2026/10/08/scams-targeting-youtube-creators-sponsorship/" },
      ],
    },
    linkScans: [{ url: "https://creoventura.com/campaign/maya-makes", verdict: "dangerous", findings: ["\"Verify your channel\" leads to a fake Google sign-in"] }],
    suggestedReply: "Don't verify anything. Ask AndaSeat at marketing@andaseat.com if it's real.",
  },
};

/** The "ask the brand" email the demo drafts for each screenshot (real brand contacts; creator is fictional). */
export const screenshotFollowups: Record<string, { brand: string; to: string; subject: string; body: string }> = {
  "hollyland-followup": {
    brand: "Hollyland",
    to: "marketing@hollyland.com",
    subject: "Did you send this collaboration offer?",
    body: "Hi Hollyland team,\n\nI got a paid collaboration offer from \"Brandi, Creator Partnerships\" at brandi@dealinteriors.co. It asks me to connect my YouTube channel at joinmatchy.com/hollyland.\n\nIs this offer from Hollyland? If not, you may want to warn other creators. Screenshot attached.\n\nThanks,\nMaya",
  },
  "hollyland-first": {
    brand: "Hollyland",
    to: "marketing@hollyland.com",
    subject: "Did you send this collaboration offer?",
    body: "Hi Hollyland team,\n\nI got a paid collaboration offer from \"Brandi, Creator Partnerships\" at brandi@dealinteriors.co, asking for my rates.\n\nIs this offer from Hollyland? If not, you may want to warn other creators. Screenshot attached.\n\nThanks,\nMaya",
  },
  "creoventura-andaseat": {
    brand: "AndaSeat",
    to: "marketing@andaseat.com",
    subject: "Is Creoventura working with AndaSeat?",
    body: "Hi AndaSeat team,\n\nI got a paid collaboration offer from Creoventura (support@creoventura.com), who say they run AndaSeat's creator campaign. They ask me to verify my channel at creoventura.com/campaign/maya-makes.\n\nIs this offer from AndaSeat? Screenshot attached.\n\nThanks,\nMaya",
  },
};

/** The demo verdict for a message, if it is one of the screenshots' texts. */
export function screenshotResultFor(text: string): DealCheck | undefined {
  const s = screenshotSamples.find((x) => screenshotText(x).trim() === text.trim());
  return s && screenshotResults[s.id];
}
