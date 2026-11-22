"use client";
// Marketplace card: cover image (scraped from the web via You.com) + logo + trust + reason to reach out.
import { useState } from "react";
import type { Company, TrustVerdict } from "@/lib/types";
import { TrustBadge } from "./TrustBadge";
import { FavoriteButton } from "./FavoriteButton";

export const TRIGGER_LABEL: Record<Company["trigger"]["type"], string> = {
  launch: "New launch",
  funding: "Just raised",
  marketing_hire: "Hiring marketing",
  other: "In the news",
};

const initials = (name: string) => name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

/** Logo with fallback to initials when there is no logo or it fails to load. */
export function CompanyLogo({ company, size = 40 }: { company: Company; size?: number }) {
  const [broken, setBroken] = useState(false);
  const box = "grid shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-white";
  if (!company.logoUrl || broken) {
    return <span className={`${box} text-sm font-semibold text-accent`} style={{ width: size, height: size }}>{initials(company.name)}</span>;
  }
  return (
    <span className={box} style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- remote favicons from many domains */}
      <img src={company.logoUrl} alt="" width={size - 12} height={size - 12} referrerPolicy="no-referrer" onError={() => setBroken(true)} />
    </span>
  );
}

/** Cover image with a calm fallback (lavender + logo) when there is no image or it fails to load. */
export function CompanyCover({ company, className = "" }: { company: Company; className?: string }) {
  const [broken, setBroken] = useState(false);
  if (!company.imageUrl || broken) {
    return (
      <div className={`grid place-items-center bg-accent-soft ${className}`}>
        <CompanyLogo company={company} size={56} />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote article thumbnails from many domains
    <img
      src={company.imageUrl}
      alt={`${company.name}`}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setBroken(true)}
      className={`object-cover ${className}`}
    />
  );
}

export function CompanyCard({
  company, verdict, verdictLoading, selected, onSelect, onIntent, tag,
}: { company: Company; verdict?: TrustVerdict; verdictLoading?: boolean; selected?: boolean; onSelect?: () => void; onIntent?: () => void; tag?: React.ReactNode }) {
  return (
    <div className="relative">
    <button
      onClick={onSelect}
      onMouseEnter={onIntent}
      onFocus={onIntent}
      className={`card group flex h-full w-full flex-col overflow-hidden text-left transition hover:border-foreground/40 ${selected ? "border-accent! ring-2 ring-accent-soft" : ""}`}
    >
      <div className="relative">
        <CompanyCover company={company} className="aspect-[16/9] w-full" />
        <div className="absolute -bottom-5 left-4"><CompanyLogo company={company} /></div>
      </div>

      <div className="flex flex-1 flex-col bg-tint p-4 pt-7">
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
        {tag && <div className="mt-auto border-t border-sidebar-line pt-2 text-xs text-muted [&:not(:first-child)]:mt-3">{tag}</div>}
      </div>
    </button>
      <div className="absolute right-3 top-3"><FavoriteButton company={company} verdict={verdict} /></div>
    </div>
  );
}
