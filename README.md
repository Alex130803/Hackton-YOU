# Ultraviolet

_(repo folder: `creator-outreach`)_

Hackathon project on You.com APIs. React (Next.js App Router) on Node.js, white UI with a sidebar: **Home**, **Find brands**, **Offer check**, a **Recent** list and a **This week** card (from `lib/activity.ts`), plus **Settings** and the account button at the bottom. On desktop the sidebar can be collapsed to an icon bar (button next to the logo, or Ctrl/⌘ B); the choice is remembered. The mascot is a little purple slime (`components/Slime.tsx`, with `blink` and `bob` props).

- **Find brands** (`/discover`): a marketplace-style grid of brand cards with a cover image and logo (live: `thumbnail_url` / `favicon_url` from You.com search; demo: local illustrations in `public/mocks/`). Clicking a card opens the **pitch page** (`/discover/[id]`): 4 steps (Brand → Why it fits → Message → Send) with a live SMS preview on a phone, Save draft, and an approve step before sending. It fits one screen on laptops. Outreach is SMS only. Cards show up right away, based on the niche from onboarding. Each card has a trust check (green/yellow/red with sources). The search bar is mainly for **pasting a company website** to pitch a specific brand (`/api/lookup`), and it also filters the list by text. One **Filter & sort** dropdown covers sort (Recommended / newest / most trusted / A–Z), trust and reason to reach out. Pick a brand to get a cited brief and a draft pitch; the creator approves it and it goes out by SMS. The **History** tab lists sent pitches with a status the creator updates (Sent → Replied → Deal / No reply / Declined) and shows the reply rate (`lib/pitches.ts`, browser for now).
- **Offer check** (`/check`, API `/api/inbound`): the creator pastes a brand-deal email or DM and finds out whether it's real (sender vs. brand, domain age, scam reports), what the links contain (opened server-side, so the creator never clicks), whether the rate is fair, and what to reply.

No login or signup. This is a single-user demo. New users first go through a 3-step **onboarding** (`/onboarding`: name, niche, then channels with YouTube/Instagram/TikTok fields plus "Add another link"; there is also a "Skip for now" link). It ends on an "all set" screen with the blinking slime and a profile overview. Onboarding opens **every time the app is opened in a new window or tab** (flag in `sessionStorage`; a reload keeps it). Returning creators see their saved details already filled in. The profile is saved in the browser (`lib/profile.ts`) and can be edited in Settings. Settings → **Restart onboarding** resets it before a demo. The `components/AppShell.tsx` component handles the redirect.

## Run

```bash
npm install
cp .env.example .env.local   # USE_MOCKS=true by default
npm run dev                  # http://localhost:3000
```

With `USE_MOCKS=true` the whole app works end to end with mock data and **no API keys**.

### Going live

Put your own key in `.env.local` (never commit it) and turn mocks off:

```bash
YDC_API_KEY=ydc-sk-...
USE_MOCKS=false
```

Restart `npm run dev` after changing env vars. What runs live then:

| Feature | Live source |
| --- | --- |
| Find brands (suggestions and topic search) | Research API with `output_schema` (`research_effort: "standard"`, ~20s), then one Web Search per brand for the cover image (`thumbnail_url`). The logo comes from `you.com/favicon?domain=…` |
| Pasted company website | Extract (name) + Web Search (latest news from the last 60 days → trigger + image) |
| Why it fits (brief) | Research API with `output_schema`: why_now / why_you + sources, **plus the brand's public phone/email with the page it was found on, and a short SMS body** (one call, ~20–30s) |
| More suggestions | "New brands" in the pager asks Research again with `exclude` (domains already shown), so every page is new |
| Trust check for brands | RDAP domain age + Web Search for independent coverage and scam reports (`lib/trust/signals.ts`, first version) |
| Offer check | Local red-flag heuristics only. Extract of links, fair rate and Finance Research are still TODO (Person B) |
| SMS | Twilio when `TWILIO_*` are set, otherwise a safe mock send (nothing goes out). `SMS_TEST_NUMBER` locks every send to one number (your own phone) while testing. US toll-free senders need Twilio toll-free verification first (error 30032 until then) |
| WhatsApp (testing) | `MESSAGE_CHANNEL=whatsapp` sends through Twilio's WhatsApp Sandbox (+1 415 523 8886). The receiving phone must first send `join <code>` to it from WhatsApp (Twilio Console → Messaging → Try it out → Send a WhatsApp message) |
| Message draft | Research-written SMS body + the creator's channels appended by the app ("See my work: YouTube: …"). The template is the fallback. You.com's Inference Router (chat models) needs purchased credits, so it isn't used |

