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
    contact: { phone: "+1 (555) 010-4471", email: "partnerships@trailpeak.example", sourceUrl: "https://trailpeak.example/contact" },
    suggestedMessage: "Congrats on launching UltraLite 2! I review ultralight hiking gear for a trail-focused audience and would love to put the new pack through a real multi-day test on my channel.",
  },
  co_brewlab: {
    companyId: "co_brewlab",
    whyNow: "Fresh Series A earmarked for European DTC growth — new marketing budget, new markets that need local creators.",
    creatorFit: "Your morning-routine and home-barista content fits their subscription product.",
    sources: [
      { title: "BrewLab raises $12M Series A", url: "https://techpress.example/brewlab-series-a" },
      { title: "BrewLab subscriptions", url: "https://brewlab.example/subscribe" },
    ],
    contact: { phone: "+1 (555) 010-2290", email: "hello@brewlab.example", sourceUrl: "https://brewlab.example/press" },
    suggestedMessage: "Congrats on the Series A! I make home-barista and morning-routine videos, and BrewLab's subscription would fit right into a \"my real coffee setup\" episode.",
  },
  co_pixelforge: {
    companyId: "co_pixelforge",
    whyNow: "They are hiring their first Influencer Marketing Manager — reach out before that hire builds a roster.",
    creatorFit: "Your dev-tools and setup-tour videos reach their indie developer audience.",
    sources: [{ title: "Influencer Marketing Manager job post", url: "https://jobs.example/pixelforge/influencer-marketing-manager" }],
    contact: { phone: null, email: "marketing@pixelforge.example", sourceUrl: "https://jobs.example/pixelforge/influencer-marketing-manager" },
    suggestedMessage: "Saw you're hiring your first influencer marketing manager. I make dev-tools and desk-setup videos for indie developers and would love to be an early creator partner.",
  },
  co_glowdrop: {
    companyId: "co_glowdrop",
    whyNow: "Brand claims an ambassador launch, but only its own new site mentions it.",
    creatorFit: "Not recommended — trust check is red.",
    sources: [{ title: "GlowDrop ambassadors page", url: "https://glowdrop-official.example/ambassadors" }],
    contact: { phone: null, email: null, sourceUrl: null },
    suggestedMessage: "Hi! I came across your ambassador program and would like to learn more about the brand first.",
  },
};
