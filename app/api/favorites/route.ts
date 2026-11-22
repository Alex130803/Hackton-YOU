// OWNER: Person A — favorite brands, stored in the shared SQLite file (data/ultraviolet.db).
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { Company, TrustLevel } from "@/lib/types";

export const runtime = "nodejs";

export interface Favorite { company: Company; trust: TrustLevel | null; trustScore: number | null; createdAt: number }

export async function GET() {
  const rows = getDb().prepare("SELECT company_json, trust, trust_score, created_at FROM favorites ORDER BY created_at DESC").all() as {
    company_json: string; trust: string | null; trust_score: number | null; created_at: number;
  }[];
  const data: Favorite[] = rows.map((r) => ({ company: JSON.parse(r.company_json), trust: r.trust as TrustLevel | null, trustScore: r.trust_score, createdAt: r.created_at }));
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const { company, trust = null, trustScore = null } = (await req.json()) as { company?: Company; trust?: TrustLevel | null; trustScore?: number | null };
  if (!company?.id || !company.name) return NextResponse.json({ error: "Missing company" }, { status: 400 });
  getDb()
    .prepare("INSERT INTO favorites (company_id, company_json, trust, trust_score, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(company_id) DO UPDATE SET company_json = excluded.company_json, trust = excluded.trust, trust_score = excluded.trust_score")
    .run(company.id, JSON.stringify(company), trust, trustScore, Date.now());
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  getDb().prepare("DELETE FROM favorites WHERE company_id = ?").run(id);
  return NextResponse.json({ ok: true });
}
