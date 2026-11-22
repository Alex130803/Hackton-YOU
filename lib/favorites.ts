"use client";
// Client side of favorites: one shared list for all components, saved to the SQLite DB via /api/favorites.
import { useEffect, useState } from "react";
import type { Company, TrustLevel, TrustVerdict } from "@/lib/types";

export interface Favorite { company: Company; trust: TrustLevel | null; trustScore: number | null; createdAt: number }

let cache: Favorite[] | null = null;
let loading: Promise<void> | null = null;
const listeners = new Set<(f: Favorite[]) => void>();
const emit = () => listeners.forEach((l) => l(cache ?? []));

function load() {
  if (!loading) {
    loading = fetch("/api/favorites")
      .then((r) => r.json())
      .then((j: { data: Favorite[] }) => { cache = j.data ?? []; emit(); })
      .catch(() => { cache = cache ?? []; emit(); });
  }
  return loading;
}

/** Add or remove a favorite. Updates the UI at once, then saves; rolls back if saving fails. */
export async function toggleFavorite(company: Company, verdict?: TrustVerdict) {
  const before = cache ?? [];
  const isFav = before.some((f) => f.company.id === company.id);
  cache = isFav ? before.filter((f) => f.company.id !== company.id) : [{ company, trust: verdict?.level ?? null, trustScore: verdict?.score ?? null, createdAt: Date.now() }, ...before];
  emit();
  try {
    const res = isFav
      ? await fetch(`/api/favorites?id=${encodeURIComponent(company.id)}`, { method: "DELETE" })
      : await fetch("/api/favorites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ company, trust: verdict?.level ?? null, trustScore: verdict?.score ?? null }) });
    if (!res.ok) throw new Error(String(res.status));
  } catch {
    cache = before;
    emit();
  }
}

export function useFavorites() {
  const [items, setItems] = useState<Favorite[]>(cache ?? []);
  const [ready, setReady] = useState(cache !== null);
  useEffect(() => {
    const l = (f: Favorite[]) => { setItems(f); setReady(true); };
    listeners.add(l);
    if (cache) l(cache); else load();
    return () => { listeners.delete(l); };
  }, []);
  const ids = new Set(items.map((f) => f.company.id));
  return { favorites: items, ready, isFavorite: (id: string) => ids.has(id) };
}
