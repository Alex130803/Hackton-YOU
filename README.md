# creator-outreach

Hackathon project on You.com APIs. Two modes:

- **Outbound** (`/`): a creator enters their niche and links. We find companies with a fresh trigger (launch, funding, marketing hire), run a trust check (green/yellow/red with sources), build a cited brief and draft a pitch. The creator approves it and it goes out by SMS.
- **Deal Check** (`/inbound`): the creator pastes a brand-deal email or DM and finds out whether it's real (sender vs. brand, domain age, scam reports), what the links contain (opened server-side, so the creator never clicks), whether the rate is fair, and what to reply.

No login or signup. This is a single-user demo.

## Run

```bash
npm install
cp .env.example .env.local   # USE_MOCKS=true by default
npm run dev                  # http://localhost:3000
```

With `USE_MOCKS=true` the whole app works end to end with mock data and **no API keys**. Set `USE_MOCKS=false` and fill in `YDC_API_KEY` (plus Twilio vars) to go live.

## You.com endpoints (verified against https://you.com/docs/llms.txt)

| Use | Endpoint | File |
| --- | --- | --- |
| Web + news search | `POST https://ydc-index.io/v1/search` (`freshness` for news) | `lib/you/search.ts`, `lib/you/news.ts` |
| Page/PDF content | `POST https://ydc-index.io/v1/extract` (formerly "Contents") | `lib/you/contents.ts` |
| Research | `POST https://api.you.com/v1/research` with `research_effort`: `lite`, `standard`, `deep`, `exhaustive` or `frontier` | `lib/you/research.ts` |
| Finance Research | `POST https://api.you.com/v1/finance_research` | `lib/you/research.ts` |

Every request uses the `X-API-Key: $YDC_API_KEY` header. Read the docs before adding params. Don't guess.

Each API route returns `{ data, calls }`. `calls` feeds the **EndpointTimeline** in the UI, so the demo shows which You.com endpoint ran. Wrap live calls in `log.track("search", "label", () => ...)`.

## Who owns what

| Person A: outbound | Person B: trust / Deal Check |
| --- | --- |
| `app/page.tsx` (dashboard UI), `components/*` | `lib/trust/*` (`signals.ts`, `score.ts`, `rdap.ts`) |
| `app/api/discover`, `app/api/brief`, `app/api/draft`, `app/api/send` | `app/api/trust`, `app/api/inbound` |
| `lib/you/*`, `lib/outreach/draft.ts`, `lib/sms/*` | `app/inbound/page.tsx` |

**Shared contract:** `lib/types.ts`. Change it together. Mocks live in `lib/mocks/` (all companies are fictional).

## TODO map

- `lib/you/*`: stubs are wired to the right URLs. Test them live and handle errors and empty results.
- `app/api/discover`: map search hits to `Company[]` and dedupe by domain.
- `app/api/brief`: split the Research output into `whyNow` / `creatorFit` (or use `output_schema`).
- `lib/outreach/draft.ts`: replace the template with an LLM call (`LLM_API_KEY`) that only uses facts from the brief.
- `lib/trust/signals.ts`: run the live signals in parallel (scam reports, sender vs. brand, coverage, RDAP).
- `app/api/inbound`: `extract()` each link and check for sign-in traps or bad terms. Add the fair rate via `research()` and leverage via `financeResearch()`.
- `lib/sms/infobip.ts`: optional swap-in for Twilio (`SMS_PROVIDER=infobip`).
