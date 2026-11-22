"use client";
// OWNER: Person A — find brands, brief, draft, send
import { useEffect, useRef, useState } from "react";
import { Search, CircleAlert } from "lucide-react";
import { postApi } from "@/lib/api";
import { profileLinks, useProfile } from "@/lib/profile";
import { logActivity } from "@/lib/activity";
import type { Brief, Company, Draft, EndpointCall, SendResult, TrustVerdict } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { CompanyCard, TRIGGER_LABEL } from "@/components/CompanyCard";
import { EndpointTimeline } from "@/components/EndpointTimeline";
import { SourceList } from "@/components/SourceList";
import { DraftEditor } from "@/components/DraftEditor";
import { TrustBadge } from "@/components/TrustBadge";

export default function Discover() {
  const { profile } = useProfile();
  const [niche, setNiche] = useState(profile.niche);
  useEffect(() => setNiche(profile.niche), [profile.niche]);

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

  const detailRef = useRef<HTMLDivElement>(null);
  const log = (c: EndpointCall[]) => setCalls((prev) => [...prev, ...c]);
  async function run(label: string, fn: () => Promise<void>) {
    setBusy(label); setError(undefined);
    try { await fn(); } catch (e) { setError((e as Error).message); } finally { setBusy(undefined); }
  }

  const discover = () => run("Finding brands", async () => {
    setCalls([]); setSelected(null); setBrief(null); setDraft(null); setVerdicts({}); setSentId(undefined);
    const r = await postApi<Company[]>("/api/discover", { niche, links: profileLinks(profile) });
    log(r.calls); setCompanies(r.data);
    logActivity({ kind: "search", title: `Searched “${niche}”`, detail: `${r.data.length} brands`, href: "/discover" });
    setBusy("Checking each brand");
    const results = await Promise.all(r.data.map((company) => postApi<TrustVerdict>("/api/trust", { company })));
    results.forEach((t) => log(t.calls));
    setVerdicts(Object.fromEntries(r.data.map((c, i) => [c.id, results[i].data])));
  });

  const pick = (company: Company) => run(`Researching ${company.name}`, async () => {
    setSelected(company); setBrief(null); setDraft(null); setSentId(undefined);
    if (window.innerWidth < 1024) requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    const b = await postApi<Brief>("/api/brief", { company, niche });
    log(b.calls); setBrief(b.data);
    const d = await postApi<Draft>("/api/draft", { company, brief: b.data, creator: { niche, links: profileLinks(profile) } });
    setDraft(d.data); setMessage(d.data.message);
  });

  const send = (to: string) => run("Sending SMS", async () => {
    const r = await postApi<SendResult>("/api/send", { to, message, approved: true });
    setSentId(`${r.data.provider} · ${r.data.id}`);
    if (selected) logActivity({ kind: "pitch", title: `Pitched ${selected.name}`, detail: "SMS sent", tone: "ok", href: "/discover" });
  });

  const verdict = selected ? verdicts[selected.id] : undefined;

  return (
    <>
      <PageHeader title="Find brands" description="Brands in your niche that just launched something, raised money or started hiring marketing people." />

      <form className="card flex flex-wrap items-end gap-3 p-4" onSubmit={(e) => { e.preventDefault(); discover(); }}>
        <div className="min-w-0 flex-[1_1_14rem]">
          <label className="label" htmlFor="niche">Your niche</label>
          <input id="niche" className="field" value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="e.g. home coffee, budget travel" />
        </div>
        <button className="btn" disabled={!!busy || !niche}><Search size={15} /> {busy === "Finding brands" || busy === "Checking each brand" ? "Searching…" : "Find brands"}</button>
      </form>
      {error && <div className="mt-3 flex items-center gap-2 text-sm text-bad"><CircleAlert size={16} /> {error}</div>}

      {companies.length === 0 && !busy && (
        <div className="mt-10 rounded-xl border border-dashed border-line p-10 text-center text-sm text-muted">
          Enter your niche and click <span className="font-medium text-foreground">Find brands</span>.
        </div>
      )}

      {companies.length > 0 && (
        <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="min-w-0 space-y-3 lg:col-start-1 lg:row-start-1">
            <div className="text-sm text-muted">{companies.length} brands found. Pick one to pitch.</div>
            {companies.map((c) => (
              <CompanyCard key={c.id} company={c} verdict={verdicts[c.id]} verdictLoading={!verdicts[c.id]} selected={selected?.id === c.id} onSelect={() => pick(c)} />
            ))}
          </div>

          <div ref={detailRef} className="min-w-0 scroll-mt-4 lg:col-start-2 lg:row-span-2 lg:row-start-1">
            {!selected ? (
              <div className="card grid h-full min-h-64 place-items-center p-10 text-center text-sm text-muted">Pick a brand on the left to see why it&apos;s a good fit and get a ready-to-send pitch.</div>
            ) : (
              <div className="card space-y-6 p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">{selected.name}</h2>
                    <div className="text-sm text-muted">{TRIGGER_LABEL[selected.trigger.type]} · {selected.trigger.date}</div>
                  </div>
                  <TrustBadge verdict={verdict} />
                </div>

                {verdict && verdict.level !== "green" && (
                  <div className={`rounded-lg p-3 text-sm ${verdict.level === "red" ? "bg-bad-soft text-bad" : "bg-warn-soft text-warn"}`}>
                    <div className="font-medium">{verdict.level === "red" ? "We don't recommend contacting this brand." : "Double-check this brand before you pitch."}</div>
                    <ul className="mt-1 space-y-0.5">{verdict.signals.map((s) => <li key={s.label}>{s.label}: {s.detail}</li>)}</ul>
                  </div>
                )}

                {!brief ? (
                  <div className="animate-pulse text-sm text-muted">Researching the brand…</div>
                ) : (
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div><div className="text-xs font-medium text-muted">Why now</div><p className="mt-1 text-sm">{brief.whyNow}</p></div>
                    <div><div className="text-xs font-medium text-muted">Why you</div><p className="mt-1 text-sm">{brief.creatorFit}</p></div>
                    <div className="md:col-span-2"><SourceList sources={brief.sources} /></div>
                  </div>
                )}

                {draft && (
                  <div className="space-y-4 border-t border-line pt-6">
                    <DraftEditor key={selected.id} value={message} onChange={setMessage} onSend={send} defaultTo={profile.phone} sending={busy === "Sending SMS"} sentId={sentId} disabled={verdict?.level === "red"} />
                    <div className="text-xs text-muted">Contact hints: {selected.contactHints.join(" · ")}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="min-w-0 lg:col-start-1 lg:row-start-2">
            <EndpointTimeline calls={calls} busy={busy} />
          </div>
        </div>
      )}
    </>
  );
}
