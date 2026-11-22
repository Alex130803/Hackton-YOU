import type { EndpointCall } from "@/lib/types";

const HOST: Record<EndpointCall["endpoint"], string> = {
  search: "ydc-index.io/v1/search",
  news: "ydc-index.io/v1/search · news",
  extract: "ydc-index.io/v1/extract",
  research: "api.you.com/v1/research",
  finance_research: "api.you.com/v1/finance_research",
};

const DOT: Record<EndpointCall["status"], string> = {
  pending: "bg-muted",
  running: "bg-accent animate-pulse",
  done: "bg-ok",
  mock: "bg-warn",
  error: "bg-bad",
};

export function EndpointTimeline({ calls, busy }: { calls: EndpointCall[]; busy?: string }) {
  return (
    <div className="panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted">You.com endpoint timeline</div>
        <div className="font-mono text-[10px] text-muted">{calls.length} calls</div>
      </div>
      {calls.length === 0 && !busy && <div className="text-sm text-muted">No calls yet.</div>}
      <ol className="relative space-y-3 border-l border-line pl-4">
        {calls.map((c, i) => (
          <li key={i} className="relative">
            <span className={`absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full ${DOT[c.status]}`} />
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-mono text-xs text-accent">{c.endpoint}</span>
              <span className="font-mono text-[10px] text-muted">{c.status}{c.ms != null ? ` · ${c.ms}ms` : ""}</span>
            </div>
            <div className="font-mono text-[10px] text-muted">{HOST[c.endpoint]}</div>
            <div className="truncate text-xs text-foreground/80">{c.label}</div>
          </li>
        ))}
        {busy && (
          <li className="relative">
            <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 animate-pulse rounded-full bg-accent" />
            <div className="text-xs text-accent">{busy}…</div>
          </li>
        )}
      </ol>
    </div>
  );
}
