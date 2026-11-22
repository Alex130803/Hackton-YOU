// OWNER: Person A — approved message -> SMS. Only called after the creator clicks Approve & send.
import { NextResponse } from "next/server";
import { getSmsProvider } from "@/lib/sms/provider";
import type { ApiResult, SendResult } from "@/lib/types";

export async function POST(req: Request) {
  const { to, message, approved } = (await req.json()) as { to: string; message: string; approved: boolean };
  if (!approved) return NextResponse.json({ error: "Message must be approved by the creator" }, { status: 400 });
  if (!to || !message) return NextResponse.json({ error: "Missing `to` or `message`" }, { status: 400 });
  try {
    const data = await getSmsProvider().send(to, message);
    return NextResponse.json<ApiResult<SendResult>>({ data, calls: [] });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
