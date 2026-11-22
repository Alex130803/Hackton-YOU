/** "https://www.Acme.com/about?x" -> "acme.com"; null if it isn't a website. Shared by client and server. */
export function toDomain(input: string): string | null {
  const raw = input.trim();
  if (!raw || /\s/.test(raw) || !raw.includes(".")) return null;
  try {
    const host = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).hostname.toLowerCase().replace(/^www\./, "");
    return /^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(host) ? host : null;
  } catch {
    return null;
  }
}
