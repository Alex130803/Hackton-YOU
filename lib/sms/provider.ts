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

/** SMS_PROVIDER=twilio|infobip picks the real provider; mocks win when USE_MOCKS=true. */
export function getSmsProvider(): SmsProvider {
  if (USE_MOCKS) return MockProvider;
  return process.env.SMS_PROVIDER === "infobip" ? InfobipProvider : TwilioProvider;
}
