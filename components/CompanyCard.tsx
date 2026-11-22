import type { Company, TrustVerdict } from "@/lib/types";
import { TrustBadge } from "./TrustBadge";

export const TRIGGER_LABEL: Record<Company["trigger"]["type"], string> = {
  launch: "New launch",
  funding: "Just raised",
  marketing_hire: "Hiring marketing",
  other: "In the news",
};

export function CompanyCard({
  company, verdict, verdictLoading, selected, onSelect, tag,
}: { company: Company; verdict?: TrustVerdict; verdictLoading?: boolean; selected?: boolean; onSelect?: () => void; tag?: React.ReactNode }) {
  return (
    <button
      onClick={onSelect}
      className={`card w-full p-4 text-left transition hover:border-foreground/40 ${selected ? "border-accent! ring-2 ring-accent-soft" : ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-medium">{company.name}</div>
          <div className="truncate text-xs text-muted">{company.domain}</div>
        </div>
        <TrustBadge verdict={verdict} loading={verdictLoading} />
      </div>
      <div className="mt-3 text-xs text-muted">
        <span className="font-medium text-accent">{TRIGGER_LABEL[company.trigger.type]}</span> · {company.trigger.date}
      </div>
      <p className="mt-1 line-clamp-2 text-sm text-foreground/80">{company.trigger.summary}</p>
      {tag && <div className="mt-3 border-t border-line pt-2 text-xs text-muted">{tag}</div>}
    </button>
  );
}
