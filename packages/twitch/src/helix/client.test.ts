import { describe, it, expect, vi } from 'vitest';
import { HelixClient } from './client';

function mockResponse(status: number, headers: Record<string, string> = {}, body = ''): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (k: string) => headers[k] ?? null },
    text: async () => body,
    json: async () => (body ? JSON.parse(body) : {}),
  } as unknown as Response;
}

function makeClient(fetchImpl: typeof fetch) {
  return new HelixClient({
    clientId: 'cid',
    getAccessToken: () => 'tok',
    broadcasterId: '100',
    fetchImpl,
    sleep: async () => {},
  });
}

type FetchArgs = [url: string | URL | Request, init?: RequestInit];

describe('HelixClient request building', () => {
  it('sends a ban with duration for a timeout, with auth headers', async () => {
    const fetchImpl = vi.fn((..._args: FetchArgs) => Promise.resolve(mockResponse(200)));
    const client = makeClient(fetchImpl as unknown as typeof fetch);
    const res = await client.banUser('55', 600, 'spam');
    expect(res.ok).toBe(true);

    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(String(url)).toContain('/moderation/bans?broadcaster_id=100&moderator_id=100');
    const parsed = JSON.parse(init!.body as string);
    expect(parsed).toEqual({ data: { user_id: '55', duration: 600, reason: 'spam' } });
    const headers = init!.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer tok');
    expect(headers['Client-Id']).toBe('cid');
  });

  it('deletes a single message via the chat endpoint', async () => {
    const fetchImpl = vi.fn((..._args: FetchArgs) => Promise.resolve(mockResponse(204)));
    const client = makeClient(fetchImpl as unknown as typeof fetch);
    await client.perform({ type: 'delete', messageId: 'abc-1' });
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(init!.method).toBe('DELETE');
    expect(String(url)).toContain('message_id=abc-1');
  });

  it('retries once on 429 honoring Retry-After, then succeeds', async () => {
    let n = 0;
    const fetchImpl = vi.fn((..._args: FetchArgs) => {
      n += 1;
      return Promise.resolve(
        n === 1 ? mockResponse(429, { 'Retry-After': '1' }) : mockResponse(200),
      );
    });
    const client = makeClient(fetchImpl as unknown as typeof fetch);
    const res = await client.banUser('55');
    expect(res.ok).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('returns the error after a persistent failure', async () => {
    const fetchImpl = vi.fn((..._args: FetchArgs) =>
      Promise.resolve(mockResponse(400, {}, 'bad request')),
    );
    const client = makeClient(fetchImpl as unknown as typeof fetch);
    const res = await client.warnUser('55', 'because');
    expect(res.ok).toBe(false);
    expect(res.status).toBe(400);
    expect(res.error).toContain('bad request');
  });

  it('maps users by login', async () => {
    const fetchImpl = vi.fn((..._args: FetchArgs) =>
      Promise.resolve(
        mockResponse(
          200,
          {},
          JSON.stringify({
            data: [
              { id: '7', login: 'dan', display_name: 'Dan', profile_image_url: 'http://x/y.png' },
            ],
          }),
        ),
      ),
    );
    const client = makeClient(fetchImpl as unknown as typeof fetch);
    const users = await client.getUsersByLogin(['dan']);
    expect(users).toEqual([
      { id: '7', login: 'dan', displayName: 'Dan', avatarUrl: 'http://x/y.png' },
    ]);
  });
});
