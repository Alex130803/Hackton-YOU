import { requireEnv } from "@/lib/env";
import type { EndpointCall, YouEndpoint } from "@/lib/types";

// Hosts verified against https://you.com/docs/llms.txt (quickstart "Each API has its own endpoint"):
//   Web Search  POST https://ydc-index.io/v1/search
//   Extract     POST https://ydc-index.io/v1/extract   (formerly "Contents")
//   Answer      POST https://api.you.com/v1/answer
//   Research    POST https://api.you.com/v1/research
//   Finance     POST https://api.you.com/v1/finance_research
// Auth: X-API-Key header, key from YDC_API_KEY.
export const YOU_INDEX = "https://ydc-index.io";
export const YOU_API = "https://api.you.com";

/** Collects which You.com endpoints a request hit, for the EndpointTimeline. */
export class CallLog {
  calls: EndpointCall[] = [];
  async track<T>(endpoint: YouEndpoint, label: string, fn: () => Promise<T>): Promise<T> {
    const call: EndpointCall = { endpoint, label, status: "running" };
    this.calls.push(call);
    const t = Date.now();
    try {
      const out = await fn();
      call.status = "done";
      return out;
    } catch (e) {
      call.status = "error";
      throw e;
    } finally {
      call.ms = Date.now() - t;
    }
  }
  mock(endpoint: YouEndpoint, label: string, ms = 0) {
    this.calls.push({ endpoint, label, status: "mock", ms });
  }
}

export async function youFetch<T>(
  base: typeof YOU_INDEX | typeof YOU_API,
  path: string,
  body: unknown,
  opts: { timeoutMs?: number } = {},
): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "X-API-Key": requireEnv("YDC_API_KEY"), "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(opts.timeoutMs ?? 30_000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`You.com ${path} -> HTTP ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}
