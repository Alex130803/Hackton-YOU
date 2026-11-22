"use client";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { House, Search, ShieldCheck, Settings, Send, ScanSearch, PanelLeftClose, PanelLeftOpen } from "lucide-react";
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
const COLLAPSE_KEY = "creator-outreach.sidebar-collapsed";

/** Active link: its icon + label glide to the center of the button. Inactive links stay left-aligned. */
function NavLink({ href, label, icon: Icon, active, linkRef }: { href: string; label: string; icon: typeof House; active: boolean; linkRef?: (el: HTMLAnchorElement | null) => void }) {
  const ownRef = useRef<HTMLAnchorElement | null>(null);
  const innerRef = useRef<HTMLSpanElement | null>(null);
  const [shift, setShift] = useState(0);
  const [animate, setAnimate] = useState(false);

  useLayoutEffect(() => {
    const link = ownRef.current, inner = innerRef.current;
    if (!link || !inner) return;
    const measure = () => {
      // offsetLeft/offsetWidth ignore transforms, so this is the distance from the resting spot to the center.
      const center = (link.clientWidth - inner.offsetWidth) / 2 - inner.offsetLeft;
      setShift(active ? Math.round(center) : 0);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(link);
    return () => ro.disconnect();
  }, [active, label]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimate(true)); // no glide on first paint
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <Link
      ref={(el) => { ownRef.current = el; linkRef?.(el); }}
      href={href}
      title={label}
      aria-current={active ? "page" : undefined}
      className={`relative z-10 flex items-center justify-center rounded-xl px-3 py-2.5 text-[15px] transition-colors duration-200 md:group-data-[wide=true]/sb:justify-start ${
        active ? "font-medium text-accent" : "text-foreground/75 hover:bg-white/70 hover:text-foreground"
      }`}
    >
      <span
        ref={innerRef}
        className={`inline-flex items-center gap-3 ${animate ? "transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none" : ""}`}
        style={{ transform: `translateX(${shift}px)` }}
      >
        <Icon size={20} strokeWidth={active ? 2.2 : 1.8} className="shrink-0" />
        <span className="hidden whitespace-nowrap md:group-data-[wide=true]/sb:inline">{label}</span>
      </span>
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
    <div className="relative flex flex-col gap-1.5">
      <span
        aria-hidden
        className={`absolute inset-x-0 top-0 rounded-xl border border-sidebar-line bg-white ${animate ? "transition-[transform,height,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]" : ""}`}
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
    <Link href={a.href} className="group flex items-start gap-2.5 rounded-lg px-3 py-1.5 hover:bg-white/70">
      <Icon size={15} className="mt-0.5 shrink-0 text-muted group-hover:text-foreground" />
      <span className="min-w-0 flex-1">
        <span className="block truncate whitespace-nowrap text-sm text-foreground/85">{a.title}</span>
        <span className="flex items-center gap-1.5 text-xs text-muted">
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

  // Collapsible on desktop (phones always get the narrow icon bar). Remembered per browser.
  const [collapsed, setCollapsed] = useState(false);
  const [animateWidth, setAnimateWidth] = useState(false);
  useEffect(() => {
    try { setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1"); } catch {}
    const id = requestAnimationFrame(() => setAnimateWidth(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const toggle = () => setCollapsed((c) => {
    try { localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1"); } catch {}
    return !c;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") { e.preventDefault(); toggle(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const initials = profile.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const weekAgo = Date.now() - 7 * 86_400_000;
  const week = activity.filter((a) => a.at > weekAgo);
  const stats = [
    { label: "Pitches sent", value: week.filter((a) => a.kind === "pitch").length },
    { label: "Offers checked", value: week.filter((a) => a.kind === "check").length },
    { label: "Scams caught", value: week.filter((a) => a.kind === "check" && a.tone === "bad").length },
  ];

  return (
    <aside
      data-wide={!collapsed}
      className={`group/sb sticky top-2 my-2 ml-2 flex h-[calc(100vh-1rem)] w-[68px] shrink-0 flex-col overflow-hidden rounded-2xl border border-sidebar-line bg-sidebar px-2 py-4 md:top-3 md:my-3 md:ml-3 md:h-[calc(100vh-1.5rem)] data-[wide=true]:md:w-[17rem] data-[wide=true]:md:px-3 ${
        animateWidth ? "transition-[width,padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none" : ""
      }`}
    >
      <div className="mb-6 flex flex-col items-center gap-3 md:group-data-[wide=true]/sb:flex-row md:group-data-[wide=true]/sb:justify-between">
        <Link href="/" className="flex items-center gap-2 px-1.5">
          <Slime size={38} blink />
          <span className="hidden whitespace-nowrap text-base font-semibold tracking-tight md:group-data-[wide=true]/sb:inline">Ultraviolet</span>
        </Link>
        <button
          type="button"
          onClick={toggle}
          title={collapsed ? "Expand sidebar (Ctrl/⌘ B)" : "Collapse sidebar (Ctrl/⌘ B)"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          className="hidden h-9 w-9 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-white/70 hover:text-foreground md:grid"
        >
          {collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
        </button>
      </div>

      <nav>
        <NavGroup items={NAV} isActive={isActive} />
      </nav>

      <div className="mt-6 hidden min-h-0 flex-1 flex-col md:group-data-[wide=true]/sb:flex">
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
        <div className="mb-2 hidden rounded-xl border border-sidebar-line bg-white p-3 md:group-data-[wide=true]/sb:block">
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

        <div className="border-t border-sidebar-line pt-3">
          <NavGroup items={[{ href: "/settings", label: "Settings", icon: Settings }]} isActive={isActive} />
          <Link href="/settings" title={profile.name} className="mt-1 flex items-center justify-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-white/70 md:group-data-[wide=true]/sb:justify-start">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-white">{initials}</span>
            <span className="hidden min-w-0 md:group-data-[wide=true]/sb:block">
              <span className="block truncate text-[15px] font-medium">{profile.name}</span>
              <span className="block truncate text-xs text-muted">{profile.niche}{demo ? " · Demo" : ""}</span>
            </span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
