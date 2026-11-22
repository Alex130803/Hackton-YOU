import type { DealCheck } from "@/lib/types";

// Sample inbound offers for the Deal Check demo (fictional brands).
export interface MockOffer {
  id: string;
  title: string;
  text: string;
  result: DealCheck;
}

export const mockOffers: MockOffer[] = [
  {
    id: "scam_brief_link",
    title: "Fake brief link",
    text: `Hi! I'm Daniel from the partnerships team at Sonora Audio 🎧 We love your content and want to offer a paid collab: $2,400 for 1 YouTube integration. Please review the campaign brief and sign in to confirm your channel: https://sonora-audio-campaign.example/brief
Reply within 24h, spots are limited!
— Daniel, sonora.partnerships.team@gmail.example`,
    result: {
      verdict: {
        level: "red",
        score: 6,
        signals: [
          { label: "Sender ≠ brand", detail: "Free-mail sender; brand's real domain is sonora-audio.example", sourceUrl: "https://sonora-audio.example/contact" },
          { label: "Lookalike domain", detail: "sonora-audio-campaign.example registered 5 days ago", sourceUrl: "https://rdap.org/domain/sonora-audio-campaign.example" },
          { label: "Known scam pattern", detail: "Creators report identical \"sign in to confirm channel\" messages", sourceUrl: "https://forum.example/creators/sonora-fake-offers" },
          { label: "Urgency", detail: "\"Reply within 24h\" pressure tactic" },
        ],
      },
      linkScans: [
        {
          url: "https://sonora-audio-campaign.example/brief",
          verdict: "dangerous",
          findings: ["Google sign-in form on a non-Google domain", "Asks for YouTube channel permissions", "No actual campaign brief content"],
        },
      ],
      suggestedReply: "Thanks, but I only work through official brand domains. Please email me from @sonora-audio.example and send the brief as a PDF.",
    },
  },
  {
    id: "scam_upfront_fee",
    title: "Pay-to-join program",
    text: `Congratulations!! You've been selected as a GlowDrop Skincare ambassador 💖 Get 50% commission + free products. To activate, just cover the $39.99 shipping for your starter kit at glowdrop-official.example/activate. DM us on Telegram @glowdrop_collab`,
    result: {
      verdict: {
        level: "red",
        score: 9,
        signals: [
          { label: "Upfront payment", detail: "Legit brands don't charge creators to collaborate" },
          { label: "Brand-new domain", detail: "Registered 21 days ago", sourceUrl: "https://rdap.org/domain/glowdrop-official.example" },
          { label: "Off-platform contact", detail: "Telegram only, no company email" },
        ],
      },
      linkScans: [
        { url: "https://glowdrop-official.example/activate", verdict: "dangerous", findings: ["Card payment form", "No company address or legal entity"] },
      ],
      suggestedReply: "No thanks — I don't pay to partner with brands.",
    },
  },
  {
    id: "legit_lowball",
    title: "Real but underpaid",
    text: `Hi, this is Ana from TrailPeak Gear (ana@trailpeak.example). We'd love a 60s Instagram Reel for our UltraLite 2 launch. Budget is $150 + the backpack. Contract attached: https://trailpeak.example/contracts/ul2-creator.pdf`,
    result: {
      verdict: {
        level: "green",
        score: 88,
        signals: [
          { label: "Sender matches brand", detail: "Email domain = trailpeak.example", sourceUrl: "https://trailpeak.example/about" },
          { label: "Domain age", detail: "Registered 2014" },
        ],
      },
      linkScans: [
        {
          url: "https://trailpeak.example/contracts/ul2-creator.pdf",
          verdict: "suspicious",
          findings: ["Usage rights: perpetual, all media", "Exclusivity: 12 months, whole outdoor category", "Payment net-90"],
        },
      ],
      fairRate: {
        low: 600,
        high: 1100,
        currency: "USD",
        note: "Typical for a 60s Reel at ~40k followers with 6% engagement; perpetual usage usually adds 30–50%.",
        sources: [{ title: "Creator rate benchmarks 2026", url: "https://rates.example/instagram-reels-2026" }],
      },
      leverage: { summary: "TrailPeak's parent reported +18% YoY revenue last quarter, driven by new launches.", sourceUrl: "https://ir.example/trailpeak-q3-2026" },
      suggestedReply:
        "Thanks Ana, excited about UltraLite 2! For a 60s Reel my rate is $850. I can offer 6 months of paid usage (not perpetual) and category exclusivity for 30 days, net-30. Happy to jump on a call.",
    },
  },
];
