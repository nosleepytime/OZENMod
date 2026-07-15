import { describe, it, expect, vi } from 'vitest';
import { RestClient } from './rest-client';

type FetchArgs = [url: string | URL | Request, init?: RequestInit];

function res(status: number, body: unknown = {}, headers: Record<string, string> = {}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (k: string) => headers[k] ?? null },
    json: async () => body,
  } as unknown as Response;
}

function client(fetchImpl: typeof fetch) {
  return new RestClient({
    databaseUrl: 'https://db.example.com/',
    getIdToken: () => 'idtok',
    fetchImpl,
  });
}

describe('RestClient', () => {
  it('builds authenticated .json URLs and PATCHes a debounced flush', async () => {
    const fetchImpl = vi.fn((..._a: FetchArgs) => Promise.resolve(res(200)));
    await client(fetchImpl as unknown as typeof fetch).update('sessions/u1/counters', {
      messages: 10,
    });
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(String(url)).toBe('https://db.example.com/sessions/u1/counters.json?auth=idtok');
    expect(init!.method).toBe('PATCH');
    expect(JSON.parse(init!.body as string)).toEqual({ messages: 10 });
  });

  it('returns the push id from a POST', async () => {
    const fetchImpl = vi.fn((..._a: FetchArgs) => Promise.resolve(res(200, { name: '-Nabc' })));
    const id = await client(fetchImpl as unknown as typeof fetch).push('sessions/u1/recent', {
      t: 1,
    });
    expect(id).toBe('-Nabc');
  });

  it('treats a 304 as not-modified with the previous etag', async () => {
    const fetchImpl = vi.fn((..._a: FetchArgs) => Promise.resolve(res(304)));
    const out = await client(fetchImpl as unknown as typeof fetch).pollWithEtag(
      'channels/u1/config',
      'etag-1',
    );
    expect(out.notModified).toBe(true);
    expect(out.value).toBeNull();
    expect(out.etag).toBe('etag-1');
  });

  it('returns a fresh value and new etag when changed', async () => {
    const fetchImpl = vi.fn((..._a: FetchArgs) =>
      Promise.resolve(res(200, { configVersion: 2 }, { ETag: 'etag-2' })),
    );
    const out = await client(fetchImpl as unknown as typeof fetch).pollWithEtag<{
      configVersion: number;
    }>('channels/u1/config', 'etag-1');
    expect(out.notModified).toBe(false);
    expect(out.value).toEqual({ configVersion: 2 });
    expect(out.etag).toBe('etag-2');
  });

  it('throws on a non-ok write', async () => {
    const fetchImpl = vi.fn((..._a: FetchArgs) => Promise.resolve(res(401)));
    await expect(
      client(fetchImpl as unknown as typeof fetch).set('channels/u1/config', {}),
    ).rejects.toThrow(/HTTP 401/);
  });
});
