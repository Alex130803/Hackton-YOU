// Client-side helper: POST to our API routes, return data + You.com calls for the timeline.
import type { ApiResult } from "@/lib/types";

export async function postApi<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? `${path} failed (${res.status})`);
  return json as ApiResult<T>;
}
