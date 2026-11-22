"use client";
// "Why it fits" is the slowest step, so start it early: when the creator hovers a brand card, and in parallel
// with the trust check on the pitch page. One request per brand per tab; the pitch page picks it up from here.
import { postApi } from "@/lib/api";
import type { ApiResult, Brief, Company } from "@/lib/types";

const pending = new Map<string, Promise<ApiResult<Brief>>>();

export function loadBrief(company: Company, niche: string, links: string[]): Promise<ApiResult<Brief>> {
  const key = `${company.id}|${niche}`;
  let p = pending.get(key);
  if (!p) {
    p = postApi<Brief>("/api/brief", { company, niche, links });
    p.catch(() => pending.delete(key)); // a failed request can be retried
    pending.set(key, p);
  }
  return p;
}
