import { Link2 } from "lucide-react";
import { PLATFORM_PATHS } from "@/lib/platformIcons";
import type { Platform } from "@/lib/profile";

const COLORS: Record<Platform, string> = { youtube: "#FF0000", instagram: "#E4405F", tiktok: "#000000" };

export function PlatformIcon({ platform, size = 16, mono = false }: { platform: Platform | "link"; size?: number; mono?: boolean }) {
  if (platform === "link") return <Link2 size={size} className="text-muted" />;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden fill={mono ? "currentColor" : COLORS[platform]}>
      <path d={PLATFORM_PATHS[platform]} />
    </svg>
  );
}
