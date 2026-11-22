// OWNER: Person A — approved message -> SMS. Only called after the creator approves it on the Send step.
import { NextResponse } from "next/server";
import { getSmsProvider } from "@/lib/sms/provider";
import { toE164 } from "@/lib/phone";
import type { ApiResult, SendResult } from "@/lib/types";

/** Test mode: while SMS_TEST_NUMBER is set, every SMS goes only to that number, never to the brand. */
const testNumber = () => toE164(process.env.SMS_TEST_NUMBER ?? "");

export async function GET() {
  const n = testNumber();
  return NextResponse.json({ testMode: !!n, testNumber: n });
}

export async function POST(req: Request) {
  const { to, message, approved } = (await req.json()) as { to: string; message: string; approved: boolean };
  if (!approved) return NextResponse.json({ error: "Message must be approved by the creator" }, { status: 400 });
  if (!message) return NextResponse.json({ error: "The message is empty." }, { status: 400 });

  const test = testNumber();
  const number = test ?? toE164(to ?? "");
  if (!number) return NextResponse.json({ error: "Add the country code to the number, e.g. +387 61 234 567 or +1 585 333 4208." }, { status: 400 });

  try {
    const data = await getSmsProvider().send(number, message);
    return NextResponse.json<ApiResult<SendResult>>({ data: { ...data, to: number, testMode: !!test }, calls: [] });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
