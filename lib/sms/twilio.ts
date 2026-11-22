// OWNER: Person A
import { requireEnv } from "@/lib/env";
import type { SmsProvider } from "./provider";

/** TODO(Person A): test with a Twilio trial number (trial can only text verified numbers). */
export const TwilioProvider: SmsProvider = {
  name: "twilio",
  async send(to, body) {
    const sid = requireEnv("TWILIO_ACCOUNT_SID");
    const token = requireEnv("TWILIO_AUTH_TOKEN");
    const from = requireEnv("TWILIO_FROM");
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: from, Body: body }),
    });
    const json = (await res.json()) as { sid?: string; message?: string };
    if (!res.ok) throw new Error(`Twilio: ${json.message ?? res.status}`);
    return { ok: true, provider: "twilio", id: json.sid ?? "" };
  },
};
