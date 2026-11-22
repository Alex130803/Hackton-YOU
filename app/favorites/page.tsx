"use client";
// OWNER: Person A — brands the creator hearted. Saved in the shared SQLite file (data/ultraviolet.db).
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Search } from "lucide-react";
import { useFavorites } from "@/lib/favorites";
import { rememberCompany } from "@/lib/companyStore";
import { timeAgo } from "@/lib/activity";
import { PageHeader } from "@/components/PageHeader";
import { CompanyCard } from "@/components/CompanyCard";
import type { TrustVerdict } from "@/lib/types";

export default function FavoritesPage() {
  const { favorites, ready } = useFavorites();
  const router = useRouter();

  return (
    <>
      <PageHeader title="Favorites" infoTip description="Brands you saved with the heart. They're stored in the shared database, so your teammate sees them too." />

      {!ready ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="card h-72 animate-pulse bg-subtle" />)}
        </div>
      ) : favorites.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line p-10 text-center">
          <Heart size={22} className="mx-auto text-muted" />
          <p className="mt-3 text-sm text-muted">No favorites yet. Tap the heart on a brand to save it here.</p>
          <Link href="/discover" className="btn mt-5"><Search size={15} /> Find brands</Link>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted">{favorites.length} saved {favorites.length === 1 ? "brand" : "brands"}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {favorites.map((f) => {
              // The trust result saved with the heart (no extra API calls here); the pitch page re-checks it.
              const verdict: TrustVerdict | undefined = f.trust && f.trustScore != null ? { level: f.trust, score: f.trustScore, signals: [] } : undefined;
              return (
                <CompanyCard
                  key={f.company.id}
                  company={f.company}
                  verdict={verdict}
                  tag={`Saved ${timeAgo(f.createdAt)}`}
                  onSelect={() => { rememberCompany(f.company); router.push(`/discover/${encodeURIComponent(f.company.id)}`); }}
                />
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
