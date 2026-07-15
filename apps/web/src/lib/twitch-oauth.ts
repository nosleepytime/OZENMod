/**
 * Twitch OAuth helpers for the website's Authorization Code flow.
 *
 * The full exchange (code → tokens → Firebase custom token) is wired in
 * milestone M4. These helpers build the authorize URL and read configuration
 * so the routes can already exist and degrade gracefully when the Twitch app
 * credentials are not set. The client secret is only ever read server-side.
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
