import type { TrustVerdict } from "@/lib/types";

const STYLE = {
  green: { cls: "text-ok border-ok/40 bg-ok/10", text: "Legit" },
  yellow: { cls: "text-warn border-warn/40 bg-warn/10", text: "Caution" },
  red: { cls: "text-bad border-bad/40 bg-bad/10", text: "Likely scam" },
} as const;

export function TrustBadge({ verdict, loading }: { verdict?: TrustVerdict; loading?: boolean }) {
  if (loading) return <span className="animate-pulse rounded-full border border-line px-2 py-0.5 font-mono text-xs text-muted">checking…</span>;
  if (!verdict) return <span className="rounded-full border border-line px-2 py-0.5 font-mono text-xs text-muted">unchecked</span>;
  const s = STYLE[verdict.level];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-xs ${s.cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current shadow-[0_0_8px_currentColor]" />
      {s.text} · {verdict.score}
    </span>
  );
}
