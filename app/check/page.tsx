"use client";
// OWNER: Person B — Offer check: is this deal real, is it fair, what do I say back?
import { useState } from "react";
import { ShieldCheck, Copy, Check, CircleAlert } from "lucide-react";
import { postApi } from "@/lib/api";
import { mockOffers } from "@/lib/mocks/offers";
import { logActivity } from "@/lib/activity";
import type { DealCheck, EndpointCall } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { EndpointTimeline } from "@/components/EndpointTimeline";
import { TrustBadge } from "@/components/TrustBadge";
import { SourceList } from "@/components/SourceList";

const SCAN = {
  safe: { cls: "bg-ok-soft text-ok", text: "Safe" },
  suspicious: { cls: "bg-warn-soft text-warn", text: "Watch out" },
  dangerous: { cls: "bg-bad-soft text-bad", text: "Dangerous" },
} as const;

const HEADLINE = {
  red: { title: "Don't reply to this one", cls: "border-bad/40 bg-bad-soft" },
  yellow: { title: "Be careful with this one", cls: "border-warn/40 bg-warn-soft" },
  green: { title: "This brand looks real", cls: "border-ok/30 bg-ok-soft" },
} as const;

export default function OfferCheck() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<DealCheck | null>(null);
  const [calls, setCalls] = useState<EndpointCall[]>([]);
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();
  const [reply, setReply] = useState("");
  const [copied, setCopied] = useState(false);

  async function check() {
    setBusy("Checking the offer"); setError(undefined); setResult(null); setCalls([]); setCopied(false);
    try {
      const r = await postApi<DealCheck>("/api/inbound", { text });
      setCalls(r.calls); setResult(r.data); setReply(r.data.suggestedReply);
      const lvl = r.data.verdict.level;
      const sender = text.match(/(?:from|I'm \w+ from)\s+([A-Z][\w&]*(?:\s+[A-Z][\w&]*){0,2})/)?.[1];
      logActivity({
        kind: "check",
        title: sender ? `Checked ${sender}` : "Checked an offer",
        detail: lvl === "red" ? "Likely scam" : lvl === "yellow" ? "Check first" : "Looks real",
        tone: lvl === "red" ? "bad" : lvl === "yellow" ? "warn" : "ok",
        href: "/check",
      });
    } catch (e) { setError((e as Error).message); } finally { setBusy(undefined); }
  }

  const v = result?.verdict;
  return (
    <>
      <PageHeader title="Offer check" description="Got a brand deal by email or DM? Paste it here. We check the sender, open any links for you (so you never click them), and tell you if the pay is fair." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-6">
          <div className="card p-4">
            <label className="label" htmlFor="offer">The message you got</label>
            <textarea id="offer" className="field min-h-40" value={text} onChange={(e) => { setText(e.target.value); setResult(null); }} placeholder="Paste the full email or DM, including links and the sender's address." />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted">Try an example:</span>
              {mockOffers.map((o) => (
                <button key={o.id} onClick={() => { setText(o.text); setResult(null); }} className="rounded-full border border-line px-3 py-1 text-xs hover:border-foreground">
                  {o.title}
                </button>
              ))}
              <button className="btn ml-auto" onClick={check} disabled={!!busy || !text.trim()}><ShieldCheck size={15} /> {busy ? "Checking…" : "Check offer"}</button>
            </div>
          </div>
          {error && <div className="flex items-center gap-2 text-sm text-bad"><CircleAlert size={16} /> {error}</div>}

          {result && v && (
            <>
              <div className={`rounded-xl border p-5 ${HEADLINE[v.level].cls}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold">{HEADLINE[v.level].title}</h2>
                  <TrustBadge verdict={v} />
                </div>
                <ul className="mt-3 space-y-1.5">
                  {v.signals.map((s, i) => (
                    <li key={i} className="text-sm">
                      <span className="font-medium">{s.label}.</span> <span className="text-foreground/75">{s.detail}</span>
                      {s.sourceUrl && <a href={s.sourceUrl} target="_blank" rel="noreferrer noopener" className="ml-2 text-xs text-accent underline">source</a>}
                    </li>
                  ))}
                </ul>
              </div>

              {result.linkScans.length > 0 && (
                <div className="card p-5">
                  <h3 className="font-medium">Links in the message</h3>
                  <p className="hint">We opened these on our server. You don&apos;t need to click them.</p>
                  {result.linkScans.map((l) => (
                    <div key={l.url} className="mt-3 rounded-lg border border-line p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-mono text-xs">{l.url}</span>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${SCAN[l.verdict].cls}`}>{SCAN[l.verdict].text}</span>
                      </div>
                      <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-foreground/80">{l.findings.map((f) => <li key={f}>{f}</li>)}</ul>
                    </div>
                  ))}
                </div>
              )}

              {(result.fairRate || result.leverage) && (
                <div className="card grid grid-cols-1 gap-6 p-5 md:grid-cols-2">
                  {result.fairRate && (
                    <div>
                      <h3 className="font-medium">Fair pay for this</h3>
                      <div className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">${result.fairRate.low}–${result.fairRate.high}</div>
                      <p className="mt-1 text-sm text-muted">{result.fairRate.note}</p>
                      <div className="mt-3"><SourceList sources={result.fairRate.sources} /></div>
                    </div>
                  )}
                  {result.leverage && (
                    <div>
                      <h3 className="font-medium">Useful when you negotiate</h3>
                      <p className="mt-2 text-sm">{result.leverage.summary}</p>
                      <div className="mt-3"><SourceList sources={[{ title: "Financial report", url: result.leverage.sourceUrl }]} /></div>
                    </div>
                  )}
                </div>
              )}

              <div className="card p-5">
                <h3 className="font-medium">Suggested reply</h3>
                <p className="hint mb-3">Edit it if you like. Nothing is sent for you.</p>
                <textarea className="field min-h-28" value={reply} onChange={(e) => { setReply(e.target.value); setCopied(false); }} />
                <button className="btn-ghost mt-3" onClick={() => { navigator.clipboard?.writeText(reply); setCopied(true); }}>
                  {copied ? <><Check size={15} className="text-ok" /> Copied</> : <><Copy size={15} /> Copy reply</>}
                </button>
              </div>
            </>
          )}
        </div>
        <div className="lg:sticky lg:top-8 lg:self-start">
          <EndpointTimeline calls={calls} busy={busy} />
        </div>
      </div>
    </>
  );
}
