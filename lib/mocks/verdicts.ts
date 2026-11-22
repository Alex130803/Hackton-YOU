import type { TrustVerdict } from "@/lib/types";

export const mockVerdicts: Record<string, TrustVerdict> = {
  co_trailpeak: {
    level: "green",
    score: 91,
    signals: [
      { label: "Domain age", detail: "Registered 2014 (12 years)", sourceUrl: "https://rdap.org/domain/trailpeak.example" },
      { label: "Independent coverage", detail: "Launch covered by 3 outlets", sourceUrl: "https://news.example/trailpeak-ultralite-2-launch" },
      { label: "No scam reports", detail: "0 creator complaints found" },
    ],
  },
  co_brewlab: {
    level: "green",
    score: 84,
    signals: [
      { label: "Funding verified", detail: "Series A reported by trade press", sourceUrl: "https://techpress.example/brewlab-series-a" },
      { label: "Domain age", detail: "Registered 2019 (7 years)" },
    ],
  },
  co_pixelforge: {
    level: "yellow",
    score: 62,
    signals: [
      { label: "Small footprint", detail: "Few independent mentions outside own site" },
      { label: "Job post is real", detail: "Listed on a public job board", sourceUrl: "https://jobs.example/pixelforge/influencer-marketing-manager" },
    ],
  },
  co_glowdrop: {
    level: "red",
    score: 12,
    signals: [
      { label: "Brand-new domain", detail: "Registered 21 days ago", sourceUrl: "https://rdap.org/domain/glowdrop-official.example" },
      { label: "Off-platform contact", detail: "Only reachable via Telegram" },
      { label: "Scam reports", detail: "2 creators report a fake \"brief\" link asking for Google sign-in", sourceUrl: "https://forum.example/creators/glowdrop-scam" },
    ],
  },
};
