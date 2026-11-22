"use client";
// Small local activity log that feeds the sidebar ("Recent" + "This week").
import { useEffect, useState } from "react";

export type ActivityKind = "search" | "pitch" | "check";

export interface Activity {
  id: string;
  kind: ActivityKind;
  title: string; // e.g. "Pitched TrailPeak Gear"
  detail?: string; // e.g. "Likely scam"
  tone?: "ok" | "warn" | "bad";
  href: string;
  at: number; // epoch ms
}

const KEY = "creator-outreach.activity";
const MAX = 30;
let memory: Activity[] = [];

function read(): Activity[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Activity[];
  } catch {}
  return memory;
}

export function logActivity(a: Omit<Activity, "id" | "at">) {
  const next = [{ ...a, id: Math.random().toString(36).slice(2), at: Date.now() }, ...read()].slice(0, MAX);
  memory = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  window.dispatchEvent(new Event("activity-change"));
}

export function clearActivity() {
  memory = [];
  try { localStorage.removeItem(KEY); } catch {}
  window.dispatchEvent(new Event("activity-change"));
}

export function useActivity() {
  const [items, setItems] = useState<Activity[]>([]);
  useEffect(() => {
    const sync = () => setItems(read());
    sync();
    window.addEventListener("activity-change", sync);
    return () => window.removeEventListener("activity-change", sync);
  }, []);
  return items;
}

export function timeAgo(at: number): string {
  const s = Math.max(1, Math.round((Date.now() - at) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}
