/**
 * Desktop → web token exchange. The desktop bot has no server secret, so it
 * cannot mint a Firebase token itself. It sends its Twitch access token to the
 * deployed web app's /api/auth/desktop endpoint, which verifies the Twitch
 * identity and returns a Firebase custom token plus the public Firebase config
 * needed to sign in and write. Framework-free; `fetch` is injectable.
 */

export interface DesktopProfile {
  twitchUserId: string;
  login: string;
  displayName: string;
  avatarUrl: string;
}

export interface DesktopAuth {
  /** Firebase custom token to exchange for an ID token (see IdentityToolkit). */
  customToken: string;
  /** Public Firebase Web API key. */
  apiKey: string;
  /** RTDB URL, e.g. https://project-default-rtdb.firebaseio.com. */
  databaseURL: string;
  profile: DesktopProfile;
}

export interface ExchangeOptions {
  /** Base URL of the deployed OZENMod web app, no trailing slash required. */
  webUrl: string;
  /** The Twitch user access token stored by the desktop app. */
  accessToken: string;
  fetchImpl?: typeof fetch;
}

export async function exchangeDesktopToken(opts: ExchangeOptions): Promise<DesktopAuth> {
  const f = opts.fetchImpl ?? fetch;
  const res = await f(`${opts.webUrl.replace(/\/$/, '')}/api/auth/desktop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken: opts.accessToken }),
  });
  if (!res.ok) throw new Error(`desktop auth exchange → HTTP ${res.status}`);
  return (await res.json()) as DesktopAuth;
}
