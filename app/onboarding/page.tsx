"use client";
// Simple 3-step onboarding shown before the main screens (no account needed).
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { DEFAULT_PROFILE, linkList, useProfile } from "@/lib/profile";

const NICHES = ["Fitness", "Tech", "Beauty", "Food & coffee", "Travel", "Gaming", "Outdoor & hiking", "Finance"];

export default function Onboarding() {
  const router = useRouter();
  const { save } = useProfile();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [niche, setNiche] = useState("");
  const [links, setLinks] = useState("");
  const [phone, setPhone] = useState("");

  const steps = [
    { title: "What should we call you?", hint: "Your name or channel name.", valid: name.trim().length > 0 },
    { title: "What do you make content about?", hint: "Pick one or type your own. We use it to find brands that fit you.", valid: niche.trim().length > 0 },
    { title: "Where can brands see your work?", hint: "Add at least one link. We put these in your pitches.", valid: linkList(links).length > 0 },
  ];
  const current = steps[step];
  const last = step === steps.length - 1;

  const finish = (p = { name: name.trim(), niche: niche.trim(), links: links.trim(), phone: phone.trim() || DEFAULT_PROFILE.phone }) => {
    save({ ...p, onboarded: true });
    router.replace("/");
  };
  const next = () => {
    if (!current.valid) return;
    if (last) finish();
    else setStep(step + 1);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-4 py-4 md:px-8">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-foreground text-sm font-bold text-white">C</span>
          <span className="font-semibold tracking-tight">Creator Outreach</span>
        </div>
        <button className="text-sm text-muted hover:text-foreground" onClick={() => finish({ ...DEFAULT_PROFILE })}>
          Skip for now
        </button>
      </header>

      <main className="flex flex-1 items-start justify-center px-4 pt-10 md:pt-20">
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
                      className={`rounded-full border px-3 py-1.5 text-sm transition ${niche === n ? "border-accent bg-accent-soft text-accent" : "border-line hover:border-foreground"}`}
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
                <div>
                  <label className="label" htmlFor="links">Your channels</label>
                  <textarea id="links" autoFocus className="field min-h-24" placeholder={"https://youtube.com/@you\nhttps://instagram.com/you"} value={links} onChange={(e) => setLinks(e.target.value)} />
                  <div className="mt-1 hint">One link per line.</div>
                </div>
                <div>
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
      </main>
    </div>
  );
}
