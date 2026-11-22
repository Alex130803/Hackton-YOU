import { youFetch, YOU_INDEX } from "./client";

// Docs: https://you.com/docs/guides/extract.md  (the "Contents" API is now called Extract)
// POST https://ydc-index.io/v1/extract — fetches a page/PDF server-side and returns Markdown/HTML.
// Deal Check uses this so the creator never opens a suspicious "brief" link themselves.

export interface ExtractResponse {
  url: string;
  title?: string;
  extraction_source?: string;
  contents?: { full_page?: { markdown?: string; html?: string } }; // empty object = nothing extracted
  metadata?: { site_name?: string; favicon_url?: string };
}

/** TODO(Person A/B): wire + handle empty `contents`; check docs for cache/timeout/PDF options. */
export async function extract(url: string): Promise<ExtractResponse> {
  return youFetch<ExtractResponse>(YOU_INDEX, "/v1/extract", {
    url,
    full_page: { extraction_formats: ["markdown"] },
  });
}
