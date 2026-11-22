"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Search, ShieldCheck, Settings } from "lucide-react";
import { useProfile } from "@/lib/profile";

const NAV = [
  { href: "/", label: "Home", icon: House },
  { href: "/discover", label: "Find brands", icon: Search },
  { href: "/check", label: "Offer check", icon: ShieldCheck },
];

function NavLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: typeof House; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
        active ? "bg-accent-soft font-medium text-accent" : "text-foreground/75 hover:bg-black/[0.04] hover:text-foreground"
      }`}
    >
      <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
      <span className="hidden md:inline">{label}</span>
    </Link>
  );
}

export function Sidebar({ demo }: { demo: boolean }) {
  const path = usePathname();
  const { profile } = useProfile();
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  const initials = profile.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <aside className="sticky top-0 flex h-screen w-16 shrink-0 flex-col border-r border-line bg-subtle px-2 py-4 md:w-60 md:px-3">
      <Link href="/" className="mb-6 flex items-center gap-2 px-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-foreground text-sm font-bold text-white">C</span>
        <span className="hidden font-semibold tracking-tight md:inline">Creator Outreach</span>
      </Link>

      <nav className="flex flex-col gap-1">
        {NAV.map((n) => <NavLink key={n.href} {...n} active={isActive(n.href)} />)}
      </nav>

      <div className="mt-auto flex flex-col gap-1 border-t border-line pt-3">
        <NavLink href="/settings" label="Settings" icon={Settings} active={isActive("/settings")} />
        <Link href="/settings" className="mt-1 flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-black/[0.04]">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-white">{initials}</span>
          <span className="hidden min-w-0 md:block">
            <span className="block truncate text-sm font-medium">{profile.name}</span>
            <span className="block truncate text-xs text-muted">{demo ? "Demo mode" : "Live"}</span>
          </span>
        </Link>
      </div>
    </aside>
  );
}
