/**
 * Twitch OAuth helpers for the website's Authorization Code flow
 * (docs/ARCHITECTURE.md §5.1). Builds the authorize URL, exchanges the code for
 * tokens, and reads the authenticated identity — all server-side, so the client
 * secret never reaches the browser. Reads configuration lazily and degrades
 * gracefully when the Twitch app credentials are not set.
 */
import { TWITCH_SCOPES } from '@ozenmod/shared';

export interface TwitchOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export function readTwitchConfig(): TwitchOAuthConfig | null {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  if (!clientId || !clientSecret) return null;
  return {
    clientId,
    clientSecret,
    redirectUri: `${appUrl.replace(/\/$/, '')}/api/auth/callback`,
  };
}

export function buildAuthorizeUrl(config: TwitchOAuthConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: TWITCH_SCOPES.join(' '),
    state,
    force_verify: 'true',
  });
  return `https://id.twitch.tv/oauth2/authorize?${params.toString()}`;
}

/** Cryptographically random state value for CSRF protection. */
export function randomState(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export interface TwitchIdentity {
  id: string;
  login: string;
  displayName: string;
  avatarUrl: string;
}

/** Exchange an authorization code for an access token. Throws on failure. */
export async function exchangeCode(config: TwitchOAuthConfig, code: string): Promise<string> {
  const res = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: config.redirectUri,
    }),
  });
  if (!res.ok) throw new Error(`Twitch token exchange failed: HTTP ${res.status}`);
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

/** Read the authenticated Twitch user with an access token. Throws on failure. */
export async function getTwitchIdentity(
  config: TwitchOAuthConfig,
  accessToken: string,
): Promise<TwitchIdentity> {
  const res = await fetch('https://api.twitch.tv/helix/users', {
    headers: { Authorization: `Bearer ${accessToken}`, 'Client-Id': config.clientId },
  });
  if (!res.ok) throw new Error(`Twitch /users failed: HTTP ${res.status}`);
  const json = (await res.json()) as {
    data?: { id: string; login: string; display_name: string; profile_image_url: string }[];
  };
  const u = json.data?.[0];
  if (!u) throw new Error('Twitch returned no user');
  return { id: u.id, login: u.login, displayName: u.display_name, avatarUrl: u.profile_image_url };
}
