// Shared SQLite database, committed to the repo (data/ultraviolet.db) so both teammates share data via git.
// Uses Node's built-in SQLite (node:sqlite, Node 22.5+), so there is nothing to install or compile.
// Server-only: import this from API routes, never from client components.
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

const DB_PATH = path.join(process.cwd(), "data", "ultraviolet.db");

let db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (db) return db;
  mkdirSync(path.dirname(DB_PATH), { recursive: true });
  db = new DatabaseSync(DB_PATH);
  // One plain file (no -wal/-shm side files), so it commits cleanly.
  db.exec("PRAGMA journal_mode = DELETE;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS favorites (
      company_id   TEXT PRIMARY KEY,
      company_json TEXT NOT NULL,      -- full Company object (name, domain, image, trigger…)
      trust        TEXT,               -- green | yellow | red at the time it was saved
      created_at   INTEGER NOT NULL    -- epoch ms
    );
  `);
  // Added later: the trust score at the time it was saved.
  const cols = db.prepare("PRAGMA table_info(favorites)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "trust_score")) db.exec("ALTER TABLE favorites ADD COLUMN trust_score INTEGER");
  return db;
}
