/**
 * Keenable web search client (https://keenable.ai, docs.keenable.ai).
 *
 * The AI providers OZENMod ships do not have live internet access, so the AI
 * Assistant uses Keenable to look things up on demand — verifying links and
 * scam claims, identifying people/games/events, and answering questions that
 * need current facts. Framework-free; `fetch` is injectable for tests.
 *
 * API: POST https://api.keenable.ai/v1/search. Works with NO API key on the free
 * tier (1000 requests/hour, 10/second); an optional `X-API-Key` only raises the
 * rate limits — so OZENMod's web search is free with no signup.
 */

const ENDPOINT = 'https://api.keenable.ai/v1/search';

export interface SearchQuery {
  /** The search query. Required. */
  query: string;
  /** Restrict results to a single domain, e.g. "twitch.tv". */
  site?: string;
  /** ISO date — only results published on/after this date. */
  publishedAfter?: string;
  /** ISO date — only results published on/before this date. */
  publishedBefore?: string;
  /** Maximum results to keep (client-side cap; default 6). */
  limit?: number;
}

export interface SearchResult {
  title: string;
  url: string;
  description: string;
  snippet: string;
  publishedAt?: string;
}

export interface SearchOptions {
  /** Hard timeout in milliseconds. */
  timeoutMs: number;
  signal?: AbortSignal;
}

export interface WebSearch {
  search(query: SearchQuery, opts: SearchOptions): Promise<SearchResult[]>;
}

interface KeenableResponse {
  query?: string;
  results?: {
    title?: string;
    url?: string;
    description?: string;
    snippet?: string;
    published_at?: string;
  }[];
}

/**
 * Create a Keenable-backed web search. The API key is OPTIONAL — without one the
 * free unauthenticated tier is used; a key (kept server-side) only raises the
 * rate limits.
 */
export function createKeenableSearch(apiKey?: string, fetchImpl: typeof fetch = fetch): WebSearch {
  return {
    async search(query: SearchQuery, opts: SearchOptions): Promise<SearchResult[]> {
      if (!query.query.trim()) return [];
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), opts.timeoutMs);
      if (opts.signal) opts.signal.addEventListener('abort', () => controller.abort());
      try {
        const body: Record<string, string> = { query: query.query.trim() };
        if (query.site) body.site = query.site;
        if (query.publishedAfter) body.published_after = query.publishedAfter;
        if (query.publishedBefore) body.published_before = query.publishedBefore;

        const headers: Record<string, string> = { 'content-type': 'application/json' };
        if (apiKey) headers['X-API-Key'] = apiKey;
        const res = await fetchImpl(ENDPOINT, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Keenable HTTP ${res.status}`);
        const data = (await res.json()) as KeenableResponse;
        const limit = query.limit ?? 6;
        return (data.results ?? [])
          .filter((r): r is NonNullable<typeof r> & { url: string } => typeof r?.url === 'string')
          .slice(0, limit)
          .map((r) => ({
            title: r.title?.trim() || r.url,
            url: r.url,
            description: r.description?.trim() ?? '',
            snippet: r.snippet?.trim() ?? '',
            ...(r.published_at ? { publishedAt: r.published_at } : {}),
          }));
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
