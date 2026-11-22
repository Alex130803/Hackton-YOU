import type { Company, TrustVerdict } from "@/lib/types";
import { TrustBadge } from "./TrustBadge";

const TRIGGER_LABEL: Record<Company["trigger"]["type"], string> = {
  launch: "🚀 Launch",
  funding: "💸 Funding",
  marketing_hire: "📣 Marketing hire",
  other: "✨ Signal",
};

export function CompanyCard({
  company, verdict, verdictLoading, selected, onSelect,
}: { company: Company; verdict?: TrustVerdict; verdictLoading?: boolean; selected?: boolean; onSelect?: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`panel w-full p-4 text-left transition hover:border-accent/50 ${selected ? "border-accent! shadow-[0_0_30px_rgba(94,231,255,0.15)]" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">{company.name}</div>
          <div className="font-mono text-xs text-muted">{company.domain}</div>
        </div>
        <TrustBadge verdict={verdict} loading={verdictLoading} />
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs">
        <span className="rounded-md border border-accent-2/30 bg-accent-2/10 px-1.5 py-0.5 text-accent-2">{TRIGGER_LABEL[company.trigger.type]}</span>
        <span className="font-mono text-muted">{company.trigger.date}</span>
      </div>
      <p className="mt-2 text-sm text-foreground/80">{company.trigger.summary}</p>
      {verdict && verdict.level !== "green" && (
        <ul className="mt-3 space-y-1 border-t border-line pt-2 text-xs text-muted">
          {verdict.signals.slice(0, 3).map((s) => (
            <li key={s.label}>• <span className="text-foreground/80">{s.label}:</span> {s.detail}</li>
          ))}
        </ul>
      )}
    </button>
  );
}