## You.com endpoints (verified against https://you.com/docs/llms.txt)

| Use | Endpoint | File |
| --- | --- | --- |
| Web + news search | `POST https://ydc-index.io/v1/search` (`freshness` for news) | `lib/you/search.ts`, `lib/you/news.ts` |
| Page/PDF content | `POST https://ydc-index.io/v1/extract` (formerly "Contents") | `lib/you/contents.ts` |
| Research | `POST https://api.you.com/v1/research` with `research_effort`: `lite`, `standard`, `deep`, `exhaustive` or `frontier` | `lib/you/research.ts` |
| Finance Research | `POST https://api.you.com/v1/finance_research` | `lib/you/research.ts` |

Every request uses the `X-API-Key: $YDC_API_KEY` header. Read the docs before adding params. Don't guess.

Each API route returns `{ data, calls }`. `calls` lists which You.com endpoints ran; the UI card that showed it (`EndpointTimeline`) is currently not on any screen. Wrap live calls in `log.track("search", "label", () => ...)`.

## Who owns what

| Person A: Find brands | Person B: trust / Offer check |
| --- | --- |
| `app/page.tsx` (Home), `app/discover/page.tsx`, `app/settings/*`, `components/*` | `lib/trust/*` (`signals.ts`, `score.ts`, `rdap.ts`) |
| `app/api/discover`, `app/api/lookup`, `app/api/brief`, `app/api/draft`, `app/api/send` | `app/api/trust`, `app/api/inbound` |
| `lib/you/*`, `lib/outreach/draft.ts`, `lib/sms/*` | `app/check/page.tsx` (Offer check UI) |

**Design:** white background, black text and inputs, purple (`--accent`) as the only accent color. Tokens live in `app/globals.css`, and the `.card`, `.btn`, `.btn-ghost`, `.field` and `.label` classes are there too. Icons come from `lucide-react`, plain (no tinted tiles).

**Database:** SQLite file **`data/ultraviolet.db`**, committed to git, so we share data through push/pull and nothing else. It uses Node's built-in SQLite (`node:sqlite`), so you need **Node 22.5 or newer** and nothing to install. Code: `lib/db.ts` (opens the file, creates tables). Today it holds **favorites** (`/api/favorites`, the heart on brand cards, the Favorites page in the sidebar). A `.db` file can't be merged: before you commit it, pull first, and don't both change favorites at the same time. Profile, activity and pitch history still live in the browser.

**Shared contract:** `lib/types.ts`. Change it together. Mocks live in `lib/mocks/` (all companies are fictional).

## TODO map

- `lib/you/*`: stubs are wired to the right URLs. Test them live and handle errors and empty results.
- `app/api/discover`: map search hits to `Company[]` and dedupe by domain.
- `app/api/lookup`: for a pasted website, `extract()` the homepage and `freshNews()` the domain to build a `Company` with a real trigger.
- `app/api/brief`: split the Research output into `whyNow` / `creatorFit` (or use `output_schema`).
- `lib/outreach/draft.ts`: replace the template with an LLM call (`LLM_API_KEY`) that only uses facts from the brief.
- `lib/trust/signals.ts`: run the live signals in parallel (scam reports, sender vs. brand, coverage, RDAP).
- `app/api/inbound`: `extract()` each link and check for sign-in traps or bad terms. Add the fair rate via `research()` and leverage via `financeResearch()`.
- `lib/sms/infobip.ts`: optional swap-in for Twilio (`SMS_PROVIDER=infobip`).
