// OWNER: Person A
import type { SendResult } from "@/lib/types";
import { USE_MOCKS } from "@/lib/env";
import { TwilioProvider } from "./twilio";
import { InfobipProvider } from "./infobip";

export interface SmsProvider {
  name: SendResult["provider"];
  send(to: string, body: string): Promise<SendResult>;
}

export const MockProvider: SmsProvider = {
  name: "mock",
  async send(to, body) {
    console.log(`[mock sms] -> ${to}: ${body.slice(0, 80)}…`);
    return { ok: true, provider: "mock", id: `mock_${Date.now()}` };
  },
};

/**
 * SMS_PROVIDER=twilio|infobip picks the real provider. Mocks win when USE_MOCKS=true,
 * and also when the chosen provider has no credentials yet (so live search can run before SMS is set up).
 */
export function getSmsProvider(): SmsProvider {
  if (USE_MOCKS) return MockProvider;
  if (process.env.SMS_PROVIDER === "infobip") return process.env.INFOBIP_API_KEY ? InfobipProvider : MockProvider;
  const whatsapp = process.env.MESSAGE_CHANNEL === "whatsapp"; // WhatsApp doesn't need TWILIO_FROM
  const twilioReady = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && (whatsapp || process.env.TWILIO_FROM);
  return twilioReady ? TwilioProvider : MockProvider;
}
