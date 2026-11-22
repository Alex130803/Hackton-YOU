"use client";
// OWNER: Person B — Deal Check: is this offer real, is it fair, what do I say back?
import { useState } from "react";
import { postApi } from "@/lib/api";
import { mockOffers } from "@/lib/mocks/offers";
import type { DealCheck, EndpointCall } from "@/lib/types";
import { EndpointTimeline } from "@/components/EndpointTimeline";
import { TrustBadge } from "@/components/TrustBadge";
import { SourceList } from "@/components/SourceList";

const SCAN_CLS = { safe: "text-ok border-ok/40", suspicious: "text-warn border-warn/40", dangerous: "text-bad border-bad/40" } as const;

export default function DealCheckPage() {
  const [text, setText] = useState(mockOffers[0].text);
  const [result, setResult] = useState<DealCheck | null>(null);
  const [calls, setCalls] = useState<EndpointCall[]>([]);
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();
  const [reply, setReply] = useState("");

  async function check() {
    setBusy("Checking offer"); setError(undefined); setResult(null); setCalls([]);
    try {
      const r = await postApi<DealCheck>("/api/inbound", { text });
      setCalls(r.calls); setResult(r.data); setReply(r.data.suggestedReply);
    } catch (e) { setError((e as Error).message); } finally { setBusy(undefined); }
  }

  const v = result?.verdict;
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-6">
        <section className="panel p-5">
          <h1 className="text-2xl font-semibold tracking-tight">Deal Check <span className="text-accent-2">— is this offer real?</span></h1>
          <p className="mt-1 text-sm text-muted">Paste a brand-deal email or DM. We check the sender, open links on our server (you never click them), size a fair rate and draft a reply.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {mockOffers.map((o) => (
              <button key={o.id} onClick={() => { setText(o.text); setResult(null); }} className="rounded-full border border-line px-3 py-1 text-xs text-muted hover:border-accent hover:text-foreground">
                {o.title}
              </button>
            ))}
          </div>
          <textarea className="field mt-3 min-h-40 font-mono text-sm" value={text} onChange={(e) => setText(e.target.value)} />
          <button className="glow-btn mt-3 px-5 py-2.5" onClick={check} disabled={!!busy || !text.trim()}>{busy ? "Checking…" : "Check this deal"}</button>
          {error && <div className="mt-3 text-sm text-bad">{error}</div>}
        </section>

        {result && v && (
          <>
            <section className={`panel p-5 ${v.level === "red" ? "border-bad/50!" : v.level === "green" ? "border-ok/40!" : "border-warn/40!"}`}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{v.level === "red" ? "Don't engage — likely scam" : v.level === "yellow" ? "Proceed with caution" : "Looks legit"}</h2>
                <TrustBadge verdict={v} />
              </div>
              <ul className="mt-3 space-y-2">
                {v.signals.map((s, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-medium">{s.label}</span> <span className="text-muted">— {s.detail}</span>
                    {s.sourceUrl && <a href={s.sourceUrl} target="_blank" rel="noreferrer noopener" className="ml-2 font-mono text-xs text-accent underline">source</a>}
                  </li>
                ))}
              </ul>
            </section>

            {result.linkScans.length > 0 && (
              <section className="panel p-5">
                <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">Links opened server-side</div>
                {result.linkScans.map((l) => (
                  <div key={l.url} className="mt-2 rounded-lg border border-line p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-mono text-xs">{l.url}</span>
                      <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase ${SCAN_CLS[l.verdict]}`}>{l.verdict}</span>
                    </div>
                    <ul className="mt-2 space-y-1 text-sm text-foreground/80">{l.findings.map((f) => <li key={f}>• {f}</li>)}</ul>
                  </div>
                ))}
              </section>
            )}

            {(result.fairRate || result.leverage) && (
              <section className="panel grid gap-4 p-5 md:grid-cols-2">
                {result.fairRate && (
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-muted">Fair rate</div>
                    <div className="mt-1 text-2xl font-semibold text-accent">${result.fairRate.low}–${result.fairRate.high} <span className="text-sm text-muted">{result.fairRate.currency}</span></div>
                    <p className="mt-1 text-sm text-muted">{result.fairRate.note}</p>
                    <div className="mt-2"><SourceList sources={result.fairRate.sources} /></div>
                  </div>
                )}
                {result.leverage && (
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-muted">Negotiation leverage</div>
                    <p className="mt-1 text-sm">{result.leverage.summary}</p>
                    <div className="mt-2"><SourceList sources={[{ title: "Finance source", url: result.leverage.sourceUrl }]} /></div>
                  </div>
                )}
              </section>
            )}

            <section className="panel p-5">
              <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">Suggested reply — nothing is sent without you</div>
              <textarea className="field min-h-28 text-sm" value={reply} onChange={(e) => setReply(e.target.value)} />
              <button className="mt-3 rounded-lg border border-line px-4 py-2 text-sm hover:border-accent" onClick={() => navigator.clipboard?.writeText(reply)}>Copy reply</button>
            </section>
          </>
        )}
      </div>
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <EndpointTimeline calls={calls} busy={busy} />
      </aside>
    </div>
  );
}
