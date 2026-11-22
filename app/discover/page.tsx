"use client";
// OWNER: Person A — find brands (auto from the onboarding niche), look up a specific company by link,
// brief + draft + send, and the history of sent pitches with their status.
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search, Link2, CircleAlert, ArrowRight, RotateCw } from "lucide-react";
import { postApi } from "@/lib/api";
import { profileLinks, useProfile } from "@/lib/profile";
import { logActivity, timeAgo } from "@/lib/activity";
import { toDomain } from "@/lib/domain";
import { PITCH_STATUS, PITCH_STATUS_ORDER, recordPitch, usePitches, type Pitch } from "@/lib/pitches";
import type { Brief, Company, Draft, EndpointCall, SendResult, TriggerType, TrustLevel, TrustVerdict } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { CompanyCard, TRIGGER_LABEL } from "@/components/CompanyCard";
import { EndpointTimeline } from "@/components/EndpointTimeline";
import { SourceList } from "@/components/SourceList";
import { DraftEditor } from "@/components/DraftEditor";
import { TrustBadge } from "@/components/TrustBadge";
import { FilterSortMenu, type MenuSection } from "@/components/FilterSortMenu";
import { PitchHistory } from "@/components/PitchHistory";

type View = "suggestions" | "history";
type SortKey = "recommended" | "newest" | "trust" | "name";
type HistorySort = "newest" | "oldest" | "status";

// Keep suggestions per niche while the tab is open, so coming back to this page doesn't search again.
const cache: Record<string, { companies: Company[]; verdicts: Record<string, TrustVerdict>; calls: EndpointCall[] }> = {};

const TRUST_LABEL: Record<TrustLevel, string> = { green: "Verified", yellow: "Check first", red: "Likely scam" };

