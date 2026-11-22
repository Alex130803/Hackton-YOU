"use client";
// OWNER: Person B — simulated iPhone for the Offer check demo. Space steps through: Mail inbox, open the email,
// screenshot (side + volume up), screenshot editor, share sheet, share the image to Ultraviolet, check, verdict.
// Nothing is read from the image: the sample's known text is what gets checked.
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  ArrowUp, Check, ChevronRight, Copy, Crop, Eraser, FolderClosed, Highlighter, Images, LoaderCircle, Mail, MessageCircle,
  PenLine, Pencil, Plus, Printer, Radar, Redo2, Ruler, Search, Share, StickyNote, Trash2, Undo2, X,
} from "lucide-react";
import { postApi } from "@/lib/api";
import { logActivity } from "@/lib/activity";
import { screenshotFollowups, screenshotSamples, screenshotText, screenshotUrl, type ScreenshotSample } from "@/lib/mocks/screenshots";
import type { DealCheck, EndpointCall, TrustLevel } from "@/lib/types";
import { Slime } from "@/components/Slime";
import { MailScreen } from "./MailScreen";
import css from "./phone.module.css";

// Screen is laid out in iPhone 13 Pro Max points (428x926) and scaled into the frame.
const W = 428;
const H = 926;
const SCREEN_W = 340;
const S = SCREEN_W / W;
const SCREEN_H = Math.round(H * S);
const BEZEL = 12;
const FRAME_W = SCREEN_W + BEZEL * 2;
const FRAME_H = SCREEN_H + BEZEL * 2;
const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

const ROW_TOP = 195;
const ROW_H = 96;
const IMG = { x: 49, y: 104, w: 330 };
const IMG_SCALE = IMG.w / W;
const THUMB = { x: 16, y: 679, scale: 0.23 };
const SHEET_TOP = 330;
const EXT_TOP = 58;
const UPLOAD_MS = 850;
const ACTIONS_TOP = 840;

const STEPS = ["inbox", "mail", "screenshot", "editor", "share", "extension", "checking", "result", "compose", "sent"] as const;
type Step = (typeof STEPS)[number];
const at = (step: Step, from: Step) => STEPS.indexOf(step) >= STEPS.indexOf(from);

const CAPTION: Record<Step, string> = {
  inbox: "A brand-deal email arrives in Mail",
  mail: "Open the email",
  screenshot: "Take a screenshot (side button + volume up)",
  editor: "Tap the screenshot thumbnail",
  share: "Tap Share",
  extension: "Share the screenshot to Ultraviolet",
  checking: "Ultraviolet checks it with You.com",
  result: "The verdict: ignore it, or ask the brand",
  compose: "The email is ready. The creator taps Send.",
  sent: "Sent. Everything closes.",
};

// Key 1/2/3 picks the email. Inbox shows newest first.
const KEY_ORDER = ["hollyland-followup", "creoventura-andaseat", "hollyland-first"];
const INBOX_ORDER = ["creoventura-andaseat", "hollyland-followup", "hollyland-first"];
const FILLERS = [
  { from: "YouTube", subject: "Your weekly channel summary", preview: "Your videos got 12.4K views this week. Here's what stood out.", date: "7/9/26" },
  { from: "Canva", subject: "Your design is ready", preview: "Your thumbnail \"Desk setup tour\" is ready to download.", date: "7/8/26" },
];
const SHORT_DATE: Record<string, string> = { "hollyland-first": "7/10/26", "hollyland-followup": "7/11/26", "creoventura-andaseat": "9/21/26" };

const ENDPOINT: Record<EndpointCall["endpoint"], string> = { search: "Search", news: "News", extract: "Extract", research: "Research", finance_research: "Finance Research" };
const VERDICT: Record<TrustLevel, { title: string; glow: string; color: string; todo: string }> = {
  red: { title: "Don't reply", glow: "rgba(239, 35, 60, 0.55)", color: "#e5172f", todo: "What to do" },
  yellow: { title: "Check first", glow: "rgba(245, 158, 11, 0.55)", color: "#d97706", todo: "Suggested reply" },
  green: { title: "Looks real", glow: "rgba(22, 163, 74, 0.5)", color: "#16a34a", todo: "Suggested reply" },
};

