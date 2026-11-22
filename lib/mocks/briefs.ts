import type { Brief } from "@/lib/types";

export const mockBriefs: Record<string, Brief> = {
  co_trailpeak: {
    companyId: "co_trailpeak",
    whyNow: "TrailPeak launched UltraLite 2 four days ago and says the launch is \"creator-first\" — they are actively booking creators this month.",
    creatorFit: "Your hiking and gear-review audience matches their target buyer; your ultralight-packing videos are the exact use case.",
    sources: [
      { title: "TrailPeak launches UltraLite 2", url: "https://news.example/trailpeak-ultralite-2-launch" },
      { title: "TrailPeak brand page", url: "https://trailpeak.example/about" },
    ],
  },
  co_brewlab: {
    companyId: "co_brewlab",
    whyNow: "Fresh Series A earmarked for European DTC growth — new marketing budget, new markets that need local creators.",
    creatorFit: "Your morning-routine and home-barista content fits their subscription product.",
    sources: [
      { title: "BrewLab raises $12M Series A", url: "https://techpress.example/brewlab-series-a" },
      { title: "BrewLab subscriptions", url: "https://brewlab.example/subscribe" },
    ],
  },
  co_pixelforge: {
    companyId: "co_pixelforge",
    whyNow: "They are hiring their first Influencer Marketing Manager — reach out before that hire builds a roster.",
    creatorFit: "Your dev-tools and setup-tour videos reach their indie developer audience.",
    sources: [{ title: "Influencer Marketing Manager job post", url: "https://jobs.example/pixelforge/influencer-marketing-manager" }],
  },
  co_glowdrop: {
    companyId: "co_glowdrop",
    whyNow: "Brand claims an ambassador launch, but only its own new site mentions it.",
    creatorFit: "Not recommended — trust check is red.",
    sources: [{ title: "GlowDrop ambassadors page", url: "https://glowdrop-official.example/ambassadors" }],
  },
};
