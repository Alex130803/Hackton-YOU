import type { EndpointCall } from "@/lib/types";

const NAME: Record<EndpointCall["endpoint"], string> = {
  search: "Search",
  news: "News search",
  extract: "Extract",
  research: "Research",
  finance_research: "Finance Research",
};
const HOST: Record<EndpointCall["endpoint"], string> = {
  search: "ydc-index.io/v1/search",
  news: "ydc-index.io/v1/search",
  extract: "ydc-index.io/v1/extract",
  research: "api.you.com/v1/research",
  finance_research: "api.you.com/v1/finance_research",
};
const DOT: Record<EndpointCall["status"], string> = {
  pending: "bg-line",
  running: "bg-accent animate-pulse",
  done: "bg-ok",
  mock: "bg-accent/50",
  error: "bg-bad",
};

/** Shows which You.com endpoints a request used. */
export function EndpointTimeline({ calls, busy }: { calls: EndpointCall[]; busy?: string }) {
  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-medium">You.com calls</div>
        <div className="text-xs text-muted">{calls.length}</div>
      </div>
      {calls.length === 0 && !busy && <div className="text-sm text-muted">Calls to You.com show up here as they run.</div>}
      <ol className="space-y-3">
        {calls.map((c, i) => (
          <li key={i} className="flex gap-3">
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[c.status]}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium">{NAME[c.endpoint]}</span>
                <span className="text-xs text-muted">{c.status === "mock" ? "mock" : c.status}{c.ms != null ? ` · ${c.ms} ms` : ""}</span>
              </div>
              <div className="truncate text-xs text-muted">{c.label}</div>
              <div className="truncate font-mono text-[11px] text-muted/80">{HOST[c.endpoint]}</div>
            </div>
          </li>
        ))}
        {busy && (
          <li className="flex gap-3">
            <span className="mt-1.5 h-2 w-2 shrink-0 animate-pulse rounded-full bg-accent" />
            <span className="text-sm text-accent">{busy}…</span>
          </li>
        )}
      </ol>
    </div>
  );
}
