"use client";
// OWNER: Person A — pitch one brand by SMS, in 4 steps with a live phone preview on the right.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CircleAlert, ExternalLink, Globe, Mail, RotateCcw, Send } from "lucide-react";
import { postApi } from "@/lib/api";
import { profileLinks, useProfile } from "@/lib/profile";
import { logActivity } from "@/lib/activity";
import { recallCompany, rememberCompany } from "@/lib/companyStore";
import { findDraft, recordPitch, saveDraft } from "@/lib/pitches";
import type { Brief, Company, Draft, EndpointCall, SendResult, TrustVerdict } from "@/lib/types";
import { CompanyCover, CompanyLogo, TRIGGER_LABEL } from "@/components/CompanyCard";
import { TrustBadge } from "@/components/TrustBadge";
import { SourceList } from "@/components/SourceList";
import { Stepper } from "@/components/Stepper";
import { SmsPhonePreview } from "@/components/SmsPhonePreview";
import { Slime } from "@/components/Slime";
import { FavoriteButton } from "@/components/FavoriteButton";

const STEPS = ["Brand", "Why it fits", "Message", "Send"];

const hostOf = (url: string) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; } };

export default function PitchPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile, loaded } = useProfile();

  const [company, setCompany] = useState<Company | null>(null);
  const [verdict, setVerdict] = useState<TrustVerdict>();
  const [brief, setBrief] = useState<Brief | null>(null);
  const [suggested, setSuggested] = useState("");
  const [message, setMessage] = useState("");
  const [to, setTo] = useState("");
  const [approved, setApproved] = useState(false);
  const [step, setStep] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [, setCalls] = useState<EndpointCall[]>([]); // kept so the "You.com calls" card can come back for a demo
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();
  const [savedAt, setSavedAt] = useState<number>();
  const [sent, setSent] = useState<SendResult | null>(null);
  const [testNumber, setTestNumber] = useState<string | null>(null);
  const [channel, setChannel] = useState<"sms" | "whatsapp">("sms");

  // Test mode (SMS_TEST_NUMBER on the server): every SMS goes only to that number.
  useEffect(() => {
    fetch("/api/send").then((r) => r.json()).then((j: { testNumber: string | null; channel?: "sms" | "whatsapp" }) => { setTestNumber(j.testNumber); setChannel(j.channel ?? "sms"); }).catch(() => {});
  }, []);

  const log = (c: EndpointCall[]) => setCalls((prev) => [...prev, ...c]);

  // Load the company the creator clicked, then its trust check, brief and suggested message.
  useEffect(() => {
    if (!loaded) return;
    const hit = recallCompany(decodeURIComponent(id));
    if (!hit) { router.replace("/discover"); return; }
    const c = hit.company;
    setCompany(c);
    const draft = findDraft(c.id);
    if (draft) { setMessage(draft.message); setTo(draft.to); setSavedAt(draft.updatedAt); }

    (async () => {
      try {
        let v = hit.verdict;
        if (!v) {
          setBusy("Checking the brand");
          const t = await postApi<TrustVerdict>("/api/trust", { company: c });
          log(t.calls); v = t.data; rememberCompany(c, v);
        }
        setVerdict(v);
        setBusy("Researching the brand");
        const b = await postApi<Brief>("/api/brief", { company: c, niche: profile.niche, links: profileLinks(profile) });
        log(b.calls); setBrief(b.data);
        // The brand's public number, found on the web by research (only if the creator hasn't typed one).
        if (b.data.contact?.phone) setTo((cur) => cur || b.data.contact!.phone!);
        const d = await postApi<Draft>("/api/draft", { company: c, brief: b.data, creator: { niche: profile.niche, links: profileLinks(profile) } });
        setSuggested(d.data.message);
        if (!draft) setMessage(d.data.message);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy(undefined);
      }
    })();
  }, [loaded, id]); // eslint-disable-line react-hooks/exhaustive-deps

  const go = (i: number) => { setStep(i); setMaxReached((m) => Math.max(m, i)); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const canNext = step === 2 ? message.trim().length > 0 : step === 1 ? !!brief : !!company;

  const doSaveDraft = () => {
    if (!company) return;
    saveDraft({ company, trust: verdict?.level, message, to });
    setSavedAt(Date.now());
  };

  const send = async () => {
    if (!company) return;
    setBusy("Sending SMS"); setError(undefined);
    try {
      const r = await postApi<SendResult>("/api/send", { to, message, approved: true });
      recordPitch({ company, trust: verdict?.level, message, to });
      logActivity({ kind: "pitch", title: `Pitched ${company.name}`, detail: "SMS sent", tone: "ok", href: "/discover" });
      setSent(r.data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(undefined);
    }
  };

  if (!company) return <div className="min-h-64 animate-pulse rounded-xl bg-subtle" />;

  const red = verdict?.level === "red";

  return (
    <div className="lg:flex lg:h-[calc(100vh-4rem)] lg:flex-col lg:overflow-hidden">
      <nav className="text-sm text-muted" aria-label="Breadcrumb">
        <Link href="/discover" className="hover:text-foreground hover:underline">Find brands</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Pitch {company.name}</span>
      </nav>
      <div className="mt-3 flex items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Pitch {company.name}</h1>
        <FavoriteButton company={company} verdict={verdict} variant="inline" />
      </div>
      <div className="mt-5"><Stepper steps={STEPS} current={sent ? STEPS.length : step} maxReached={sent ? -1 : maxReached} onGo={go} /></div>

      <div className="mt-6 grid grid-cols-1 gap-10 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 lg:flex lg:min-h-0 lg:flex-col">
          {sent ? (
            <div className="py-6 text-center">
              <div className="flex justify-center"><Slime size={120} blink bob /></div>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight">Sent to {company.name}!</h2>
              <p className="mt-1 text-sm text-muted">We saved it in your History, so you can mark it when they reply.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link href="/discover" className="btn"><ArrowLeft size={15} /> Back to brands</Link>
                <Link href="/discover?view=history" className="btn-ghost">Open history</Link>
              </div>
              <p className="mt-4 text-xs text-muted">
                {sent.provider === "mock" ? "Demo mode: no real SMS was sent." : `${sent.testMode ? "Test mode: sent" : "Sent"} to ${sent.to}${sent.channel === "whatsapp" ? " on WhatsApp" : " by SMS"}${sent.testMode ? ", not to the brand." : "."}`}
              </p>
            </div>
          ) : (
            <>
              <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-3">
              {/* Step 1: Brand */}
              {step === 0 && (
                <section>
                  <h2 className="text-2xl font-semibold tracking-tight">Brand</h2>
                  <p className="mt-1 text-sm text-muted">Who you&apos;re pitching, and whether they look real.</p>
                  <div className="card mt-5 overflow-hidden">
                    <div className="relative">
                      <CompanyCover company={company} className="aspect-[16/6] w-full [@media(max-height:820px)]:aspect-[16/4]" />
                      <div className="absolute -bottom-6 left-5"><CompanyLogo company={company} size={52} /></div>
                    </div>
                    <div className="space-y-4 p-5 pt-9">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-lg font-semibold">{company.name}</div>
                          <a href={`https://${company.domain}`} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-sm text-muted hover:text-accent">
                            {company.domain} <ExternalLink size={12} />
                          </a>
                        </div>
                        <TrustBadge verdict={verdict} loading={!verdict} />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-muted">Reason to reach out</div>
                        <p className="mt-1 text-sm"><span className="font-medium text-accent">{TRIGGER_LABEL[company.trigger.type]}</span> · {company.trigger.date}</p>
                        <p className="mt-1 text-sm text-foreground/85">{company.trigger.summary}</p>
                        <a href={company.trigger.sourceUrl} target="_blank" rel="noreferrer noopener" className="mt-1 inline-flex items-center gap-1 text-xs text-accent underline">Source <ExternalLink size={11} /></a>
                      </div>
                      {verdict && (
                        <div>
                          <div className="text-xs font-medium text-muted">Trust check</div>
                          <ul className="mt-1 space-y-1 text-sm">
                            {verdict.signals.map((s) => (
                              <li key={s.label}>
                                <span className="font-medium">{s.label}.</span> <span className="text-foreground/75">{s.detail}</span>
                                {s.sourceUrl && <a href={s.sourceUrl} target="_blank" rel="noreferrer noopener" className="ml-2 text-xs text-accent underline">source</a>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {red && <div className="rounded-lg bg-bad-soft p-3 text-sm text-bad">This brand looks like a scam. We don&apos;t recommend contacting them, and sending is turned off.</div>}
                      <div className="text-xs text-muted">Contact hints: {company.contactHints.join(" · ")}</div>
                    </div>
                  </div>
                </section>
              )}

              {/* Step 2: Why it fits */}
              {step === 1 && (
                <section>
                  <h2 className="text-2xl font-semibold tracking-tight">Why it fits</h2>
                  <p className="mt-1 text-sm text-muted">Why now is a good time, and why you&apos;re the right creator. Every point has a source.</p>
                  {!brief ? (
                    <div className="mt-6 animate-pulse text-sm text-muted">Researching the brand…</div>
                  ) : (
                    <div className="mt-6 space-y-5">
                      <div className="card p-5"><div className="text-xs font-medium text-muted">Why now</div><p className="mt-1 text-sm">{brief.whyNow}</p></div>
                      <div className="card p-5"><div className="text-xs font-medium text-muted">Why you</div><p className="mt-1 text-sm">{brief.creatorFit}</p></div>
                      <SourceList sources={brief.sources} />
                    </div>
                  )}
                </section>
              )}

              {/* Step 3: Message */}
              {step === 2 && (
                <section>
                  <h2 className="text-2xl font-semibold tracking-tight">Message</h2>
                  <p className="mt-1 text-sm text-muted">This is the SMS the brand gets. Keep it short and personal. The preview updates as you type.</p>
                  <label className="label mt-6" htmlFor="msg">Your message</label>
                  <textarea id="msg" className="field min-h-44 leading-relaxed" value={message} onChange={(e) => { setMessage(e.target.value); setApproved(false); }} />
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="hint">{message.length} characters · {Math.ceil(message.length / 160) || 0} SMS. Under 320 reads best.</span>
                    {suggested && message !== suggested && (
                      <button type="button" onClick={() => setMessage(suggested)} className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
                        <RotateCcw size={14} /> Use suggested message
                      </button>
                    )}
                  </div>
                </section>
              )}

              {/* Step 4: Send */}
              {step === 3 && (
                <section>
                  <h2 className="text-2xl font-semibold tracking-tight">Send</h2>
                  <p className="mt-1 text-sm text-muted">Check the number and send it as an SMS. Nothing goes out until you press Send.</p>
                  {testNumber && (
                    <div className="mt-4 rounded-lg bg-accent-soft p-3 text-sm text-accent">
                      <span className="font-medium">Test mode.</span> Every message goes only to <span className="font-medium">{testNumber}</span>{channel === "whatsapp" ? " on WhatsApp" : ""}, not to {company.name}.
                    </div>
                  )}
                  <div className="mt-6 space-y-5">
                    <div>
                      <label className="label" htmlFor="to">Send to</label>
                      <input id="to" className="field max-w-xs" value={to} onChange={(e) => setTo(e.target.value)} placeholder="+1 555 000 0000" />
                      {!brief ? (
                        <p className="mt-1.5 animate-pulse hint">Looking for {company.name}&apos;s phone number on the web…</p>
                      ) : brief.contact?.phone && to === brief.contact.phone ? (
                        <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm text-accent">
                          <Globe size={14} /> Found on the web
                          {brief.contact.sourceUrl && (
                            <a href={brief.contact.sourceUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 underline">
                              {hostOf(brief.contact.sourceUrl)} <ExternalLink size={11} />
                            </a>
                          )}
                          <span className="text-muted">· it&apos;s their public business line, so check it can get texts</span>
                        </p>
                      ) : brief.contact?.phone ? (
                        <p className="mt-1.5 hint">You changed it. The number we found was <button type="button" onClick={() => setTo(brief.contact!.phone!)} className="font-medium text-accent underline">{brief.contact.phone}</button>.</p>
                      ) : (
                        <p className="mt-1.5 hint">We couldn&apos;t find a public phone number for {company.name}. Check their contact page.</p>
                      )}
                      {brief?.contact?.email && (
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted"><Mail size={14} /> They also list <a href={`mailto:${brief.contact.email}`} className="font-medium text-foreground underline">{brief.contact.email}</a></p>
                      )}
                    </div>
                    <div className="card p-4 text-sm">
                      <div className="flex justify-between gap-3"><span className="text-muted">To</span><span className="font-medium">{company.name} · {to || "no number yet"}</span></div>
                      <div className="mt-2 flex justify-between gap-3"><span className="text-muted">Length</span><span>{message.length} characters · {Math.ceil(message.length / 160)} SMS</span></div>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={approved} onChange={(e) => setApproved(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
                      I read the message and it&apos;s good to send
                    </label>
                    {red && <div className="rounded-lg bg-bad-soft p-3 text-sm text-bad">Sending is turned off because this brand looks like a scam.</div>}
                    <button type="button" className="btn" disabled={!approved || (!to.trim() && !testNumber) || !message.trim() || red || !!busy} onClick={send}>
                      <Send size={15} /> {busy === "Sending SMS" ? "Sending…" : channel === "whatsapp" ? "Send on WhatsApp" : "Send SMS"}
                    </button>
                  </div>
                </section>
              )}

              {error && <div className="mt-4 flex items-center gap-2 text-sm text-bad"><CircleAlert size={16} /> {error}</div>}

              </div>

              {/* Back / Save draft / Next */}
              <div className="mt-6 flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
                {step > 0 ? (
                  <button type="button" onClick={() => go(step - 1)} className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground"><ArrowLeft size={16} /> Back</button>
                ) : (
                  <Link href="/discover" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground"><ArrowLeft size={16} /> All brands</Link>
                )}
                <div className="flex items-center gap-3">
                  {savedAt && <span className="hidden items-center gap-1 text-xs text-muted sm:inline-flex"><Check size={13} /> Draft saved</span>}
                  <button type="button" className="btn-ghost" onClick={doSaveDraft} disabled={!message.trim()}>Save draft</button>
                  {step < STEPS.length - 1 && (
                    <button type="button" className="btn" onClick={() => go(step + 1)} disabled={!canNext}>Next <ArrowRight size={15} /></button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <aside className="min-w-0 lg:flex lg:min-h-0 lg:items-center lg:justify-center">
          <SmsPhonePreview fromName={profile.name} message={message} caption={`How ${company.name} gets it`} />
        </aside>
      </div>
    </div>
  );
}