type ShotState = "hidden" | "full" | "thumb" | "editor";
const SHOT_TRANSFORM: Record<ShotState, string> = {
  hidden: "translate(0px, 0px) scale(1)",
  full: "translate(0px, 0px) scale(1)",
  thumb: `translate(${THUMB.x}px, ${THUMB.y}px) scale(${THUMB.scale})`,
  editor: `translate(${IMG.x}px, ${IMG.y}px) scale(${IMG_SCALE})`,
};

function touchFor(next: Step, sample: ScreenshotSample): [number, number] | undefined {
  switch (next) {
    case "mail": return [214, ROW_TOP + INBOX_ORDER.indexOf(sample.id) * ROW_H + ROW_H / 2];
    case "editor": return [THUMB.x + (W * THUMB.scale) / 2, THUMB.y + (H * THUMB.scale) / 2];
    case "share": return [357, 71];
    case "extension": return [22 + 80 + 31, SHEET_TOP + 94 + 31];
    case "checking": return [388, EXT_TOP + 28];
    case "compose": return [315, ACTIONS_TOP + 26];
    case "sent": return [W - 34, EXT_TOP + 14 + 29];
    default: return undefined;
  }
}

export function Phone({ onCalls }: { onCalls?: (calls: EndpointCall[]) => void }) {
  const [sampleId, setSampleId] = useState(KEY_ORDER[0]);
  const sample = screenshotSamples.find((s) => s.id === sampleId) ?? screenshotSamples[0];
  const [step, setStep] = useState<Step>("inbox");
  const [shot, setShot] = useState<ShotState>("hidden");
  const [pressed, setPressed] = useState(false);
  const [flashKey, setFlashKey] = useState(0);
  const [touch, setTouch] = useState<{ x: number; y: number; key: number }>();
  const [upload, setUpload] = useState<0 | 1 | 2>(0);
  const [result, setResult] = useState<DealCheck | null>(null);
  const [calls, setCalls] = useState<EndpointCall[]>([]);
  const [shown, setShown] = useState(0);
  const [error, setError] = useState<string>();
  const [scale, setScale] = useState(1);
  const [closePhase, setClosePhase] = useState(0);
  const stepRef = useRef<Step>("inbox");
  const busyRef = useRef(false);
  const timers = useRef<number[]>([]);

  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const reset = useCallback((id?: string) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (id) setSampleId(id);
    stepRef.current = "inbox";
    busyRef.current = false;
    setStep("inbox"); setShot("hidden"); setPressed(false); setTouch(undefined); setUpload(0); setClosePhase(0);
    setResult(null); setCalls([]); setShown(0); setError(undefined);
    onCalls?.([]);
    console.log("[phone-demo] reset", { sample: id ?? "same" });
  }, [onCalls]);

  const runCheck = useCallback((s: ScreenshotSample) => {
    const started = Date.now();
    console.log("[phone-demo] sharing screenshot, checking", s.id);
    later(() => setUpload(1), 30);
    later(() => setUpload(2), UPLOAD_MS + 50);
    postApi<DealCheck>("/api/inbound", { text: screenshotText(s) })
      .then((r) => {
        console.log("[phone-demo] result", { level: r.data.verdict.level, score: r.data.verdict.score, calls: r.calls.length });
        const lvl = r.data.verdict.level;
        logActivity({ kind: "check", title: `Checked ${s.fromName}`, detail: lvl === "red" ? "Likely scam" : lvl === "yellow" ? "Check first" : "Looks real", tone: lvl === "red" ? "bad" : lvl === "yellow" ? "warn" : "ok", href: "/check" });
        const wait = Math.max(0, UPLOAD_MS + 150 - (Date.now() - started));
        later(() => {
          setCalls(r.calls); setResult(r.data);
          r.calls.forEach((_, i) => later(() => setShown(i + 1), (i + 1) * 380));
          later(() => { stepRef.current = "result"; setStep("result"); }, r.calls.length * 380 + 500);
        }, wait);
      })
      .catch((e) => { console.error("[phone-demo] check failed", e); setError((e as Error).message); });
  }, []);

  const enter = useCallback((next: Step) => {
    stepRef.current = next;
    setStep(next);
    busyRef.current = false;
    console.log("[phone-demo] step", next);
    if (next === "screenshot") {
      setPressed(true);
      later(() => setPressed(false), 260);
      later(() => { setFlashKey((k) => k + 1); setShot("full"); }, 120);
      later(() => setShot("thumb"), 320);
    }
    if (next === "editor") setShot("editor");
    if (next === "checking") runCheck(sample);
    if (next === "sent") {
      // iOS-style close-out: the compose sheet sends, then the app, the editor and the email close in turn.
      busyRef.current = true;
      setClosePhase(0);
      later(() => setClosePhase(1), 550);
      later(() => setClosePhase(2), 1050);
      later(() => setClosePhase(3), 1500);
      later(() => { busyRef.current = false; console.log("[phone-demo] simulation closed"); }, 2000);
    }
  }, [runCheck, sample]);

  const next = useCallback(() => {
    const cur = stepRef.current;
    if (busyRef.current || cur === "checking") return;
    if (cur === "sent") { reset(); return; }
    const nxt = STEPS[STEPS.indexOf(cur) + 1];
    const t = touchFor(nxt, sample);
    if (!t) { enter(nxt); return; }
    busyRef.current = true;
    setTouch((p) => ({ x: t[0], y: t[1], key: (p?.key ?? 0) + 1 }));
    later(() => enter(nxt), 160);
  }, [enter, reset, sample]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, [contenteditable=true]")) return;
      if (e.code === "Space") { e.preventDefault(); (document.activeElement as HTMLElement | null)?.blur(); next(); }
      else if (e.code === "Escape") reset();
      else if (/^Digit[1-3]$/.test(e.code)) reset(KEY_ORDER[Number(e.code.slice(5)) - 1]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, reset]);

  useEffect(() => { onCalls?.(calls.slice(0, shown)); }, [calls, shown, onCalls]);

  useEffect(() => {
    const fit = () => setScale(Math.max(0.6, Math.min(1, (window.innerHeight - 250) / FRAME_H)));
    fit();
    window.addEventListener("resize", fit);
    return () => { window.removeEventListener("resize", fit); timers.current.forEach(clearTimeout); };
  }, []);

  const closed = (phase: number) => step === "sent" && closePhase >= phase;
  const mailOn = step !== "inbox" && !closed(3);
  const editorOn = at(step, "editor") && !closed(2);
  const darkTop = editorOn;
  const sheetUp = step === "share";
  const extUp = at(step, "extension") && !closed(1);
  const composeUp = step === "compose";
  const followup = screenshotFollowups[sample.id];

  return (
    <div className="flex flex-col items-center gap-4">
      <div style={{ width: FRAME_W * scale, height: FRAME_H * scale }}>
        <div className="relative" style={{ width: FRAME_W, height: FRAME_H, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
          {/* side buttons: action, volume up, volume down (left); side button (right) */}
          <SideButton side="left" top={128} h={30} />
          <SideButton side="left" top={186} h={60} pressed={pressed} />
          <SideButton side="left" top={258} h={60} />
          <SideButton side="right" top={214} h={96} pressed={pressed} />
          <div className="absolute inset-0 rounded-[62px] bg-[#1c1c1e] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45),inset_0_0_0_2px_#3a3a3c]" />
          <div className="absolute overflow-hidden rounded-[50px] bg-white" style={{ left: BEZEL, top: BEZEL, width: SCREEN_W, height: SCREEN_H }}>
            <div className="absolute left-0 top-0 select-none" style={{ width: W, height: H, transform: `scale(${S})`, transformOrigin: "0 0" }}>
              {/* Inbox and message, with iOS push transition */}
              <div className="absolute inset-0" style={{ transform: mailOn ? "translateX(-30%)" : "translateX(0)", transition: `transform 480ms ${EASE}` }}>
                <Inbox selectedId={sample.id} tapped={mailOn} />
                <div className="absolute inset-0 bg-black" style={{ opacity: mailOn ? 0.08 : 0, transition: "opacity 480ms" }} />
              </div>
              <div className="absolute inset-0 shadow-[-8px_0_24px_rgba(0,0,0,0.08)]" style={{ transform: mailOn ? "translateX(0)" : "translateX(100%)", transition: `transform 480ms ${EASE}` }}>
                <MailScreen sample={sample} />
              </div>

              {/* Screenshot editor chrome */}
              <div className="absolute inset-0 bg-black" style={{ opacity: editorOn ? 1 : 0, transition: "opacity 320ms", pointerEvents: "none" }}>
                <div className="absolute flex w-full items-center justify-between px-4 text-white" style={{ top: 47, height: 48 }}>
                  <span className="text-[17px] font-semibold text-[#0a84ff]">Done</span>
                  <span className="flex items-center gap-[22px]"><Crop size={22} /><Share size={22} /><Trash2 size={22} /></span>
                </div>
                <div className="absolute flex w-full items-center justify-between px-6 text-white" style={{ top: 842, height: 44 }}>
                  <span className="flex gap-4 opacity-80"><Undo2 size={20} /><Redo2 size={20} /></span>
                  <span className="flex items-end gap-4"><PenLine size={24} /><Highlighter size={24} className="text-yellow-300" /><Pencil size={24} /><Eraser size={24} /><Ruler size={24} /></span>
                  <span className="flex items-center gap-3"><span className="h-6 w-6 rounded-full bg-[conic-gradient(#ff3b30,#ffcc00,#34c759,#0a84ff,#af52de,#ff3b30)]" /><Plus size={22} /></span>
                </div>
              </div>

              {/* The screenshot: full -> thumbnail -> editor */}
              {shot !== "hidden" && (
                <div
                  className="absolute left-0 top-0 overflow-hidden bg-white"
                  style={{
                    width: W, height: H, transformOrigin: "0 0", transform: SHOT_TRANSFORM[shot],
                    transition: shot === "full" ? "none" : shot === "thumb" ? "transform 520ms cubic-bezier(0.2, 0.9, 0.25, 1.06), box-shadow 300ms, border-radius 300ms" : `transform 460ms ${EASE}, box-shadow 300ms, border-radius 300ms, opacity 320ms`,
                    boxShadow: shot === "thumb" ? "0 0 0 16px #fff, 0 24px 70px rgba(0,0,0,0.35)" : "none",
                    borderRadius: shot === "thumb" ? 44 : 0,
                    opacity: closed(2) ? 0 : 1,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={screenshotUrl(sample)} alt="" width={W} height={H} className="block" draggable={false} />
                </div>
              )}

              {flashKey > 0 && <div key={`flash-${flashKey}`} className={`pointer-events-none absolute inset-0 bg-white ${css.flash}`} />}

              {/* Share sheet, then the Ultraviolet share extension */}
              <div className="absolute inset-0 bg-black" style={{ opacity: sheetUp || extUp ? 0.35 : 0, transition: "opacity 380ms", pointerEvents: "none" }} />
              <ShareSheet sample={sample} up={sheetUp} />
              <div className="absolute inset-x-0 bottom-0 flex flex-col overflow-hidden rounded-t-[14px] bg-white" style={{ top: EXT_TOP, transform: composeUp ? "translateY(-6px) scale(0.93)" : extUp ? "translateY(0)" : "translateY(105%)", transformOrigin: "50% 0", transition: `transform 460ms ${EASE}` }}>
                <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#e5e5ea] px-4 text-[17px]">
                  <span className="text-accent">{step === "result" ? "" : "Cancel"}</span>
                  <span className="flex items-center gap-2 font-semibold">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icon.svg" alt="" width={22} height={22} /> Ultraviolet
                  </span>
                  <span className={`font-semibold ${step === "extension" ? "text-accent" : step === "result" ? "text-accent" : "text-black/30"}`}>{step === "result" ? "Done" : "Check"}</span>
                </div>
                <div className="flex-1 overflow-hidden px-5 pb-10 pt-5 text-[15px]">
                  {step === "extension" && <SharedImage sample={sample} />}
                  {step === "checking" && <Checking sample={sample} upload={upload} calls={calls} shown={shown} error={error} />}
                  {at(step, "result") && result && <Verdict result={result} />}
                </div>
                {at(step, "result") && result && followup && (
                  <div className={`absolute inset-x-5 flex gap-3 ${css.rise}`} style={{ top: ACTIONS_TOP - EXT_TOP }}>
                    <span className="grid h-[52px] flex-1 place-items-center rounded-[14px] bg-[#f2f2f7] text-[17px] font-semibold text-black/70">Ignore it</span>
                    <span className="grid h-[52px] flex-1 place-items-center rounded-[14px] bg-accent text-[17px] font-semibold text-white">Ask {followup.brand}</span>
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 bg-black" style={{ opacity: composeUp ? 0.2 : 0, transition: "opacity 400ms" }} />
              </div>
              {followup && <Compose sample={sample} followup={followup} up={composeUp} />}

              <StatusBar light={darkTop} />
              <div className="absolute left-1/2 h-[5px] w-[134px] -translate-x-1/2 rounded-full" style={{ bottom: 8, background: step === "editor" || (step === "sent" && editorOn && !extUp) ? "#fff" : "#111", transition: "background 300ms" }} />
              <div className="absolute left-1/2 -translate-x-1/2 rounded-full bg-black" style={{ top: 11, width: 126, height: 37 }} />
              {touch && <div key={`touch-${touch.key}`} className={`pointer-events-none absolute rounded-full border-2 border-white/80 bg-[rgba(120,120,128,0.55)] ${css.tap}`} style={{ left: touch.x, top: touch.y, width: 46, height: 46 }} />}
            </div>
          </div>
        </div>
      </div>
      <div className="text-center">
        <div className="text-sm font-medium">{step === "sent" && closePhase >= 3 ? "Done. Press Space to start again." : CAPTION[step]}</div>
        <div className="mt-1 text-xs text-muted">
          Step {STEPS.indexOf(step) + 1} of {STEPS.length} &middot; <Kbd>Space</Kbd> next &middot; <Kbd>1</Kbd> <Kbd>2</Kbd> <Kbd>3</Kbd> pick email &middot; <Kbd>Esc</Kbd> restart
        </div>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded border border-line bg-subtle px-1.5 py-0.5 font-sans text-[11px]">{children}</kbd>;
}

function SideButton({ side, top, h, pressed }: { side: "left" | "right"; top: number; h: number; pressed?: boolean }) {
  return (
    <div
      className="absolute w-[5px] rounded-sm bg-[#2c2c2e]"
      style={{ top, height: h, [side]: -3, transform: pressed ? `translateX(${side === "left" ? 2 : -2}px)` : "none", background: pressed ? "#48484a" : undefined, transition: "transform 90ms, background 90ms" }}
    />
  );
}

function StatusBar({ light }: { light: boolean }) {
  const c = light ? "#fff" : "#111";
  return (
    <div className="absolute inset-x-0 top-0 flex items-center justify-between" style={{ height: 47, padding: "0 30px 0 36px", color: c, fontWeight: 600, fontSize: 16, transition: "color 300ms" }}>
      <span>9:41</span>
      <span className="flex items-center gap-1.5">
        <span className="flex items-end gap-[2px]">{[4, 6, 8, 10].map((h) => <i key={h} className="block w-[3px] rounded-[1px]" style={{ height: h, background: c }} />)}</span>
        <span className="rounded-[4px] border-[1.5px] p-[1.5px]" style={{ width: 25, height: 12, borderColor: light ? "rgba(255,255,255,0.6)" : "#999" }}>
          <b className="block h-full w-4/5 rounded-[2px]" style={{ background: c }} />
        </span>
      </span>
    </div>
  );
}

function Inbox({ selectedId, tapped }: { selectedId: string; tapped: boolean }) {
  const rows = [
    ...INBOX_ORDER.map((id) => {
      const s = screenshotSamples.find((x) => x.id === id)!;
      return { id, from: s.fromName, subject: s.subject, preview: s.body.split("\n\n")[1] ?? "", date: SHORT_DATE[id], unread: true };
    }),
    ...FILLERS.map((f, i) => ({ id: `filler-${i}`, ...f, unread: false })),
  ];
  return (
    <div className="absolute inset-0 bg-white" style={{ font: '15px/1.35 -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif' }}>
      <div className="flex items-center justify-between px-4 text-[17px] text-[#0a64d8]" style={{ marginTop: 47, height: 44 }}>
        <span>&#8249; Mailboxes</span><span>Edit</span>
      </div>
      <div className="px-4 text-[34px] font-bold leading-[50px]">Inbox</div>
      <div className="mx-4 mt-1.5 flex h-9 items-center gap-2 rounded-[10px] bg-[#eeeef0] px-2 text-[17px] text-[#8e8e93]"><Search size={17} /> Search</div>
      <div className="absolute inset-x-0" style={{ top: ROW_TOP }}>
        {rows.map((r) => (
          <div key={r.id} className="relative pl-[30px] pr-4" style={{ height: ROW_H, background: tapped && r.id === selectedId ? "#d1d1d6" : "transparent", transition: "background 120ms" }}>
            {r.unread && <span className="absolute left-[11px] top-[17px] h-[10px] w-[10px] rounded-full bg-[#0a84ff]" />}
            <div className="flex h-full flex-col justify-center border-b border-[#e5e5ea]">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[17px] font-semibold">{r.from}</span>
                <span className="flex shrink-0 items-center text-[15px] text-[#8e8e93]">{r.date}<ChevronRight size={16} /></span>
              </div>
              <div className="truncate">{r.subject}</div>
              <div className="line-clamp-2 text-[#8e8e93]">{r.preview}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShareSheet({ sample, up }: { sample: ScreenshotSample; up: boolean }) {
  const apps = [
    { name: "AirDrop", icon: <Radar size={32} />, bg: "bg-[#0a84ff] text-white" },
    // eslint-disable-next-line @next/next/no-img-element
    { name: "Ultraviolet", icon: <img src="/icon.svg" alt="" width={40} height={40} />, bg: "bg-accent-soft" },
    { name: "Messages", icon: <MessageCircle size={32} fill="#fff" />, bg: "bg-[#34c759] text-white" },
    { name: "Mail", icon: <Mail size={32} />, bg: "bg-[#0a84ff] text-white" },
    { name: "Notes", icon: <StickyNote size={30} />, bg: "bg-[#ffd60a] text-[#3a3a3c]" },
  ];
  const actions = [
    { name: "Copy", icon: <Copy size={20} /> },
    { name: "Save to Files", icon: <FolderClosed size={20} /> },
    { name: "Add to Shared Album", icon: <Images size={20} /> },
    { name: "Print", icon: <Printer size={20} /> },
  ];
  return (
    <div className="absolute inset-x-0 bottom-0 rounded-t-[14px] bg-[#f2f2f7]" style={{ top: SHEET_TOP, transform: up ? "translateY(0)" : "translateY(105%)", transition: `transform 440ms ${EASE}` }}>
      <div className="flex h-[80px] items-center gap-3 border-b border-[#d8d8dc] px-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={screenshotUrl(sample)} alt="" className="h-[58px] w-auto rounded-[6px] border border-[#d8d8dc]" />
        <div className="flex-1">
          <div className="text-[16px] font-semibold">Screenshot</div>
          <div className="text-[13px] text-[#8e8e93]">PNG Image &middot; {Math.round(sample.bytes / 1024)} KB</div>
        </div>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[#e3e3e8] text-[#8e8e93]"><X size={16} /></span>
      </div>
      <div className="flex gap-[18px] px-[22px] pt-[14px]">
        {apps.map((a) => (
          <div key={a.name} className="flex w-[62px] flex-col items-center gap-1.5">
            <div className={`grid h-[62px] w-[62px] place-items-center rounded-[15px] ${a.bg}`}>{a.icon}</div>
            <span className="text-[12px]">{a.name}</span>
          </div>
        ))}
      </div>
      <div className="mx-4 mt-5 overflow-hidden rounded-[12px] bg-white">
        {actions.map((a, i) => (
          <div key={a.name} className={`flex h-[50px] items-center justify-between px-4 text-[17px] ${i ? "border-t border-[#e5e5ea]" : ""}`}>{a.name}<span className="text-[#3a3a3c]">{a.icon}</span></div>
        ))}
      </div>
    </div>
  );
}

function SharedImage({ sample }: { sample: ScreenshotSample }) {
  return (
    <div className={`flex flex-col items-center ${css.rise}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={screenshotUrl(sample)} alt="Shared screenshot" className="h-[560px] w-auto rounded-[16px] border border-[#e5e5ea] shadow-[0_18px_50px_-12px_rgba(0,0,0,0.35)]" />
      <div className="mt-4 text-[16px] font-semibold">Screenshot</div>
      <div className="text-[13px] text-[#8e8e93]">PNG Image &middot; {Math.round(sample.bytes / 1024)} KB</div>
    </div>
  );
}

function Checking({ sample, upload, calls, shown, error }: { sample: ScreenshotSample; upload: 0 | 1 | 2; calls: EndpointCall[]; shown: number; error?: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={screenshotUrl(sample)} alt="" className="h-[300px] w-auto rounded-[12px] border border-[#e5e5ea]" />
        <div className="absolute inset-x-3 bottom-3 h-[6px] overflow-hidden rounded-full bg-black/15">
          <div className="h-full rounded-full bg-accent" style={{ width: upload ? "100%" : "0%", transition: `width ${UPLOAD_MS}ms ease-in-out` }} />
        </div>
      </div>
      <div className="mt-2 text-[13px] text-[#8e8e93]">{upload === 2 ? "Screenshot received" : "Sending screenshot…"}</div>
      <div className="mt-3 w-full">
        {calls.slice(0, Math.max(shown + 1, 1)).map((c, i) => (
          <div key={i} className={`flex items-center gap-3 border-b border-[#efeff2] py-2.5 text-[14px] ${css.rise}`}>
            {i < shown ? <span className="grid h-5 w-5 place-items-center rounded-full bg-ok text-white"><Check size={13} /></span> : <LoaderCircle size={20} className={`text-accent ${css.spin}`} />}
            <span><span className="font-semibold">{ENDPOINT[c.endpoint]}</span> <span className="text-[#6b6b70]">{c.label}</span></span>
          </div>
        ))}
      </div>
      {error && <div className="mt-3 text-[14px] text-bad">Check failed. Press Esc to restart.</div>}
    </div>
  );
}

function Verdict({ result }: { result: DealCheck }) {
  const v = VERDICT[result.verdict.level];
  const reasons = result.verdict.signals.slice(0, 3).map((s) => s.label).join(" · ");
  return (
    <div className="flex flex-col items-center pt-8 text-center">
      <div className={css.sign} style={{ "--glow": v.glow } as CSSProperties}>
        <Slime size={150} blink />
      </div>
      <div className={`mt-5 text-[32px] font-bold tracking-tight ${css.rise}`}>{v.title}</div>
      <div className={`mt-1 text-[16px] text-[#6b6b70] ${css.rise}`}>{reasons}</div>
      <SafeMeter score={result.verdict.score} color={v.color} />
      <div className={`mt-6 w-full rounded-[16px] bg-[#f2f2f7] px-4 py-3.5 text-left ${css.rise}`}>
        <div className="text-[12px] font-semibold uppercase tracking-wide text-[#8e8e93]">{v.todo}</div>
        <div className="mt-1 text-[16px] leading-snug">{result.suggestedReply}</div>
      </div>
    </div>
  );
}

/** How safe the offer looks, 0-100%: the number counts up while the bar fills. */
function SafeMeter({ score, color }: { score: number; color: string }) {
  const target = Math.round(Math.max(0, Math.min(100, score)));
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now() + 350;
    const tick = (now: number) => {
      const k = Math.min(1, Math.max(0, (now - t0) / 900));
      setN(Math.round(target * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return (
    <div className={`mt-6 w-full ${css.rise}`} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={target} aria-label="How safe this offer looks">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-semibold uppercase tracking-wide text-[#8e8e93]">Safe</span>
        <span className="text-[28px] font-bold tabular-nums leading-none" style={{ color }}>{n}%</span>
      </div>
      <div className="mt-2.5 h-3 w-full overflow-hidden rounded-full bg-[#ececf1]">
        <div className={`h-full rounded-full ${css.fill}`} style={{ width: `${target}%`, background: color }} />
      </div>
      <div className="mt-1.5 flex justify-between text-[12px] text-[#8e8e93]"><span>0%</span><span>100%</span></div>
    </div>
  );
}

function Compose({ sample, followup, up }: { sample: ScreenshotSample; followup: { brand: string; to: string; subject: string; body: string }; up: boolean }) {
  const row = "flex min-h-[46px] items-center gap-2 border-b border-[#e5e5ea] px-4 text-[16px]";
  return (
    <div className="absolute inset-x-0 bottom-0 flex flex-col overflow-hidden rounded-t-[14px] bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.15)]" style={{ top: EXT_TOP + 14, transform: up ? "translateY(0)" : "translateY(105%)", transition: `transform 480ms ${EASE}` }}>
      <div className="flex h-[58px] shrink-0 items-center justify-between px-4">
        <span className="text-[17px] text-[#0a84ff]">Cancel</span>
        <span className="mx-3 truncate text-[17px] font-semibold">{followup.subject}</span>
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#0a84ff] text-white ${up ? css.sign : ""}`} style={{ "--glow": "rgba(10, 132, 255, 0.55)" } as CSSProperties}><ArrowUp size={21} strokeWidth={2.6} /></span>
      </div>
      <div className={row}><span className="text-[#8e8e93]">To:</span><span className="rounded-full bg-[#e8f1ff] px-2.5 py-0.5 text-[#0a64d8]">{followup.to}</span></div>
      <div className={row}><span className="text-[#8e8e93]">Cc/Bcc, From:</span><span>maya.makes@icloud.com</span></div>
      <div className={row}><span className="text-[#8e8e93]">Subject:</span><span className="truncate">{followup.subject}</span></div>
      <div className="flex-1 overflow-hidden px-4 pt-3 text-[16px] leading-[1.4]">
        {followup.body.split("\n\n").map((p, i) => <p key={i} className="mb-3 whitespace-pre-line">{p}</p>)}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={screenshotUrl(sample)} alt="Attached screenshot" className="mt-1 h-[170px] w-auto rounded-[8px] border border-[#e5e5ea]" />
        <p className="mt-3 text-[#8e8e93]">Sent from my iPhone</p>
      </div>
    </div>
  );
}
