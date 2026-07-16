import { describe, it, expect, vi } from 'vitest';
import { IdentityToolkit, TokenManager } from './identity';

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as Response;
}

describe('IdentityToolkit', () => {
  it('signs in with a custom token and computes expiry', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ idToken: 'id-1', refreshToken: 'r-1', expiresIn: '3600' }),
    ) as unknown as typeof fetch;
    const kit = new IdentityToolkit({ apiKey: 'k', fetchImpl, now: () => 1000 });
    const s = await kit.signInWithCustomToken('custom');
    expect(s.idToken).toBe('id-1');
    expect(s.refreshToken).toBe('r-1');
    expect(s.expiresAt).toBe(1000 + 3600 * 1000);
  });

  it('throws on a non-ok response', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({}, false, 401)) as unknown as typeof fetch;
    const kit = new IdentityToolkit({ apiKey: 'k', fetchImpl });
    await expect(kit.signInWithCustomToken('bad')).rejects.toThrow('HTTP 401');
  });

  it('refreshes using the snake_case token fields', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ id_token: 'id-2', refresh_token: 'r-2', expires_in: '3600' }),
    ) as unknown as typeof fetch;
    const kit = new IdentityToolkit({ apiKey: 'k', fetchImpl, now: () => 0 });
    const s = await kit.refresh('r-1');
    expect(s.idToken).toBe('id-2');
    expect(s.refreshToken).toBe('r-2');
  });
});

describe('TokenManager', () => {
  it('returns the current token and refreshes when it is near expiry', async () => {
    let clock = 0;
    const calls: string[] = [];
    const fetchImpl = vi.fn(async (url: string | URL | Request) => {
      const u = String(url);
      if (u.includes('signInWithCustomToken')) {
        calls.push('signin');
        return jsonResponse({ idToken: 'id-1', refreshToken: 'r-1', expiresIn: '3600' });
      }
      calls.push('refresh');
      return jsonResponse({ id_token: 'id-2', refresh_token: 'r-2', expires_in: '3600' });
    }) as unknown as typeof fetch;

    const kit = new IdentityToolkit({ apiKey: 'k', fetchImpl, now: () => clock });
    const mgr = new TokenManager(kit, () => clock);
    await mgr.start('custom');
    expect(await mgr.getIdToken()).toBe('id-1'); // fresh, no refresh

    clock = 3600 * 1000; // past the refresh skew window
    expect(await mgr.getIdToken()).toBe('id-2'); // refreshed
    expect(calls).toEqual(['signin', 'refresh']);
  });

  it('throws when used before sign-in', async () => {
    const kit = new IdentityToolkit({
      apiKey: 'k',
      fetchImpl: (async () => jsonResponse({})) as unknown as typeof fetch,
    });
    const mgr = new TokenManager(kit);
    await expect(mgr.getIdToken()).rejects.toThrow('not signed in');
  });
});
