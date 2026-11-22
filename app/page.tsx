"use client";
// OWNER: Person A — outbound dashboard
import { useState } from "react";
import { postApi } from "@/lib/api";
import type { Brief, Company, Draft, EndpointCall, SendResult, TrustVerdict } from "@/lib/types";
import { CompanyCard } from "@/components/CompanyCard";
import { EndpointTimeline } from "@/components/EndpointTimeline";
import { SourceList } from "@/components/SourceList";
import { DraftEditor } from "@/components/DraftEditor";
import { TrustBadge } from "@/components/TrustBadge";

export default function Dashboard() {
  const [niche, setNiche] = useState("outdoor & hiking gear");
  const [links, setLinks] = useState("https://youtube.com/@yourchannel\nhttps://instagram.com/yourhandle");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [verdicts, setVerdicts] = useState<Record<string, TrustVerdict>>({});
  const [selected, setSelected] = useState<Company | null>(null);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [message, setMessage] = useState("");
  const [calls, setCalls] = useState<EndpointCall[]>([]);
  const [busy, setBusy] = useState<string>();
  const [sentId, setSentId] = useState<string>();
  const [error, setError] = useState<string>();

  const linkList = () => links.split(/\s+/).filter(Boolean);
  const log = (c: EndpointCall[]) => setCalls((prev) => [...prev, ...c]);

  async function run<T>(label: string, fn: () => Promise<T>) {
    setBusy(label); setError(undefined);
    try { return await fn(); } catch (e) { setError((e as Error).message); } finally { setBusy(undefined); }
  }

  const discover = () => run("Discovering companies", async () => {
    setCalls([]); setSelected(null); setBrief(null); setDraft(null); setVerdicts({}); setSentId(undefined);
    const r = await postApi<Company[]>("/api/discover", { niche, links: linkList() });
    log(r.calls); setCompanies(r.data);
    setBusy("Running trust checks");
    const results = await Promise.all(r.data.map((company) => postApi<TrustVerdict>("/api/trust", { company })));
    results.forEach((t) => log(t.calls));
    setVerdicts(Object.fromEntries(r.data.map((c, i) => [c.id, results[i].data])));
  });

  const pick = (company: Company) => run(`Researching ${company.name}`, async () => {
    setSelected(company); setBrief(null); setDraft(null); setSentId(undefined);
    const b = await postApi<Brief>("/api/brief", { company, niche });
    log(b.calls); setBrief(b.data);
    const d = await postApi<Draft>("/api/draft", { company, brief: b.data, creator: { niche, links: linkList() } });
    setDraft(d.data); setMessage(d.data.message);
  });

  const send = (to: string) => run("Sending SMS", async () => {
    const r = await postApi<SendResult>("/api/send", { to, message, approved: true });
    setSentId(`${r.data.provider} · ${r.data.id}`);
  });

  const verdict = selected ? verdicts[selected.id] : undefined;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-6">
        <section className="panel p-5">
          <h1 className="text-2xl font-semibold tracking-tight">Find brands that need you <span className="text-accent">right now</span></h1>
          <p className="mt-1 text-sm text-muted">Fresh triggers (launch, funding, marketing hire) → trust check → sourced pitch → you approve → SMS.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Your niche</span>
              <input className="field" value={niche} onChange={(e) => setNiche(e.target.value)} />
            </label>
            <label className="space-y-1">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Your links (one per line)</span>
              <textarea className="field min-h-[42px] font-mono text-xs" rows={2} value={links} onChange={(e) => setLinks(e.target.value)} />
            </label>
          </div>
          <button className="glow-btn mt-4 px-5 py-2.5" onClick={discover} disabled={!!busy || !niche}>
            {busy?.startsWith("Discover") || busy?.startsWith("Running") ? "Scanning…" : "Find companies"}
          </button>
          {error && <div className="mt-3 text-sm text-bad">{error}</div>}
        </section>

        {companies.length > 0 && (
          <section className="grid gap-3 md:grid-cols-2">
            {companies.map((c) => (
              <CompanyCard key={c.id} company={c} verdict={verdicts[c.id]} verdictLoading={!verdicts[c.id]} selected={selected?.id === c.id} onSelect={() => pick(c)} />
            ))}
          </section>
        )}

        {selected && (
          <section className="panel space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{selected.name} — pitch</h2>
              <TrustBadge verdict={verdict} />
            </div>
            {verdict?.level === "red" && (
              <div className="rounded-lg border border-bad/40 bg-bad/10 p-3 text-sm text-bad">Trust check is red — we recommend not contacting this company.</div>
            )}
            {!brief && <div className="animate-pulse text-sm text-muted">Building brief…</div>}
            {brief && (
              <div className="grid gap-4 md:grid-cols-2">
                <div><div className="font-mono text-[10px] uppercase tracking-widest text-muted">Why now</div><p className="mt-1 text-sm">{brief.whyNow}</p></div>
                <div><div className="font-mono text-[10px] uppercase tracking-widest text-muted">Creator fit</div><p className="mt-1 text-sm">{brief.creatorFit}</p></div>
                <div className="md:col-span-2"><SourceList sources={brief.sources} /></div>
              </div>
            )}
            {draft && (
              <>
                <DraftEditor value={message} onChange={setMessage} onSend={send} sending={busy === "Sending SMS"} sentId={sentId} disabled={verdict?.level === "red"} />
                <SourceList title="Cited in draft" sources={draft.citedSourceUrls.map((url) => ({ url }))} />
                <div className="text-xs text-muted">Contact hints: {selected.contactHints.join(" · ")}</div>
              </>
            )}
          </section>
        )}
      </div>
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <EndpointTimeline calls={calls} busy={busy} />
      </aside>
    </div>
  );
}
