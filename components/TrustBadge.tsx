import type { TrustVerdict } from "@/lib/types";

const STYLE = {
  green: { cls: "bg-ok-soft text-ok", text: "Verified" },
  yellow: { cls: "bg-warn-soft text-warn", text: "Check first" },
  red: { cls: "bg-bad-soft text-bad", text: "Likely scam" },
} as const;

export function TrustBadge({ verdict, loading }: { verdict?: TrustVerdict; loading?: boolean }) {
  if (loading) return <span className="rounded-full bg-subtle px-2.5 py-1 text-xs text-muted">Checking…</span>;
  if (!verdict) return null;
  const s = STYLE[verdict.level];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${s.cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {s.text}
      <span className="opacity-60">{verdict.score}/100</span>
    </span>
  );
}
