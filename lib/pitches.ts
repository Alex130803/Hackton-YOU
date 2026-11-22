"use client";
// OWNER: Person A — history of brands the creator pitched, with a status they update by hand.
// Browser-only for now (like profile/activity). If we move to a DB it goes to SQLite in the repo (see README).
import { useEffect, useState } from "react";
import type { Company, TrustLevel } from "@/lib/types";

export type PitchStatus = "draft" | "sent" | "replied" | "deal" | "no_reply" | "declined";

export const PITCH_STATUS: Record<PitchStatus, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "border border-line bg-white text-foreground" },
  sent: { label: "Sent", cls: "bg-accent-soft text-accent" },
  replied: { label: "Replied", cls: "bg-ok-soft text-ok" },
  deal: { label: "Deal", cls: "bg-ok text-white" },
  no_reply: { label: "No reply", cls: "bg-subtle text-muted" },
  declined: { label: "Declined", cls: "bg-bad-soft text-bad" },
};
export const PITCH_STATUS_ORDER: PitchStatus[] = ["draft", "sent", "replied", "deal", "no_reply", "declined"];
/** Statuses the creator can pick after sending (a draft only becomes "sent" by sending it). */
export const SENT_STATUSES: PitchStatus[] = ["sent", "replied", "deal", "no_reply", "declined"];

export interface Pitch {
  id: string;
  company: Company;
  trust?: TrustLevel;
  message: string;
  to: string;
  sentAt: number;
  status: PitchStatus;
  updatedAt: number;
}

const KEY = "creator-outreach.pitches";
let memory: Pitch[] = [];

function read(): Pitch[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Pitch[];
  } catch {}
  return memory;
}
function write(list: Pitch[]) {
  memory = list;
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {}
  window.dispatchEvent(new Event("pitches-change"));
}

export function recordPitch(p: Omit<Pitch, "id" | "sentAt" | "status" | "updatedAt">) {
  const now = Date.now();
  const rest = read().filter((x) => !(x.status === "draft" && x.company.id === p.company.id)); // a sent pitch replaces its draft
  write([{ ...p, id: Math.random().toString(36).slice(2), sentAt: now, updatedAt: now, status: "sent" }, ...rest]);
}

/** Save (or update) the one draft per company. */
export function saveDraft(p: Omit<Pitch, "id" | "sentAt" | "status" | "updatedAt">) {
  const now = Date.now();
  const list = read();
  const existing = list.find((x) => x.status === "draft" && x.company.id === p.company.id);
  if (existing) write(list.map((x) => (x === existing ? { ...x, ...p, updatedAt: now } : x)));
  else write([{ ...p, id: Math.random().toString(36).slice(2), sentAt: now, updatedAt: now, status: "draft" }, ...list]);
}

export function findDraft(companyId: string): Pitch | undefined {
  return read().find((x) => x.status === "draft" && x.company.id === companyId);
}
export function setPitchStatus(id: string, status: PitchStatus) {
  write(read().map((p) => (p.id === id ? { ...p, status, updatedAt: Date.now() } : p)));
}
export function removePitch(id: string) {
  write(read().filter((p) => p.id !== id));
}

export function usePitches() {
  const [items, setItems] = useState<Pitch[]>([]);
  useEffect(() => {
    const sync = () => setItems(read());
    sync();
    window.addEventListener("pitches-change", sync);
    return () => window.removeEventListener("pitches-change", sync);
  }, []);
  return items;
}
