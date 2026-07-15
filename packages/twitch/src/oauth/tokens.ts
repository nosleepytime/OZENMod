/**
 * Access-token lifecycle: validation, refresh, and a small manager that keeps a
 * valid token available to the IRC/Helix clients, refreshing proactively.
 */
import type { TwitchTokens, TwitchUser } from '../types';

const ID_BASE = 'https://id.twitch.tv/oauth2';
const HELIX = 'https://api.twitch.tv/helix';

export interface OAuthContext {
  clientId: string;
  fetchImpl?: typeof fetch;
}

/** Refresh an access token. Throws on failure so the caller can re-auth. */
export async function refreshTokens(
  ctx: OAuthContext,
  refreshToken: string,
): Promise<TwitchTokens> {
  const fetchImpl = ctx.fetchImpl ?? fetch;
  const res = await fetchImpl(`${ID_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: ctx.clientId,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) throw new Error(`token refresh failed: HTTP ${res.status}`);
  const json = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    scope?: string[];
  };
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: Date.now() + json.expires_in * 1000,
    scopes: json.scope ?? [],
  };
}

/** Validate a token and return the identity + granted scopes. */
export async function validateToken(
  ctx: OAuthContext,
  accessToken: string,
): Promise<{ userId: string; login: string; scopes: string[] } | null> {
  const fetchImpl = ctx.fetchImpl ?? fetch;
  const res = await fetchImpl(`${ID_BASE}/validate`, {
    headers: { Authorization: `OAuth ${accessToken}` },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { user_id: string; login: string; scopes: string[] };
  return { userId: json.user_id, login: json.login, scopes: json.scopes };
}

/** Fetch the authenticated user's profile (id, login, display name, avatar). */
export async function getSelf(ctx: OAuthContext, accessToken: string): Promise<TwitchUser | null> {
  const fetchImpl = ctx.fetchImpl ?? fetch;
  const res = await fetchImpl(`${HELIX}/users`, {
    headers: { Authorization: `Bearer ${accessToken}`, 'Client-Id': ctx.clientId },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    data?: { id: string; login: string; display_name: string; profile_image_url: string }[];
  };
  const u = json.data?.[0];
  return u
    ? { id: u.id, login: u.login, displayName: u.display_name, avatarUrl: u.profile_image_url }
    : null;
}

/**
 * Keeps a valid access token available, refreshing ~1 minute before expiry.
 * Persists new tokens through the injected `save` callback (the desktop app
 * writes them to the OS keychain).
 */
export class TokenManager {
  private tokens: TwitchTokens;
  private readonly ctx: OAuthContext;
  private readonly save: (tokens: TwitchTokens) => Promise<void> | void;
  private refreshing: Promise<string> | null = null;

  constructor(
    ctx: OAuthContext,
    initial: TwitchTokens,
    save: (tokens: TwitchTokens) => Promise<void> | void,
  ) {
    this.ctx = ctx;
    this.tokens = initial;
    this.save = save;
  }

  /** Returns a currently-valid access token, refreshing if near expiry. */
  async getAccessToken(): Promise<string> {
    if (Date.now() < this.tokens.expiresAt - 60_000) return this.tokens.accessToken;
    if (!this.refreshing) {
      this.refreshing = (async () => {
        const next = await refreshTokens(this.ctx, this.tokens.refreshToken);
        this.tokens = next;
        await this.save(next);
        this.refreshing = null;
        return next.accessToken;
      })();
    }
    return this.refreshing;
  }

  get current(): TwitchTokens {
    return this.tokens;
  }
}
