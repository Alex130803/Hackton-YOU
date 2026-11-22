"use client";
// Companies the creator opened, so the pitch page (/discover/[id]) can show them after a click or reload.
// Kept for this tab only (sessionStorage), with an in-memory fallback.
import type { Company, TrustVerdict } from "@/lib/types";

const KEY = "creator-outreach.companies";
let memory: Record<string, { company: Company; verdict?: TrustVerdict }> = {};

function read() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as typeof memory;
  } catch {}
  return memory;
}

export function rememberCompany(company: Company, verdict?: TrustVerdict) {
  const all = read();
  all[company.id] = { company, verdict: verdict ?? all[company.id]?.verdict };
  memory = all;
  try { sessionStorage.setItem(KEY, JSON.stringify(all)); } catch {}
}

export function recallCompany(id: string) {
  return read()[id];
}
