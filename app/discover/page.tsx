"use client";
// OWNER: Person A — find brands (auto from the onboarding niche), look up a specific company by link,
// and the history of pitches with their status. Clicking a card opens the pitch page (/discover/[id]).
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Link2, CircleAlert, ArrowRight, RotateCw } from "lucide-react";
import { postApi } from "@/lib/api";
import { profileLinks, useProfile } from "@/lib/profile";
import { logActivity, timeAgo } from "@/lib/activity";
import { toDomain } from "@/lib/domain";
import { PITCH_STATUS, PITCH_STATUS_ORDER, usePitches, type Pitch } from "@/lib/pitches";
import { rememberCompany } from "@/lib/companyStore";
import type { Company, EndpointCall, TriggerType, TrustLevel, TrustVerdict } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { CompanyCard, TRIGGER_LABEL } from "@/components/CompanyCard";
import { FilterSortMenu, type MenuSection } from "@/components/FilterSortMenu";
import { PitchHistory } from "@/components/PitchHistory";

type View = "suggestions" | "history";
type SortKey = "recommended" | "newest" | "trust" | "name";
type HistorySort = "newest" | "oldest" | "status";

// Keep suggestions per niche while the tab is open, so coming back to this page doesn't search again.
const cache: Record<string, { companies: Company[]; verdicts: Record<string, TrustVerdict>; calls: EndpointCall[] }> = {};
let addedCache: Company[] = []; // companies the creator looked up by link

const TRUST_LABEL: Record<TrustLevel, string> = { green: "Verified", yellow: "Check first", red: "Likely scam" };

