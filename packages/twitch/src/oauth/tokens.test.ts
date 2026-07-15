import { describe, it, expect, vi } from 'vitest';
import { TokenManager, refreshTokens } from './tokens';
import type { TwitchTokens } from '../types';

function tokenResponse(access: string, expiresIn: number): Response {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      access_token: access,
      refresh_token: 'refresh-next',
      expires_in: expiresIn,
      scope: ['chat:read'],
    }),
  } as unknown as Response;
}

describe('TokenManager', () => {
  it('returns the current token while it is still valid', async () => {
    const fetchImpl = vi.fn();
    const tokens: TwitchTokens = {
      accessToken: 'valid',
      refreshToken: 'r',
      expiresAt: Date.now() + 5 * 60_000,
      scopes: [],
    };
    const mgr = new TokenManager(
      { clientId: 'c', fetchImpl: fetchImpl as unknown as typeof fetch },
      tokens,
      () => {},
    );
    expect(await mgr.getAccessToken()).toBe('valid');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('refreshes and persists when the token is near expiry', async () => {
    const fetchImpl = vi.fn(async () => tokenResponse('fresh', 3600));
    const saved: TwitchTokens[] = [];
    const tokens: TwitchTokens = {
      accessToken: 'stale',
      refreshToken: 'r',
      expiresAt: Date.now() + 10_000, // < 60s buffer → refresh
      scopes: [],
    };
    const mgr = new TokenManager(
      { clientId: 'c', fetchImpl: fetchImpl as unknown as typeof fetch },
      tokens,
      (t) => {
        saved.push(t);
      },
    );
    expect(await mgr.getAccessToken()).toBe('fresh');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(saved).toHaveLength(1);
    expect(saved[0]!.accessToken).toBe('fresh');
  });

  it('coalesces concurrent refreshes into one request', async () => {
    const fetchImpl = vi.fn(async () => tokenResponse('fresh', 3600));
    const tokens: TwitchTokens = {
      accessToken: 'stale',
      refreshToken: 'r',
      expiresAt: Date.now(),
      scopes: [],
    };
    const mgr = new TokenManager(
      { clientId: 'c', fetchImpl: fetchImpl as unknown as typeof fetch },
      tokens,
      () => {},
    );
    const [a, b] = await Promise.all([mgr.getAccessToken(), mgr.getAccessToken()]);
    expect(a).toBe('fresh');
    expect(b).toBe('fresh');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});

describe('refreshTokens', () => {
  it('throws on a failed refresh so the caller can re-auth', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 401 }) as Response);
    await expect(
      refreshTokens({ clientId: 'c', fetchImpl: fetchImpl as unknown as typeof fetch }, 'r'),
    ).rejects.toThrow(/HTTP 401/);
  });
});
