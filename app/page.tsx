import Link from "next/link";
import { Search, ShieldCheck, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

const STEPS = [
  { n: 1, title: "Find", text: "We look for brands in your niche that just launched, raised money or are hiring marketing people." },
  { n: 2, title: "Check", text: "Every brand gets a trust check, so you never pitch a fake company." },
  { n: 3, title: "Pitch", text: "You get a short message that cites its sources. You edit it, approve it, and it goes out by SMS." },
];

export default function Home() {
  return (
    <>
      <PageHeader title="Welcome back" description="Pick what you want to do." />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link href="/discover" className="card group p-6 transition hover:border-foreground/40">
          <h2 className="flex items-center gap-2 text-lg font-semibold"><Search size={18} strokeWidth={2} /> Find brands to pitch</h2>
          <p className="mt-1 text-sm text-muted">Brands with a fresh reason to work with creators like you right now.</p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium group-hover:text-accent">Start <ArrowRight size={15} /></span>
        </Link>
        <Link href="/check" className="card group p-6 transition hover:border-foreground/40">
          <h2 className="flex items-center gap-2 text-lg font-semibold"><ShieldCheck size={18} strokeWidth={2} /> Check an offer you got</h2>
          <p className="mt-1 text-sm text-muted">Paste a brand-deal email or DM. Find out if it&apos;s real, if the pay is fair, and what to reply.</p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium group-hover:text-accent">Check offer <ArrowRight size={15} /></span>
        </Link>
      </div>

      <h3 className="mt-12 mb-4 text-sm font-medium text-muted">How finding brands works</h3>
      <ol className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {STEPS.map((s) => (
          <li key={s.n} className="flex gap-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line text-sm font-medium">{s.n}</span>
            <div>
              <div className="font-medium">{s.title}</div>
              <p className="text-sm text-muted">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
