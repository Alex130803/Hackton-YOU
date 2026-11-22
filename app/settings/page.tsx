import { PageHeader } from "@/components/PageHeader";
import { SettingsForm } from "./SettingsForm";
import { USE_MOCKS } from "@/lib/env";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  // Only booleans leave the server; keys never reach the browser.
  const status = {
    mocks: USE_MOCKS,
    you: Boolean(process.env.YDC_API_KEY),
    llm: Boolean(process.env.LLM_API_KEY),
    sms: process.env.SMS_PROVIDER === "infobip" ? Boolean(process.env.INFOBIP_API_KEY) : Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
    smsProvider: process.env.SMS_PROVIDER === "infobip" ? "Infobip" : "Twilio",
  };
  return (
    <>
      <PageHeader title="Settings" description="Your profile is used to find brands and write pitches." />
      <SettingsForm status={status} />
    </>
  );
}
