"use client";
// OWNER: Person A — find brands (auto from the onboarding niche), look up a specific company by link,
// brief + draft + send, and the history of sent pitches with their status.
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search, Link2, CircleAlert, ArrowRight, RotateCw, X } from "lucide-react";
import { postApi } from "@/lib/api";
import { profileLinks, useProfile } from "@/lib/profile";
import { logActivity, timeAgo } from "@/lib/activity";
import { toDomain } from "@/lib/domain";
import { PITCH_STATUS, PITCH_STATUS_ORDER, recordPitch, usePitches, type Pitch } from "@/lib/pitches";
import type { Brief, Company, Draft, EndpointCall, SendResult, TriggerType, TrustLevel, TrustVerdict } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { CompanyCard, CompanyCover, CompanyLogo, TRIGGER_LABEL } from "@/components/CompanyCard";
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

  const panelRef = useRef<HTMLDivElement>(null);
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
    .filter((p) => !textQuery || `${p.company.name} ${p.company.domain}`.toLowerCase().includes(textQuery))
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

  // Side panel keeps showing the last company while it slides out.
  const [shown, setShown] = useState<Company | null>(null);
  useEffect(() => { if (selected) setShown(selected); }, [selected]);
  const close = () => setSelected(null);
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.scrollTo({ top: 0 });
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [selected]);

  const verdict = shown ? verdicts[shown.id] : undefined;
  const shownPitch = shown ? lastPitch[shown.id] : undefined;
  const loadingList = busy === "Finding brands for you" || busy === "Checking each brand";

  return (
    <>
      <PageHeader title="Find brands" description="Brands in your niche with a fresh reason to work with creators. Paste a company's website to pitch a specific one." />

      {/* Row 1: tabs + what the suggestions are based on */}
      <div className="flex flex-wrap items-center justify-between gap-3">
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
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          <span>For</span>
          <span className="rounded-full bg-accent-soft px-2 py-0.5 font-medium text-accent">{niche}</span>
          <Link href="/settings" className="hover:text-foreground hover:underline">Change</Link>
          <span aria-hidden>·</span>
          <button type="button" onClick={() => discover(true)} disabled={!!busy} className="inline-flex items-center gap-1 hover:text-foreground disabled:opacity-50">
            <RotateCw size={12} /> Refresh
          </button>
        </div>
      </div>

      {/* Row 2: small search on the left, Filter & sort on the right */}
      <form className="mt-4 flex flex-wrap items-center justify-between gap-3" onSubmit={(e) => { e.preventDefault(); lookup(); }}>
        <label className="relative min-w-0 flex-[1_1_15rem] sm:max-w-md">
          <span className="sr-only">{view === "suggestions" ? "Company website or search" : "Search your pitches"}</span>
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            {lookupDomain ? <Link2 size={16} className="text-accent" /> : <Search size={16} />}
          </span>
          <input
            className={`field h-10 pl-9 ${lookupDomain ? "pr-24" : ""}`}
            placeholder={view === "suggestions" ? "Paste a company website, or search" : "Search your pitches"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {lookupDomain && (
            <button className="btn absolute right-1 top-1/2 h-8 -translate-y-1/2 px-3 text-xs" disabled={!!busy} title={`Look up ${lookupDomain}`}>
              Check <ArrowRight size={13} />
            </button>
          )}
        </label>
        <FilterSortMenu sections={sections} activeCount={activeCount} onReset={reset} />
      </form>
      {lookupDomain && view === "suggestions" && <p className="mt-2 hint">Press Enter to look up <span className="font-medium text-foreground">{lookupDomain}</span> and add it to your list.</p>}
      {error && <div className="mt-3 flex items-center gap-2 text-sm text-bad"><CircleAlert size={16} /> {error}</div>}

      {view === "history" ? (
        <div className="mt-5"><PitchHistory pitches={historyVisible} total={pitches} /></div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {loadingList && all.length === 0 && [0, 1, 2].map((i) => (
              <div key={i} className="card overflow-hidden"><div className="aspect-[16/9] animate-pulse bg-subtle" /><div className="space-y-2 p-4"><div className="h-4 w-2/3 animate-pulse rounded bg-subtle" /><div className="h-3 w-1/2 animate-pulse rounded bg-subtle" /></div></div>
            ))}
            {visible.map((c) => {
              const p = lastPitch[c.id];
              const tag = p ? <>Pitched {timeAgo(p.sentAt)} · <span className="font-medium text-foreground">{PITCH_STATUS[p.status].label}</span></>
                : addedIds.has(c.id) ? "Added by you" : undefined;
              return <CompanyCard key={c.id} company={c} verdict={verdicts[c.id]} verdictLoading={!verdicts[c.id]} selected={selected?.id === c.id} onSelect={() => pick(c)} tag={tag} />;
            })}
          </div>
          {!loadingList && all.length === 0 && (
            <div className="mt-5 rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">No brands yet. Try Refresh, or paste a company website above.</div>
          )}
          {all.length > 0 && visible.length === 0 && (
            <div className="mt-5 rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">No brands match. Clear the search or reset the filters.</div>
          )}
          <div className="mt-8 max-w-xl"><EndpointTimeline calls={calls} busy={busy} /></div>
        </>
      )}

      {/* Brand details: side panel that slides in from the right */}
      <div className={`fixed inset-0 z-40 ${selected ? "" : "pointer-events-none"}`} aria-hidden={!selected}>
        <div onClick={close} className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${selected ? "opacity-100" : "opacity-0"}`} />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={shown ? `${shown.name} details` : "Brand details"}
          className={`absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-line bg-white transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${selected ? "translate-x-0" : "translate-x-full"}`}
        >
          {shown && (
            <>
              <div className="relative">
                <CompanyCover company={shown} className="aspect-[16/7] w-full" />
                <button type="button" onClick={close} aria-label="Close" className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-line bg-white text-foreground hover:border-foreground">
                  <X size={17} />
                </button>
                <div className="absolute -bottom-6 left-6"><CompanyLogo company={shown} size={52} /></div>
              </div>

              <div className="space-y-6 p-6 pt-9">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-xl font-semibold">{shown.name}</h2>
                    <div className="text-sm text-muted">{shown.domain} · {TRIGGER_LABEL[shown.trigger.type]} · {shown.trigger.date}</div>
                  </div>
                  <TrustBadge verdict={verdict} loading={!verdict} />
                </div>

                {shownPitch && (
                  <div className="flex flex-wrap items-center gap-2 rounded-lg bg-accent-soft p-3 text-sm text-accent">
                    You pitched them {timeAgo(shownPitch.sentAt)}. Status: <span className="font-medium">{PITCH_STATUS[shownPitch.status].label}</span>.
                    <button type="button" onClick={() => { close(); setView("history"); }} className="font-medium underline">Open history</button>
                  </div>
                )}

                {verdict && verdict.level !== "green" && (
                  <div className={`rounded-lg p-3 text-sm ${verdict.level === "red" ? "bg-bad-soft text-bad" : "bg-warn-soft text-warn"}`}>
                    <div className="font-medium">{verdict.level === "red" ? "We don't recommend contacting this brand." : "Double-check this brand before you pitch."}</div>
                    <ul className="mt-1 space-y-0.5">{verdict.signals.map((s) => <li key={s.label}>{s.label}: {s.detail}</li>)}</ul>
                  </div>
                )}

                {!brief || brief.companyId !== shown.id ? (
                  <div className="animate-pulse text-sm text-muted">Researching the brand…</div>
                ) : (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div><div className="text-xs font-medium text-muted">Why now</div><p className="mt-1 text-sm">{brief.whyNow}</p></div>
                    <div><div className="text-xs font-medium text-muted">Why you</div><p className="mt-1 text-sm">{brief.creatorFit || "We'll explain the fit once live research is connected."}</p></div>
                    <div className="sm:col-span-2"><SourceList sources={brief.sources} /></div>
                  </div>
                )}

                {draft && draft.companyId === shown.id && (
                  <div className="space-y-4 border-t border-line pt-6">
                    <DraftEditor key={shown.id} value={message} onChange={setMessage} onSend={send} defaultTo={profile.phone} sending={busy === "Sending SMS"} sentId={sentId} disabled={verdict?.level === "red"} />
                    <div className="text-xs text-muted">Contact hints: {shown.contactHints.join(" · ")}</div>
                  </div>
                )}

                <EndpointTimeline calls={calls} busy={busy} />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
