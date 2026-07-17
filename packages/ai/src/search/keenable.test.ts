import { describe, it, expect, vi } from 'vitest';
import { createKeenableSearch } from './keenable';

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as Response;
}

describe('createKeenableSearch', () => {
  it('POSTs to /v1/search with the API key and maps results', async () => {
    const fetchImpl = vi.fn(async (_url: string, _init?: RequestInit) =>
      jsonResponse({
        query: 'free bits scam',
        results: [
          {
            title: 'Free bits giveaway is a scam',
            url: 'https://example.com/a',
            description: 'desc',
            snippet: 'snip',
            published_at: '2026-01-02',
          },
          { url: 'https://example.com/b' },
        ],
      }),
    );

    const search = createKeenableSearch('secret-key', fetchImpl as unknown as typeof fetch);
    const results = await search.search(
      { query: 'free bits scam', site: 'https://twitch.tv/x' },
      {
        timeoutMs: 2000,
      },
    );

    const call = fetchImpl.mock.calls[0]!;
    const init = call[1]!;
    expect(call[0]).toBe('https://api.keenable.ai/v1/search');
    expect(init.method).toBe('POST');
    const headers = init.headers as Record<string, string>;
    expect(headers['X-API-Key']).toBe('secret-key');
    // site is normalized to a bare domain by callers; here it is passed through.
    expect(JSON.parse(init.body as string)).toMatchObject({
      query: 'free bits scam',
      site: 'https://twitch.tv/x',
    });

    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({
      title: 'Free bits giveaway is a scam',
      url: 'https://example.com/a',
      publishedAt: '2026-01-02',
    });
    // A result without a title falls back to its URL.
    expect(results[1]!.title).toBe('https://example.com/b');
  });

  it('omits the API key header when no key is given (free tier)', async () => {
    const fetchImpl = vi.fn(async (_url: string, _init?: RequestInit) =>
      jsonResponse({ results: [] }),
    );
    const search = createKeenableSearch(undefined, fetchImpl as unknown as typeof fetch);
    await search.search({ query: 'anything' }, { timeoutMs: 1000 });
    const headers = fetchImpl.mock.calls[0]![1]!.headers as Record<string, string>;
    expect(headers['X-API-Key']).toBeUndefined();
    expect(headers['content-type']).toBe('application/json');
  });

  it('returns [] for a blank query without calling the API', async () => {
    const fetchImpl = vi.fn();
    const search = createKeenableSearch('k', fetchImpl as unknown as typeof fetch);
    expect(await search.search({ query: '   ' }, { timeoutMs: 1000 })).toEqual([]);
    expect(fetchImpl.mock.calls).toHaveLength(0);
  });

  it('throws on a non-ok response', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({}, false, 429));
    const search = createKeenableSearch('k', fetchImpl as unknown as typeof fetch);
    await expect(search.search({ query: 'x' }, { timeoutMs: 1000 })).rejects.toThrow('HTTP 429');
  });
});