export default function Discover() {
  const { profile, loaded } = useProfile();
  const niche = profile.niche;
  const pitches = usePitches();

  const [view, setView] = useState<View>("suggestions");
  const [query, setQuery] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [added, setAdded] = useState<Company[]>([]);
  const [verdicts, setVerdicts] = useState<Record<string, TrustVerdict>>({});
  const [selected, setSelected] = useState<Company | null>(null);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [message, setMessage] = useState("");
  const [calls, setCalls] = useState<EndpointCall[]>([]);
  const [busy, setBusy] = useState<string>();
  const [sentId, setSentId] = useState<string>();
  const [error, setError] = useState<string>();

  // Filter & sort
  const [sort, setSort] = useState<SortKey>("recommended");
  const [trustF, setTrustF] = useState<string[]>([]);
  const [reasonF, setReasonF] = useState<string[]>([]);
  const [hSort, setHSort] = useState<HistorySort>("newest");
  const [statusF, setStatusF] = useState<string[]>([]);

  const detailRef = useRef<HTMLDivElement>(null);
  const log = (c: EndpointCall[]) => setCalls((prev) => [...prev, ...c]);
  async function run(label: string, fn: () => Promise<void>) {
    setBusy(label); setError(undefined);
    try { await fn(); } catch (e) { setError((e as Error).message); } finally { setBusy(undefined); }
  }

  const checkTrust = async (list: Company[]) => {
    const results = await Promise.all(list.map((company) => postApi<TrustVerdict>("/api/trust", { company })));
    results.forEach((t) => log(t.calls));
    const v = Object.fromEntries(list.map((c, i) => [c.id, results[i].data]));
    setVerdicts((prev) => ({ ...prev, ...v }));
    return v;
  };

  const discover = (force = false) => run("Finding brands for you", async () => {
    if (!force && cache[niche]) {
      setCompanies(cache[niche].companies); setVerdicts((p) => ({ ...p, ...cache[niche].verdicts })); setCalls(cache[niche].calls);
      return;
    }
    setCalls([]); setSelected(null); setBrief(null); setDraft(null); setSentId(undefined);
    const r = await postApi<Company[]>("/api/discover", { niche, links: profileLinks(profile) });
    log(r.calls); setCompanies(r.data);
    setBusy("Checking each brand");
    const v = await checkTrust(r.data);
    cache[niche] = { companies: r.data, verdicts: v, calls: [...r.calls] };
  });

  // Suggestions appear right away, based on the niche from onboarding.
  useEffect(() => {
    if (loaded && niche) discover();
  }, [loaded, niche]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (company: Company) => run(`Researching ${company.name}`, async () => {
    setSelected(company); setBrief(null); setDraft(null); setSentId(undefined);
    if (window.innerWidth < 1024) requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    const b = await postApi<Brief>("/api/brief", { company, niche });
    log(b.calls); setBrief(b.data);
    const d = await postApi<Draft>("/api/draft", { company, brief: b.data, creator: { niche, links: profileLinks(profile) } });
    setDraft(d.data); setMessage(d.data.message);
  });

  const lookupDomain = toDomain(query);
  const lookup = async () => {
    if (!lookupDomain) return;
    const existing = [...added, ...companies].find((c) => c.domain === lookupDomain);
    setView("suggestions");
    if (existing) { setQuery(""); pick(existing); return; }
    let found: Company | undefined;
    await run(`Looking up ${lookupDomain}`, async () => {
      const r = await postApi<Company>("/api/lookup", { url: query, niche });
      log(r.calls);
      found = r.data;
      setAdded((prev) => [r.data, ...prev.filter((c) => c.domain !== r.data.domain)]);
      setQuery("");
      await checkTrust([r.data]);
      logActivity({ kind: "search", title: `Looked up ${r.data.name}`, detail: r.data.domain, href: "/discover" });
    });
    if (found) pick(found);
  };

  const send = (to: string) => run("Sending SMS", async () => {
    const r = await postApi<SendResult>("/api/send", { to, message, approved: true });
    setSentId(`${r.data.provider} · ${r.data.id}`);
    if (selected) {
      recordPitch({ company: selected, trust: verdicts[selected.id]?.level, message, to });
      logActivity({ kind: "pitch", title: `Pitched ${selected.name}`, detail: "SMS sent", tone: "ok", href: "/discover" });
    }
  });

  // Latest pitch per company, to show "Pitched 2d ago" on cards.
  const lastPitch = useMemo(() => {
    const m: Record<string, Pitch> = {};
    for (const p of pitches) if (!m[p.company.id]) m[p.company.id] = p;
    return m;
  }, [pitches]);

  const addedIds = new Set(added.map((c) => c.id));
  const all = [...added, ...companies.filter((c) => !addedIds.has(c.id))];
  const textQuery = lookupDomain ? "" : query.trim().toLowerCase();
  const visible = all
    .filter((c) => !textQuery || `${c.name} ${c.domain} ${c.trigger.summary}`.toLowerCase().includes(textQuery))
    .filter((c) => trustF.length === 0 || !verdicts[c.id] || trustF.includes(verdicts[c.id].level))
    .filter((c) => reasonF.length === 0 || addedIds.has(c.id) || reasonF.includes(c.trigger.type))
    .sort((a, b) => {
      if (addedIds.has(a.id) !== addedIds.has(b.id)) return addedIds.has(a.id) ? -1 : 1; // your lookups stay on top
      if (sort === "trust") return (verdicts[b.id]?.score ?? 0) - (verdicts[a.id]?.score ?? 0);
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "recommended") {
        const rank = (c: Company) => ({ green: 0, yellow: 1, red: 2 })[verdicts[c.id]?.level ?? "yellow"];
        const diff = rank(a) - rank(b);
        if (diff) return diff; // verified first, likely scams last
      }
      return b.trigger.date.localeCompare(a.trigger.date);
    });

  const historyVisible = pitches
    .filter((p) => statusF.length === 0 || statusF.includes(p.status))
    .sort((a, b) =>
      hSort === "oldest" ? a.sentAt - b.sentAt
        : hSort === "status" ? PITCH_STATUS_ORDER.indexOf(a.status) - PITCH_STATUS_ORDER.indexOf(b.status) || b.sentAt - a.sentAt
        : b.sentAt - a.sentAt,
    );

  const count = (pred: (c: Company) => boolean) => all.filter(pred).length;
  const sections: MenuSection[] = view === "suggestions"
    ? [
        { kind: "sort", title: "Sort by", value: sort, onChange: (v) => setSort(v as SortKey), options: [
          { value: "recommended", label: "Recommended" }, { value: "newest", label: "Newest news" }, { value: "trust", label: "Most trusted" }, { value: "name", label: "Name A–Z" },
        ] },
        { kind: "filter", title: "Trust", value: trustF, onChange: setTrustF, options: (["green", "yellow", "red"] as TrustLevel[]).map((l) => ({
          value: l, label: TRUST_LABEL[l], count: count((c) => verdicts[c.id]?.level === l),
        })) },
        { kind: "filter", title: "Reason to reach out", value: reasonF, onChange: setReasonF, options: (["launch", "funding", "marketing_hire"] as TriggerType[]).map((t) => ({
          value: t, label: TRIGGER_LABEL[t], count: count((c) => c.trigger.type === t),
        })) },
      ]
    : [
        { kind: "sort", title: "Sort by", value: hSort, onChange: (v) => setHSort(v as HistorySort), options: [
          { value: "newest", label: "Newest first" }, { value: "oldest", label: "Oldest first" }, { value: "status", label: "Status" },
        ] },
        { kind: "filter", title: "Status", value: statusF, onChange: setStatusF, options: PITCH_STATUS_ORDER.map((s) => ({
          value: s, label: PITCH_STATUS[s].label, count: pitches.filter((p) => p.status === s).length,
        })) },
      ];
  const activeCount = view === "suggestions"
    ? (sort !== "recommended" ? 1 : 0) + trustF.length + reasonF.length
    : (hSort !== "newest" ? 1 : 0) + statusF.length;
  const reset = () => (view === "suggestions" ? (setSort("recommended"), setTrustF([]), setReasonF([])) : (setHSort("newest"), setStatusF([])));

  const verdict = selected ? verdicts[selected.id] : undefined;
  const selectedPitch = selected ? lastPitch[selected.id] : undefined;
  const loadingList = busy === "Finding brands for you" || busy === "Checking each brand";

  return (
    <>
      <PageHeader title="Find brands" description="Brands that fit your niche and have a fresh reason to work with creators. Want a specific company? Paste its website." />

      {/* Search: paste a company link (main use) or filter the list */}
      <form className="card p-3" onSubmit={(e) => { e.preventDefault(); lookup(); }}>
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative min-w-0 flex-[1_1_16rem]">
            <span className="sr-only">Company website or search</span>
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              {lookupDomain ? <Link2 size={18} className="text-accent" /> : <Search size={18} />}
            </span>
            <input
              className="field h-11 pl-10 text-[15px]"
              placeholder="Paste a company website, e.g. acme.com, or search the list"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <button className="btn h-11" disabled={!lookupDomain || !!busy}>
            {lookupDomain ? <>Check {lookupDomain} <ArrowRight size={15} /></> : <>Look up company</>}
          </button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 px-1 text-xs text-muted">
          <span>Suggestions for</span>
          <span className="rounded-full bg-accent-soft px-2 py-0.5 font-medium text-accent">{niche}</span>
          <Link href="/settings" className="hover:text-foreground hover:underline">Change</Link>
          <span aria-hidden>·</span>
          <button type="button" onClick={() => discover(true)} disabled={!!busy} className="inline-flex items-center gap-1 hover:text-foreground disabled:opacity-50">
            <RotateCw size={12} /> Refresh
          </button>
        </div>
      </form>
      {error && <div className="mt-3 flex items-center gap-2 text-sm text-bad"><CircleAlert size={16} /> {error}</div>}

      {/* Tabs + one Filter & sort dropdown */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" className="inline-flex rounded-xl border border-line bg-subtle p-1">
          {(["suggestions", "history"] as View[]).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={`rounded-lg px-3.5 py-1.5 text-sm transition-colors ${view === v ? "border border-line bg-white font-medium text-foreground" : "border border-transparent text-muted hover:text-foreground"}`}
            >
              {v === "suggestions" ? "Suggestions" : "History"}
              <span className="ml-1.5 text-xs text-muted">{v === "suggestions" ? all.length : pitches.length}</span>
            </button>
          ))}
        </div>
        <FilterSortMenu sections={sections} activeCount={activeCount} onReset={reset} />
      </div>

      {view === "history" ? (
        <div className="mt-4"><PitchHistory pitches={historyVisible} total={pitches} /></div>
      ) : (
        <div className="mt-4 grid grid-cols-1 items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="min-w-0 space-y-3 lg:col-start-1 lg:row-start-1">
            {loadingList && all.length === 0 && [0, 1, 2].map((i) => <div key={i} className="card h-28 animate-pulse bg-subtle" />)}
            {!loadingList && all.length === 0 && (
              <div className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">No brands yet. Try Refresh, or paste a company website above.</div>
            )}
            {all.length > 0 && visible.length === 0 && (
              <div className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">No brands match. Clear the search or reset the filters.</div>
            )}
            {visible.map((c) => {
              const p = lastPitch[c.id];
              const tag = p ? <>Pitched {timeAgo(p.sentAt)} · <span className="font-medium text-foreground">{PITCH_STATUS[p.status].label}</span></>
                : addedIds.has(c.id) ? "Added by you" : undefined;
              return <CompanyCard key={c.id} company={c} verdict={verdicts[c.id]} verdictLoading={!verdicts[c.id]} selected={selected?.id === c.id} onSelect={() => pick(c)} tag={tag} />;
            })}
          </div>

          <div ref={detailRef} className="min-w-0 scroll-mt-4 lg:col-start-2 lg:row-span-2 lg:row-start-1">
            {!selected ? (
              <div className="card grid h-full min-h-64 place-items-center p-10 text-center text-sm text-muted">Pick a brand on the left to see why it&apos;s a good fit and get a ready-to-send pitch.</div>
            ) : (
              <div className="card space-y-6 p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-xl font-semibold">{selected.name}</h2>
                    <div className="text-sm text-muted">{selected.domain} · {TRIGGER_LABEL[selected.trigger.type]} · {selected.trigger.date}</div>
                  </div>
                  <TrustBadge verdict={verdict} loading={!verdict} />
                </div>

                {selectedPitch && (
                  <div className="flex flex-wrap items-center gap-2 rounded-lg bg-accent-soft p-3 text-sm text-accent">
                    You pitched them {timeAgo(selectedPitch.sentAt)}. Status: <span className="font-medium">{PITCH_STATUS[selectedPitch.status].label}</span>.
                    <button type="button" onClick={() => setView("history")} className="font-medium underline">Open history</button>
                  </div>
                )}

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
                    <div><div className="text-xs font-medium text-muted">Why you</div><p className="mt-1 text-sm">{brief.creatorFit || "We'll explain the fit once live research is connected."}</p></div>
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
