"use client";
// Simple 3-step onboarding shown before the main screens (no account needed), then an "all set" overview.
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Search, ShieldCheck, Phone, Pencil } from "lucide-react";
import { DEFAULT_PROFILE, EMPTY_CHANNELS, PLATFORMS, channelUrl, profileLinks, useProfile, type Profile } from "@/lib/profile";
import { OnboardingShapes } from "@/components/OnboardingShapes";
import { ChannelsInput } from "@/components/ChannelsInput";
import { PlatformIcon } from "@/components/PlatformIcon";
import { Slime } from "@/components/Slime";

const NICHES = ["Fitness", "Tech", "Beauty", "Food & coffee", "Travel", "Gaming", "Outdoor & hiking", "Finance"];

export default function Onboarding() {
  const router = useRouter();
  const { save } = useProfile();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [niche, setNiche] = useState("");
  const [channels, setChannels] = useState({ ...EMPTY_CHANNELS });
  const [extraLinks, setExtraLinks] = useState<string[]>([]);
  const [phone, setPhone] = useState("");

  const draft: Profile = { name: name.trim(), niche: niche.trim(), channels, extraLinks: extraLinks.filter((l) => l.trim()), phone: phone.trim() || DEFAULT_PROFILE.phone, onboarded: true };

  const steps = [
    { title: "What should we call you?", hint: "Your name or channel name.", valid: name.trim().length > 0 },
    { title: "What do you make content about?", hint: "Pick one or type your own. We use it to find brands that fit you.", valid: niche.trim().length > 0 },
    { title: "Where can brands see your work?", hint: "Add at least one. Your handle is enough, we build the link.", valid: profileLinks(draft).length > 0 },
  ];
  const current = steps[step];
  const last = step === steps.length - 1;

  const finish = (p: Profile) => {
    save({ ...p, onboarded: true });
    setDone({ ...p, onboarded: true });
  };
  const next = () => {
    if (!current.valid) return;
    if (last) finish(draft);
    else setStep(step + 1);
  };

  return (
    <div className="relative isolate flex min-h-screen flex-col">
      <OnboardingShapes />
      <header className="flex items-center justify-between px-4 py-4 md:px-8">
        <div className="flex items-center gap-2">
          <Slime size={34} blink />
          <span className="font-semibold tracking-tight">Ultraviolet</span>
        </div>
        {!done && (
          <button className="text-sm text-muted hover:text-foreground" onClick={() => finish({ ...DEFAULT_PROFILE })}>
            Skip for now
          </button>
        )}
      </header>

      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-8 md:pt-16">
        {done ? (
          <AllSet profile={done} onEdit={() => router.push("/settings")} />
        ) : (
          <form className="w-full max-w-md" onSubmit={(e) => { e.preventDefault(); next(); }}>
            <div className="mb-8 flex gap-1.5">
              {steps.map((_, i) => (
                <span key={i} className={`h-1 flex-1 rounded-full transition ${i <= step ? "bg-accent" : "bg-line"}`} />
              ))}
            </div>
            <div className="text-sm text-muted">Step {step + 1} of {steps.length}</div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{current.title}</h1>
            <p className="mt-1 text-sm text-muted">{current.hint}</p>

            <div className="mt-6 space-y-4">
              {step === 0 && (
                <input autoFocus className="field" placeholder="e.g. Ana Hikes" value={name} onChange={(e) => setName(e.target.value)} />
              )}

              {step === 1 && (
                <>
                  <div className="flex flex-wrap gap-2">
                    {NICHES.map((n) => (
                      <button
                        type="button"
                        key={n}
                        onClick={() => setNiche(n)}
                        className={`rounded-full border px-3 py-1.5 text-sm transition ${niche === n ? "border-accent bg-accent-soft text-accent" : "border-line bg-white hover:border-foreground"}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <input autoFocus className="field" placeholder="Or type it, e.g. budget travel in Europe" value={niche} onChange={(e) => setNiche(e.target.value)} />
                </>
              )}

              {step === 2 && (
                <>
                  <ChannelsInput channels={channels} extraLinks={extraLinks} onChange={(c, e) => { setChannels(c); setExtraLinks(e); }} />
                  <div className="pt-2">
                    <label className="label" htmlFor="phone">Phone for SMS <span className="font-normal text-muted">(optional)</span></label>
                    <input id="phone" className="field" placeholder="+1 555 000 0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                </>
              )}
            </div>

            <div className="mt-8 flex items-center justify-between">
              {step > 0 ? (
                <button type="button" className="btn-ghost" onClick={() => setStep(step - 1)}><ArrowLeft size={15} /> Back</button>
              ) : <span />}
              <button className="btn" disabled={!current.valid}>
                {last ? "Finish" : "Continue"} <ArrowRight size={15} />
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

function AllSet({ profile, onEdit }: { profile: Profile; onEdit: () => void }) {
  const initials = profile.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const main = PLATFORMS.filter((p) => profile.channels[p.id].trim());
  return (
    <div className="w-full max-w-md text-center">
      <div className="flex justify-center"><Slime size={130} blink bob /></div>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">You&apos;re all set, {profile.name.split(" ")[0]}!</h1>
      <p className="mt-1 text-sm text-muted">Here&apos;s what brands will see. You can change it any time in Settings.</p>

      <div className="card mt-6 p-5 text-left">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-white">{initials}</span>
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold">{profile.name}</div>
            <span className="mt-0.5 inline-block rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">{profile.niche}</span>
          </div>
          <button onClick={onEdit} className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-subtle hover:text-foreground" aria-label="Edit profile"><Pencil size={15} /></button>
        </div>

        <ul className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
          {main.map((p) => (
            <li key={p.id} className="flex min-w-0 items-center gap-2.5">
              <PlatformIcon platform={p.id} />
              <span className="truncate">{channelUrl(p.id, profile.channels[p.id]).replace(/^https?:\/\//, "")}</span>
            </li>
          ))}
          {profile.extraLinks.map((l) => (
            <li key={l} className="flex min-w-0 items-center gap-2.5">
              <PlatformIcon platform="link" />
              <span className="truncate">{l.replace(/^https?:\/\//, "")}</span>
            </li>
          ))}
          <li className="flex items-center gap-2.5 text-muted"><Phone size={16} /> {profile.phone}</li>
        </ul>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/discover" className="btn"><Search size={15} /> Find brands</Link>
        <Link href="/check" className="btn-ghost"><ShieldCheck size={15} /> Check an offer</Link>
      </div>
      <Link href="/" className="mt-4 inline-block text-sm text-muted hover:text-foreground">Go to home</Link>
    </div>
  );
}
