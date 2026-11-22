// Server-side result cache in the shared SQLite file (data/ultraviolet.db), so a repeat search is instant,
// even after a restart, and teammates get the same warm results through git. Server-only.
import { getDb } from "@/lib/db";

let ready = false;
function db() {
  const d = getDb();
  if (!ready) {
    d.exec("CREATE TABLE IF NOT EXISTS cache (key TEXT PRIMARY KEY, json TEXT NOT NULL, created_at INTEGER NOT NULL)");
    ready = true;
  }
  return d;
}

export const HOUR = 60 * 60 * 1000;

/** The cached value for `key` if it is younger than `maxAgeMs`, else undefined. */
export function getCached<T>(key: string, maxAgeMs: number): T | undefined {
  try {
    const row = db().prepare("SELECT json, created_at FROM cache WHERE key = ?").get(key) as { json: string; created_at: number } | undefined;
    if (!row || Date.now() - row.created_at > maxAgeMs) return undefined;
    return JSON.parse(row.json) as T;
  } catch {
    return undefined;
  }
}

export function setCached(key: string, value: unknown): void {
  try {
    db().prepare("INSERT OR REPLACE INTO cache (key, json, created_at) VALUES (?, ?, ?)").run(key, JSON.stringify(value), Date.now());
  } catch {
    /* a cache write never breaks the request */
  }
}