export default function Discover() {
  const { profile, loaded } = useProfile();
  const niche = profile.niche;
  const pitches = usePitches();
  const router = useRouter();

  const [view, setView] = useState<View>("suggestions");
  const [query, setQuery] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [added, setAddedState] = useState<Company[]>(addedCache);
  const setAdded = (fn: (prev: Company[]) => Company[]) => setAddedState((prev) => (addedCache = fn(prev)));
  const [verdicts, setVerdicts] = useState<Record<string, TrustVerdict>>({});
  const [, setCalls] = useState<EndpointCall[]>([]); // kept so the "You.com calls" card can come back for a demo
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();

  // Filter & sort
  const [sort, setSort] = useState<SortKey>("recommended");
  const [trustF, setTrustF] = useState<string[]>([]);
  const [reasonF, setReasonF] = useState<string[]>([]);
  const [hSort, setHSort] = useState<HistorySort>("newest");
  const [statusF, setStatusF] = useState<string[]>([]);

  // /discover?view=history opens the History tab (used after sending a pitch).
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("view") === "history") setView("history");
  }, []);
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

  // What the suggestions are for: the onboarding niche, or a topic the creator searched for.
  const [topic, setTopic] = useState<string | null>(null);
  const searchFor = topic ?? niche;

  const discover = (force = false, forTopic = searchFor) => run("Finding brands for you", async () => {
    if (!force && cache[forTopic]) {
      setCompanies(cache[forTopic].companies); setVerdicts((p) => ({ ...p, ...cache[forTopic].verdicts })); setCalls(cache[forTopic].calls);
      return;
    }
    setCalls([]); setCompanies([]);
    const r = await postApi<Company[]>("/api/discover", { niche: forTopic, links: profileLinks(profile) });
    log(r.calls); setCompanies(r.data);
    setBusy("Checking each brand");
    const v = await checkTrust(r.data);
    cache[forTopic] = { companies: r.data, verdicts: v, calls: [...r.calls] };
  });

  // Suggestions appear right away, based on the niche from onboarding.
  useEffect(() => {
    if (loaded && niche && !topic) discover();
  }, [loaded, niche]); // eslint-disable-line react-hooks/exhaustive-deps

  const searchTopic = (t: string | null) => { setTopic(t); setQuery(""); discover(false, t ?? niche); };

  // Open the pitch page for a company.
  const open = (company: Company, verdict?: TrustVerdict) => {
    rememberCompany(company, verdict ?? verdicts[company.id]);
    router.push(`/discover/${encodeURIComponent(company.id)}`);
  };

  const lookupDomain = toDomain(query);
  const lookup = async () => {
    if (!lookupDomain) return;
    const existing = [...added, ...companies].find((c) => c.domain === lookupDomain);
    setView("suggestions");
    if (existing) { setQuery(""); open(existing); return; }
    let found: Company | undefined;
    let foundVerdict: TrustVerdict | undefined;
    await run(`Looking up ${lookupDomain}`, async () => {
      const r = await postApi<Company>("/api/lookup", { url: query, niche });
      log(r.calls);
      found = r.data;
      setAdded((prev) => [r.data, ...prev.filter((c) => c.domain !== r.data.domain)]);
      setQuery("");
      foundVerdict = (await checkTrust([r.data]))[r.data.id];
      logActivity({ kind: "search", title: `Looked up ${r.data.name}`, detail: r.data.domain, href: "/discover" });
    });
    if (found) open(found, foundVerdict);
  };

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
          <span className="rounded-full bg-accent-soft px-2 py-0.5 font-medium text-accent">{searchFor}</span>
          {topic ? (
            <button type="button" onClick={() => searchTopic(null)} disabled={!!busy} className="hover:text-foreground hover:underline disabled:opacity-50">Back to {niche}</button>
          ) : (
            <Link href="/settings" className="hover:text-foreground hover:underline">Change</Link>
          )}
          <span aria-hidden>·</span>
          <button type="button" onClick={() => discover(true)} disabled={!!busy} className="inline-flex items-center gap-1 hover:text-foreground disabled:opacity-50">
            <RotateCw size={12} /> Refresh
          </button>
        </div>
      </div>

      {/* Row 2: small search on the left, Filter & sort on the right */}
      <form
        className="mt-4 flex flex-wrap items-center justify-between gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (view !== "suggestions") return;
          if (lookupDomain) lookup();
          else if (query.trim()) searchTopic(query.trim());
        }}
      >
        <label className="relative min-w-0 flex-[1_1_15rem] sm:max-w-md">
          <span className="sr-only">{view === "suggestions" ? "Search brands or paste a website" : "Search your pitches"}</span>
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            {lookupDomain ? <Link2 size={16} className="text-accent" /> : <Search size={16} />}
          </span>
          <input
            className={`field h-10 pl-9 ${view === "suggestions" ? "pr-24" : ""}`}
            placeholder={view === "suggestions" ? "Search brands or paste a website" : "Search your pitches"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {view === "suggestions" && (
            <button
              className="btn absolute right-1 top-1/2 h-8 -translate-y-1/2 px-3 text-xs"
              disabled={!!busy || !query.trim()}
              title={lookupDomain ? `Look up ${lookupDomain}` : "Search for brands"}
            >
              {lookupDomain ? <>Check <ArrowRight size={13} /></> : <>Search</>}
            </button>
          )}
        </label>
        <FilterSortMenu sections={sections} activeCount={activeCount} onReset={reset} />
      </form>
      {view === "suggestions" && query.trim() && (
        <p className="mt-2 hint">
          {lookupDomain
            ? <>Press Enter to look up <span className="font-medium text-foreground">{lookupDomain}</span> and add it to your list.</>
            : <>Filtering the list. Press Enter to search for new brands about <span className="font-medium text-foreground">“{query.trim()}”</span>.</>}
        </p>
      )}
      {loadingList && <p className="mt-4 animate-pulse text-sm text-muted">{busy === "Checking each brand" ? "Checking each brand…" : `Finding brands for “${searchFor}”… this can take about 20 seconds.`}</p>}
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
              const tag = p?.status === "draft" ? <>Draft saved {timeAgo(p.updatedAt)} · <span className="font-medium text-accent">Continue</span></>
                : p ? <>Pitched {timeAgo(p.sentAt)} · <span className="font-medium text-foreground">{PITCH_STATUS[p.status].label}</span></>
                : addedIds.has(c.id) ? "Added by you" : undefined;
              return <CompanyCard key={c.id} company={c} verdict={verdicts[c.id]} verdictLoading={!verdicts[c.id]} onSelect={() => open(c)} tag={tag} />;
            })}
          </div>
          {!loadingList && all.length === 0 && (
            <div className="mt-5 rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">No brands yet. Try Refresh, or paste a company website above.</div>
          )}
          {all.length > 0 && visible.length === 0 && (
            <div className="mt-5 rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">No brands match. Clear the search or reset the filters.</div>
          )}
        </>
      )}

    </>
  );
}
