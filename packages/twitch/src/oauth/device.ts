/**
 * Twitch Device Code Grant (docs/ARCHITECTURE.md §5.1) — the flow the desktop
 * app uses because it has no client secret. The user enters a short code at
 * twitch.tv/activate; we poll until authorized. `fetch` is injectable.
 */
import type { TwitchTokens } from '../types';
import { TWITCH_SCOPES } from '../scopes';

const ID_BASE = 'https://id.twitch.tv/oauth2';

export interface DeviceCodeResponse {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  expiresIn: number;
  interval: number;
}

export interface DeviceFlowOptions {
  clientId: string;
  fetchImpl?: typeof fetch;
}

/** Start the flow: returns the code the user must enter. */
export async function startDeviceFlow(opts: DeviceFlowOptions): Promise<DeviceCodeResponse> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const res = await fetchImpl(`${ID_BASE}/device`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: opts.clientId, scopes: TWITCH_SCOPES.join(' ') }),
  });
  if (!res.ok) throw new Error(`device flow start failed: HTTP ${res.status}`);
  const json = (await res.json()) as {
    device_code: string;
    user_code: string;
    verification_uri: string;
    expires_in: number;
    interval: number;
  };
  return {
    deviceCode: json.device_code,
    userCode: json.user_code,
    verificationUri: json.verification_uri,
    expiresIn: json.expires_in,
    interval: json.interval,
  };
}

export type PollOutcome =
  | { status: 'authorized'; tokens: TwitchTokens }
  | { status: 'pending' }
  | { status: 'expired' }
  | { status: 'error'; detail: string };

/** Poll once for the token. Callers loop on `pending` respecting `interval`. */
export async function pollDeviceToken(
  opts: DeviceFlowOptions & { deviceCode: string },
): Promise<PollOutcome> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const res = await fetchImpl(`${ID_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: opts.clientId,
      device_code: opts.deviceCode,
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
    }),
  });

  if (res.ok) {
    const json = (await res.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      scope?: string[];
    };
    return {
      status: 'authorized',
      tokens: {
        accessToken: json.access_token,
        refreshToken: json.refresh_token,
        expiresAt: Date.now() + json.expires_in * 1000,
        scopes: json.scope ?? [...TWITCH_SCOPES],
      },
    };
  }

  const body = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
  const message = (body.message ?? body.error ?? '').toLowerCase();
  if (message.includes('authorization_pending') || message.includes('pending')) {
    return { status: 'pending' };
  }
  if (message.includes('expired')) return { status: 'expired' };
  return { status: 'error', detail: body.message ?? `HTTP ${res.status}` };
}
