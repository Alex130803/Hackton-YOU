"use client";
// OWNER: Person A — history of brands the creator pitched, with a status they update by hand.
// Browser-only for now (like profile/activity). If we move to a DB it goes to SQLite in the repo (see README).
import { useEffect, useState } from "react";
import type { Company, TrustLevel } from "@/lib/types";

export type PitchStatus = "sent" | "replied" | "deal" | "no_reply" | "declined";

export const PITCH_STATUS: Record<PitchStatus, { label: string; cls: string }> = {
  sent: { label: "Sent", cls: "bg-accent-soft text-accent" },
  replied: { label: "Replied", cls: "bg-ok-soft text-ok" },
  deal: { label: "Deal", cls: "bg-ok text-white" },
  no_reply: { label: "No reply", cls: "bg-subtle text-muted" },
  declined: { label: "Declined", cls: "bg-bad-soft text-bad" },
};
export const PITCH_STATUS_ORDER: PitchStatus[] = ["sent", "replied", "deal", "no_reply", "declined"];

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
  write([{ ...p, id: Math.random().toString(36).slice(2), sentAt: now, updatedAt: now, status: "sent" }, ...read()]);
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
