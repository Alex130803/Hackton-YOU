"use client";
// OWNER: Person A — list of sent pitches with a status the creator updates (Sent → Replied → Deal …).
import { useState } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import { PITCH_STATUS, PITCH_STATUS_ORDER, removePitch, setPitchStatus, type Pitch, type PitchStatus } from "@/lib/pitches";
import { timeAgo } from "@/lib/activity";

const TRUST_DOT = { green: "bg-ok", yellow: "bg-warn", red: "bg-bad" } as const;

function Row({ p }: { p: Pitch }) {
  const [open, setOpen] = useState(false);
  const st = PITCH_STATUS[p.status];
  return (
    <li className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {p.trust && <span className={`h-2 w-2 shrink-0 rounded-full ${TRUST_DOT[p.trust]}`} title={`Trust: ${p.trust}`} />}
            <span className="truncate font-medium">{p.company.name}</span>
          </div>
          <div className="truncate text-xs text-muted">{p.company.domain} · sent {timeAgo(p.sentAt)} to {p.to}</div>
        </div>
        <label className="relative">
          <span className="sr-only">Status for {p.company.name}</span>
          <select
            value={p.status}
            onChange={(e) => setPitchStatus(p.id, e.target.value as PitchStatus)}
            className={`cursor-pointer appearance-none rounded-full py-1 pl-3 pr-7 text-xs font-medium outline-none focus:ring-2 focus:ring-accent-soft ${st.cls}`}
          >
            {PITCH_STATUS_ORDER.map((s) => <option key={s} value={s}>{PITCH_STATUS[s].label}</option>)}
          </select>
          <ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-70" />
        </label>
      </div>

      <div className="mt-3 flex items-center gap-4 text-sm">
        <button type="button" onClick={() => setOpen((o) => !o)} className="font-medium text-accent hover:underline">
          {open ? "Hide message" : "Show message"}
        </button>
        {p.updatedAt !== p.sentAt && <span className="text-xs text-muted">Updated {timeAgo(p.updatedAt)}</span>}
        <button type="button" onClick={() => removePitch(p.id)} className="ml-auto flex items-center gap-1 text-xs text-muted hover:text-bad">
          <Trash2 size={13} /> Remove
        </button>
      </div>
      {open && <p className="mt-3 whitespace-pre-wrap rounded-lg bg-subtle p-3 text-sm text-foreground/85">{p.message}</p>}
    </li>
  );
}

export function PitchHistory({ pitches, total }: { pitches: Pitch[]; total: Pitch[] }) {
  if (total.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line p-10 text-center text-sm text-muted">
        No pitches yet. When you send one, it shows up here so you can track who replied.
      </div>
    );
  }
  const answered = total.filter((p) => p.status === "replied" || p.status === "deal").length;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
        <span><span className="font-semibold text-foreground">{total.length}</span> sent</span>
        <span><span className="font-semibold text-foreground">{answered}</span> replied</span>
        <span><span className="font-semibold text-foreground">{total.filter((p) => p.status === "deal").length}</span> deals</span>
        <span>Reply rate <span className="font-semibold text-foreground">{Math.round((answered / total.length) * 100)}%</span></span>
      </div>
      {pitches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">No pitches match these filters.</div>
      ) : (
        <ul className="space-y-3">{pitches.map((p) => <Row key={p.id} p={p} />)}</ul>
      )}
    </div>
  );
}
