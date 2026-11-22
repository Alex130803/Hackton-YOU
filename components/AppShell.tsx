"use client";
// Shows onboarding first in every new browser window; everything else gets the sidebar layout.
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isWindowOnboarded } from "@/lib/profile";
import { Sidebar } from "./Sidebar";

export function AppShell({ demo, children }: { demo: boolean; children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState<boolean | null>(null); // null = not checked yet
  const onOnboarding = path === "/onboarding";

  useEffect(() => {
    const ok = isWindowOnboarded();
    setReady(ok);
    if (!ok && !onOnboarding) router.replace("/onboarding");
  }, [path, onOnboarding, router]);

  if (onOnboarding) return <>{children}</>;
  if (!ready) return <div className="min-h-screen" />; // avoid flashing the app before redirect

  return (
    <div className="flex min-h-screen">
      <Sidebar demo={demo} />
      <main className="min-w-0 flex-1 px-4 py-6 md:px-10 md:py-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
