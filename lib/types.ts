// Shared contract between Person A (outreach) and Person B (trust / Deal Check).
// Change this file only together — both sides depend on it.

export type TriggerType = "launch" | "funding" | "marketing_hire" | "other";

export interface Company {
  id: string;
  name: string;
  domain: string;
  niche: string;
  trigger: {
    type: TriggerType;
    summary: string;
    sourceUrl: string;
    date: string; // ISO 8601
  };
  contactHints: string[]; // e.g. "partnerships@acme.com", "Head of Growth: Jane Doe (LinkedIn)"
  /** Card cover. Live: `thumbnail_url` of the trigger article from You.com Web Search. */
  imageUrl?: string;
  /** Small logo. Live: `favicon_url` from You.com results (https://you.com/favicon?domain=…&size=128). */
  logoUrl?: string;
}

export type TrustLevel = "green" | "yellow" | "red";

export interface TrustSignal {
  label: string;
  detail: string;
  sourceUrl?: string;
}

export interface TrustVerdict {
  level: TrustLevel;
  score: number; // 0-100, higher = more trustworthy
  signals: TrustSignal[];
}

export interface Brief {
  companyId: string;
  whyNow: string;
  creatorFit: string;
  sources: { title: string; url: string }[];
  /** Public business contact found on the web (live: You.com Research), with where it was found. */
  contact?: { phone: string | null; email: string | null; sourceUrl: string | null };
  /** Short SMS body written by research from sourced facts (no links; the app appends the creator's links). */
  suggestedMessage?: string;
}

export interface Draft {
  companyId: string;
  message: string;
  citedSourceUrls: string[];
}

export interface CreatorProfile {
  niche: string;
  links: string[];
  phone?: string;
}

// ---- Inbound "Deal Check" (Person B) ----

export interface LinkScan {
  url: string;
  verdict: "safe" | "suspicious" | "dangerous";
  findings: string[]; // e.g. "Google sign-in form on non-Google domain", "Usage rights: perpetual"
}

export interface DealCheck {
  verdict: TrustVerdict; // is it real?
  linkScans: LinkScan[]; // brief / contract links opened server-side, never by the creator
  fairRate?: { low: number; high: number; currency: string; note: string; sources: { title: string; url: string }[] };
  leverage?: { summary: string; sourceUrl: string }; // Finance Research for public brands
  suggestedReply: string; // creator must approve before anything is sent
}

// ---- Infra ----

export type YouEndpoint = "search" | "news" | "extract" | "research" | "finance_research";

export interface EndpointCall {
  endpoint: YouEndpoint;
  label: string;
  status: "pending" | "running" | "done" | "error" | "mock";
  ms?: number;
}

/** Every API route returns { data, calls } so the UI can render the EndpointTimeline. */
export interface ApiResult<T> {
  data: T;
  calls: EndpointCall[];
}

export interface SendResult {
  ok: boolean;
  provider: "twilio" | "infobip" | "mock";
  id: string;
  /** The number it actually went to (in test mode this is the test number, not the brand). */
  to?: string;
  testMode?: boolean;
}
