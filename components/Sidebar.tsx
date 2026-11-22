"use client";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { House, Search, ShieldCheck, Settings, Send, ScanSearch } from "lucide-react";
import { useProfile } from "@/lib/profile";
import { timeAgo, useActivity, type Activity } from "@/lib/activity";
import { Slime } from "./Slime";

const NAV = [
  { href: "/", label: "Home", icon: House },
  { href: "/discover", label: "Find brands", icon: Search },
  { href: "/check", label: "Offer check", icon: ShieldCheck },
];

const KIND_ICON = { search: ScanSearch, pitch: Send, check: ShieldCheck } as const;
const TONE = { ok: "bg-ok", warn: "bg-warn", bad: "bg-bad" } as const;

function NavLink({ href, label, icon: Icon, active, linkRef }: { href: string; label: string; icon: typeof House; active: boolean; linkRef?: (el: HTMLAnchorElement | null) => void }) {
  return (
    <Link
      ref={linkRef}
      href={href}
      title={label}
      aria-current={active ? "page" : undefined}
      className={`relative z-10 flex items-center justify-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-200 md:justify-start ${
        active ? "font-medium text-accent" : "text-foreground/75 hover:bg-black/[0.04] hover:text-foreground"
      }`}
    >
      <Icon size={18} strokeWidth={active ? 2.2 : 1.8} className="shrink-0 transition-[stroke-width] duration-200" />
      <span className="hidden md:inline">{label}</span>
    </Link>
  );
}

/** Group of links with a highlight pill that slides smoothly to the active one. */
function NavGroup({ items, isActive }: { items: { href: string; label: string; icon: typeof House }[]; isActive: (href: string) => boolean }) {
  const refs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [pill, setPill] = useState<{ top: number; height: number; show: boolean }>({ top: 0, height: 0, show: false });
  const [animate, setAnimate] = useState(false);
  const activeHref = items.find((i) => isActive(i.href))?.href;

  const measure = () => {
    const el = activeHref ? refs.current[activeHref] : null;
    setPill((p) => (el ? { top: el.offsetTop, height: el.offsetHeight, show: true } : { ...p, show: false }));
  };
  useLayoutEffect(measure, [activeHref]);
  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimate(true)); // no slide on first paint
    window.addEventListener("resize", measure);
    return () => { cancelAnimationFrame(id); window.removeEventListener("resize", measure); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative flex flex-col gap-1">
      <span
        aria-hidden
        className={`absolute inset-x-0 top-0 rounded-lg bg-accent-soft ${animate ? "transition-[transform,height,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]" : ""}`}
        style={{ transform: `translateY(${pill.top}px)`, height: pill.height, opacity: pill.show ? 1 : 0 }}
      />
      {items.map((n) => (
        <NavLink key={n.href} {...n} active={isActive(n.href)} linkRef={(el) => { refs.current[n.href] = el; }} />
      ))}
    </div>
  );
}

function RecentItem({ a }: { a: Activity }) {
  const Icon = KIND_ICON[a.kind];
  return (
    <Link href={a.href} className="group flex items-start gap-2.5 rounded-lg px-3 py-1.5 hover:bg-black/[0.04]">
      <Icon size={14} className="mt-0.5 shrink-0 text-muted group-hover:text-foreground" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] text-foreground/85">{a.title}</span>
        <span className="flex items-center gap-1.5 text-[11px] text-muted">
          {a.tone && <span className={`h-1.5 w-1.5 rounded-full ${TONE[a.tone]}`} />}
          {a.detail ? `${a.detail} · ` : ""}{timeAgo(a.at)}
        </span>
      </span>
    </Link>
  );
}

export function Sidebar({ demo }: { demo: boolean }) {
  const path = usePathname();
  const { profile } = useProfile();
  const activity = useActivity();
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  const initials = profile.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const weekAgo = Date.now() - 7 * 86_400_000;
  const week = activity.filter((a) => a.at > weekAgo);
  const stats = [
    { label: "Pitches sent", value: week.filter((a) => a.kind === "pitch").length },
    { label: "Offers checked", value: week.filter((a) => a.kind === "check").length },
    { label: "Scams caught", value: week.filter((a) => a.kind === "check" && a.tone === "bad").length },
  ];

  return (
    <aside className="sticky top-0 flex h-screen w-16 shrink-0 flex-col border-r border-line bg-subtle px-2 py-4 md:w-64 md:px-3">
      <Link href="/" className="mb-6 flex items-center justify-center gap-2 px-1.5 md:justify-start">
        <Slime size={34} blink />
        <span className="hidden text-[15px] font-semibold tracking-tight md:inline">Ultraviolet</span>
      </Link>

      <nav>
        <NavGroup items={NAV} isActive={isActive} />
      </nav>

      <div className="mt-6 hidden min-h-0 flex-1 flex-col md:flex">
        <div className="mb-1 px-3 text-xs font-medium text-muted">Recent</div>
        {activity.length === 0 ? (
          <p className="px-3 text-[13px] leading-snug text-muted">Brands you pitch and offers you check show up here.</p>
        ) : (
          <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
            {activity.slice(0, 6).map((a) => <RecentItem key={a.id} a={a} />)}
          </div>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-1 pt-3">
        <div className="mb-2 hidden rounded-xl border border-line bg-white p-3 md:block">
          <div className="text-xs font-medium text-muted">This week</div>
          <dl className="mt-2 grid grid-cols-3 gap-1 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="sr-only">{s.label}</dt>
                <dd className="text-lg font-semibold leading-none">{s.value}</dd>
                <div className="mt-1 text-[10px] leading-tight text-muted">{s.label}</div>
              </div>
            ))}
          </dl>
        </div>

        <div className="border-t border-line pt-3">
          <NavGroup items={[{ href: "/settings", label: "Settings", icon: Settings }]} isActive={isActive} />
          <Link href="/settings" title={profile.name} className="mt-1 flex items-center justify-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-black/[0.04] md:justify-start">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-white">{initials}</span>
            <span className="hidden min-w-0 md:block">
              <span className="block truncate text-sm font-medium">{profile.name}</span>
              <span className="block truncate text-xs text-muted">{profile.niche}{demo ? " · Demo" : ""}</span>
            </span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
