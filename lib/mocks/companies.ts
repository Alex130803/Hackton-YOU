import type { Company } from "@/lib/types";

// Fictional companies — demo data only.
export const mockCompanies: Company[] = [
  {
    id: "co_trailpeak",
    name: "TrailPeak Gear",
    domain: "trailpeak.example",
    niche: "outdoor",
    trigger: {
      type: "launch",
      summary: "Launched UltraLite 2 backpack line with a creator-first launch campaign.",
      sourceUrl: "https://news.example/trailpeak-ultralite-2-launch",
      date: "2026-11-18",
    },
    contactHints: ["partnerships@trailpeak.example", "Head of Brand: Mira Kovač (LinkedIn)"],
  },
  {
    id: "co_brewlab",
    name: "BrewLab Coffee",
    domain: "brewlab.example",
    niche: "food",
    trigger: {
      type: "funding",
      summary: "Raised a $12M Series A to expand DTC subscriptions in Europe.",
      sourceUrl: "https://techpress.example/brewlab-series-a",
      date: "2026-11-14",
    },
    contactHints: ["hello@brewlab.example", "CMO announced on company blog"],
  },
  {
    id: "co_pixelforge",
    name: "PixelForge Studio",
    domain: "pixelforge.example",
    niche: "tech",
    trigger: {
      type: "marketing_hire",
      summary: "Hiring an Influencer Marketing Manager (posted 4 days ago).",
      sourceUrl: "https://jobs.example/pixelforge/influencer-marketing-manager",
      date: "2026-11-18",
    },
    contactHints: ["careers page lists marketing@pixelforge.example"],
  },
  {
    id: "co_glowdrop",
    name: "GlowDrop Skincare",
    domain: "glowdrop-official.example",
    niche: "beauty",
    trigger: {
      type: "launch",
      summary: "\"Ambassador program\" announced only on a 3-week-old site and Telegram channel.",
      sourceUrl: "https://glowdrop-official.example/ambassadors",
      date: "2026-11-20",
    },
    contactHints: ["DM on Telegram @glowdrop_collab"],
  },
];
