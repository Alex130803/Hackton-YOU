// OWNER: Person A
import { requireEnv } from "@/lib/env";
import type { SmsProvider } from "./provider";

/**
 * MESSAGE_CHANNEL=whatsapp sends through Twilio's WhatsApp sender instead of SMS (handy for testing while the
 * SMS number waits for toll-free verification). With the WhatsApp Sandbox, the receiving phone must first send
 * "join <your-code>" to the sandbox number (Twilio Console → Messaging → Try it out → Send a WhatsApp message).
 */
// WhatsApp is the default (SMS needs Twilio toll-free verification first); MESSAGE_CHANNEL=sms switches back.
export const messageChannel = (): "sms" | "whatsapp" => (process.env.MESSAGE_CHANNEL === "sms" ? "sms" : "whatsapp");
/** Twilio's shared WhatsApp Sandbox number, unless you have your own approved WhatsApp sender. */
export const whatsappFrom = () => process.env.TWILIO_WHATSAPP_FROM || "+14155238886";

export const TwilioProvider: SmsProvider = {
  name: "twilio",
  async send(to, body) {
    const sid = requireEnv("TWILIO_ACCOUNT_SID");
    const token = requireEnv("TWILIO_AUTH_TOKEN");
    const wa = messageChannel() === "whatsapp";
    const from = wa ? `whatsapp:${whatsappFrom()}` : requireEnv("TWILIO_FROM");
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: wa ? `whatsapp:${to}` : to, From: from, Body: body }),
    });
    const json = (await res.json()) as { sid?: string; message?: string };
    if (!res.ok) throw new Error(`Twilio: ${json.message ?? res.status}`);
    return { ok: true, provider: "twilio", id: json.sid ?? "", channel: wa ? "whatsapp" : "sms" };
  },
};
