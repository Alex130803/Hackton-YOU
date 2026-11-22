// OWNER: Person B
// Domain age via RDAP (public, no key). rdap.org redirects to the authoritative registry server.

export interface DomainInfo {
  domain: string;
  registeredAt?: string; // ISO
  ageDays?: number;
  registrar?: string;
}

/** TODO(Person B): handle redirects/timeouts, cache results, extract registrar from entities. */
export async function lookupDomain(domain: string): Promise<DomainInfo> {
  const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
    signal: AbortSignal.timeout(8_000),
    headers: { Accept: "application/rdap+json" },
  });
  if (!res.ok) return { domain };
  const json = (await res.json()) as { events?: { eventAction: string; eventDate: string }[] };
  const reg = json.events?.find((e) => e.eventAction === "registration")?.eventDate;
  const ageDays = reg ? Math.floor((Date.now() - new Date(reg).getTime()) / 86_400_000) : undefined;
  return { domain, registeredAt: reg, ageDays };
}
