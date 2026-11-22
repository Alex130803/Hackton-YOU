// OWNER: Person A
import type { SmsProvider } from "./provider";

/**
 * TODO: Infobip swap-in. Read Infobip's SMS API docs for the base URL (account-specific)
 * and request shape before wiring. Env: INFOBIP_BASE_URL, INFOBIP_API_KEY, INFOBIP_FROM.
 */
export const InfobipProvider: SmsProvider = {
  name: "infobip",
  async send() {
    throw new Error("Infobip provider not implemented yet — use SMS_PROVIDER=twilio or USE_MOCKS=true");
  },
};
