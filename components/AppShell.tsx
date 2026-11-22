"use client";
// Shows onboarding first for new users; everything else gets the sidebar layout.
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useProfile } from "@/lib/profile";
import { Sidebar } from "./Sidebar";

export function AppShell({ demo, children }: { demo: boolean; children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { profile, loaded } = useProfile();
  const onOnboarding = path === "/onboarding";

  useEffect(() => {
    if (loaded && !profile.onboarded && !onOnboarding) router.replace("/onboarding");
  }, [loaded, profile.onboarded, onOnboarding, router]);

  if (onOnboarding) return <>{children}</>;
  if (!loaded || !profile.onboarded) return <div className="min-h-screen" />; // avoid flashing the app before redirect

  return (
    <div className="flex min-h-screen">
      <Sidebar demo={demo} />
      <main className="min-w-0 flex-1 px-4 py-6 md:px-10 md:py-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
