import type { Company } from "@/lib/types";

// Fictional companies — demo data only.
export const mockCompanies: Company[] = [
  {
    id: "co_trailpeak",
    imageUrl: "/mocks/trailpeak.svg", // demo illustration; live = thumbnail_url from You.com search
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
    imageUrl: "/mocks/brewlab.svg", // demo illustration; live = thumbnail_url from You.com search
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
    imageUrl: "/mocks/pixelforge.svg", // demo illustration; live = thumbnail_url from You.com search
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
    imageUrl: "/mocks/glowdrop.svg", // demo illustration; live = thumbnail_url from You.com search
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

// Page 2 of demo suggestions (fictional). No images on purpose: shows the logo fallback.
export const mockCompaniesMore: Company[] = [
  {
    id: "co_summitthread",
    name: "Summit Thread Co.",
    domain: "summitthread.example",
    niche: "outdoor",
    trigger: { type: "launch", summary: "Released a recycled merino base-layer line for winter hikers.", sourceUrl: "https://news.example/summit-thread-merino", date: "2026-11-12" },
    contactHints: ["press@summitthread.example"],
  },
  {
    id: "co_kettleember",
    name: "Kettle & Ember",
    domain: "kettleember.example",
    niche: "outdoor",
    trigger: { type: "funding", summary: "Raised a $4M seed round for its packable camp stoves.", sourceUrl: "https://techpress.example/kettle-ember-seed", date: "2026-11-09" },
    contactHints: ["hello@kettleember.example"],
  },
  {
    id: "co_ridgeline",
    name: "Ridgeline Optics",
    domain: "ridgelineoptics.example",
    niche: "outdoor",
    trigger: { type: "marketing_hire", summary: "Posted a Creator Partnerships Lead role (remote).", sourceUrl: "https://jobs.example/ridgeline/creator-partnerships", date: "2026-11-16" },
    contactHints: ["partners@ridgelineoptics.example"],
  },
];
