"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { setWindowOnboarded, useProfile, type Profile } from "@/lib/profile";
import { ChannelsInput } from "@/components/ChannelsInput";

interface Status { mocks: boolean; you: boolean; llm: boolean; sms: boolean; smsProvider: string }

function Row({ name, ok, note }: { name: string; ok: boolean; note: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div>
        <div className="text-sm font-medium">{name}</div>
        <div className="hint">{note}</div>
      </div>
      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ok ? "bg-ok-soft text-ok" : "bg-subtle text-muted"}`}>{ok ? "Connected" : "Not set"}</span>
    </div>
  );
}

export function SettingsForm({ status }: { status: Status }) {
  const { profile, save } = useProfile();
  const router = useRouter();
  const [form, setForm] = useState<Profile>(profile);
  const [saved, setSaved] = useState(false);
  useEffect(() => setForm(profile), [profile]);
  const set = (k: "name" | "niche" | "phone") => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setForm({ ...form, [k]: e.target.value }); setSaved(false); };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <form className="card min-w-0 space-y-4 p-6" onSubmit={(e) => { e.preventDefault(); save({ ...form, extraLinks: form.extraLinks.filter((l) => l.trim()) }); setSaved(true); }}>
        <h2 className="font-medium">Profile</h2>
        <div><label className="label" htmlFor="name">Name</label><input id="name" className="field" value={form.name} onChange={set("name")} /></div>
        <div><label className="label" htmlFor="niche">Niche</label><input id="niche" className="field" value={form.niche} onChange={set("niche")} /></div>
        <div>
          <div className="label">Your channels</div>
          <ChannelsInput channels={form.channels} extraLinks={form.extraLinks} onChange={(channels, extraLinks) => { setForm({ ...form, channels, extraLinks }); setSaved(false); }} />
          <div className="mt-1 hint">Your handle is enough. These go into your pitches.</div>
        </div>
        <div><label className="label" htmlFor="phone">Default SMS number</label><input id="phone" className="field max-w-60" value={form.phone} onChange={set("phone")} /></div>
        <div className="flex items-center gap-3">
          <button className="btn">Save</button>
          {saved && <span className="flex items-center gap-1 text-sm text-ok"><Check size={15} /> Saved</span>}
        </div>
      </form>

      <div className="card h-fit min-w-0 p-6">
        <h2 className="font-medium">Connections</h2>
        {status.mocks && <div className="mt-3 rounded-lg bg-accent-soft p-3 text-sm text-accent">Demo mode is on. Everything runs on sample data. Set <code>USE_MOCKS=false</code> to go live.</div>}
        <div className="mt-2 divide-y divide-line">
          <Row name="You.com" ok={status.you} note="Search, Extract, Research" />
          <Row name="AI writer" ok={status.llm} note="Writes pitch messages" />
          <Row name={`SMS (${status.smsProvider})`} ok={status.sms} note="Sends approved messages" />
        </div>
        <p className="mt-3 hint">Keys go in <code>.env.local</code> on the server.</p>
        <div className="mt-6 border-t border-line pt-4">
          <button type="button" className="btn-ghost" onClick={() => { setWindowOnboarded(false); router.replace("/onboarding"); }}>
            Restart onboarding
          </button>
          <p className="mt-1 hint">Handy before a demo.</p>
        </div>
      </div>
    </div>
  );
}
