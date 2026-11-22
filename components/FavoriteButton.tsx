"use client";
import { Heart } from "lucide-react";
import { toggleFavorite, useFavorites } from "@/lib/favorites";
import type { Company, TrustVerdict } from "@/lib/types";

/** Heart toggle. Saves to the shared database right away. `variant="overlay"` sits on top of an image. */
export function FavoriteButton({ company, verdict, variant = "overlay" }: { company: Company; verdict?: TrustVerdict; variant?: "overlay" | "inline" }) {
  const { isFavorite } = useFavorites();
  const on = isFavorite(company.id);
  const label = on ? `Remove ${company.name} from favorites` : `Save ${company.name} to favorites`;
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); toggleFavorite(company, verdict); }}
      aria-pressed={on}
      aria-label={label}
      title={label}
      className={`grid place-items-center rounded-full border transition active:scale-90 ${
        variant === "overlay" ? "h-9 w-9 border-white/70 bg-white/90 backdrop-blur hover:bg-white" : "h-9 w-9 border-line bg-white hover:border-foreground"
      } ${on ? "text-accent" : "text-foreground/70 hover:text-foreground"}`}
    >
      <Heart size={17} strokeWidth={2} fill={on ? "currentColor" : "none"} />
    </button>
  );
}
