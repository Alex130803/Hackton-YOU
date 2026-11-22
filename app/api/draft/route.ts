// OWNER: Person A — Company + Brief + creator links -> Draft
import { NextResponse } from "next/server";
import { draftMessage } from "@/lib/outreach/draft";
import type { ApiResult, Brief, Company, CreatorProfile, Draft } from "@/lib/types";

export async function POST(req: Request) {
  const { company, brief, creator } = (await req.json()) as { company: Company; brief: Brief; creator: CreatorProfile };
  return NextResponse.json<ApiResult<Draft>>({ data: draftMessage(company, brief, creator), calls: [] });
}
