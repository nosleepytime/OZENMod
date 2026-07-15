/**
 * Helix client — the moderation actions the engine performs, plus the small
 * reads the bot needs. All requests are centrally rate-limited (token bucket)
 * and retry once on 429/5xx honoring Retry-After (docs/ARCHITECTURE.md §5.3).
 *
 * `fetch` is injectable so the request-building logic is unit-testable without
 * network. The moderator id defaults to the broadcaster (self-moderation).
 */
import type { HelixAction, TwitchUser } from '../types';
import { RateLimiter } from './rate-limiter';

const HELIX = 'https://api.twitch.tv/helix';

export interface HelixClientOptions {
  clientId: string;
  /** Returns a currently-valid access token (the caller refreshes as needed). */
  getAccessToken: () => Promise<string> | string;
  broadcasterId: string;
  /** Defaults to broadcasterId (the streamer moderates their own channel). */
  moderatorId?: string;
  fetchImpl?: typeof fetch;
  rateLimiter?: RateLimiter;
  /** Sleep function (injectable for tests). */
  sleep?: (ms: number) => Promise<void>;
}

export interface HelixResult {
  ok: boolean;
  status: number;
  /** Present on failure. */
  error?: string;
}

const sleepDefault = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export class HelixClient {
  private readonly clientId: string;
  private readonly getAccessToken: () => Promise<string> | string;
  private readonly broadcasterId: string;
  private readonly moderatorId: string;
  private readonly fetchImpl: typeof fetch;
  private readonly limiter: RateLimiter;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(opts: HelixClientOptions) {
    this.clientId = opts.clientId;
    this.getAccessToken = opts.getAccessToken;
    this.broadcasterId = opts.broadcasterId;
    this.moderatorId = opts.moderatorId ?? opts.broadcasterId;
    this.fetchImpl = opts.fetchImpl ?? fetch;
    // Helix moderation endpoints tolerate bursts; refill conservatively.
    this.limiter = opts.rateLimiter ?? new RateLimiter({ capacity: 20, refillPerSecond: 10 });
    this.sleep = opts.sleep ?? sleepDefault;
  }

  private async headers(): Promise<Record<string, string>> {
    const token = await this.getAccessToken();
    return {
      Authorization: `Bearer ${token}`,
      'Client-Id': this.clientId,
      'Content-Type': 'application/json',
    };
  }

  /** Perform a request with local rate limiting and one Retry-After-aware retry. */
  private async request(method: string, path: string, body?: unknown): Promise<HelixResult> {
    // Respect the local bucket first.
    let wait = this.limiter.msUntilAvailable();
    if (wait > 0) await this.sleep(wait);
    this.limiter.tryRemove();

    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await this.fetchImpl(`${HELIX}${path}`, {
        method,
        headers: await this.headers(),
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      if (res.ok || (res.status >= 200 && res.status < 300)) {
        return { ok: true, status: res.status };
      }
      if ((res.status === 429 || res.status >= 500) && attempt === 0) {
        const retryAfter = Number(res.headers.get('Retry-After'));
        wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 800;
        await this.sleep(wait);
        continue;
      }
      return { ok: false, status: res.status, error: await safeText(res) };
    }
    return { ok: false, status: 0, error: 'exhausted retries' };
  }

  /** Delete a single message. */
  deleteMessage(messageId: string): Promise<HelixResult> {
    const q = `?broadcaster_id=${this.broadcasterId}&moderator_id=${this.moderatorId}&message_id=${encodeURIComponent(messageId)}`;
    return this.request('DELETE', `/moderation/chat${q}`);
  }

  /** Timeout = ban with a duration; ban = ban without a duration. */
  banUser(userId: string, durationSeconds?: number, reason?: string): Promise<HelixResult> {
    const q = `?broadcaster_id=${this.broadcasterId}&moderator_id=${this.moderatorId}`;
    return this.request('POST', `/moderation/bans${q}`, {
      data: {
        user_id: userId,
        ...(durationSeconds ? { duration: durationSeconds } : {}),
        ...(reason ? { reason } : {}),
      },
    });
  }

  removeBan(userId: string): Promise<HelixResult> {
    const q = `?broadcaster_id=${this.broadcasterId}&moderator_id=${this.moderatorId}&user_id=${userId}`;
    return this.request('DELETE', `/moderation/bans${q}`);
  }

  /** Native Twitch warning (optional ladder step). */
  warnUser(userId: string, reason: string): Promise<HelixResult> {
    const q = `?broadcaster_id=${this.broadcasterId}&moderator_id=${this.moderatorId}`;
    return this.request('POST', `/moderation/warnings${q}`, {
      data: { user_id: userId, reason },
    });
  }

  /** Dispatch a HelixAction from the engine to the right endpoint. */
  perform(action: HelixAction): Promise<HelixResult> {
    switch (action.type) {
      case 'delete':
        return this.deleteMessage(action.messageId);
      case 'timeout':
        return this.banUser(action.userId, action.durationSeconds, action.reason);
      case 'ban':
        return this.banUser(action.userId, undefined, action.reason);
      case 'unban':
        return this.removeBan(action.userId);
      case 'warn':
        return this.warnUser(action.userId, action.reason);
    }
  }

  /** Create an EventSub subscription (WebSocket transport). */
  subscribeEventSub(body: Record<string, unknown>): Promise<HelixResult> {
    return this.request('POST', '/eventsub/subscriptions', body);
  }

  /** Resolve users by login (used to map a command target to a user id). */
  async getUsersByLogin(logins: string[]): Promise<TwitchUser[]> {
    if (logins.length === 0) return [];
    const q = logins.map((l) => `login=${encodeURIComponent(l)}`).join('&');
    let wait = this.limiter.msUntilAvailable();
    if (wait > 0) await this.sleep(wait);
    this.limiter.tryRemove();
    const res = await this.fetchImpl(`${HELIX}/users?${q}`, { headers: await this.headers() });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      data?: { id: string; login: string; display_name: string; profile_image_url: string }[];
    };
    return (json.data ?? []).map((u) => ({
      id: u.id,
      login: u.login,
      displayName: u.display_name,
      avatarUrl: u.profile_image_url,
    }));
  }
}

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 300);
  } catch {
    return `HTTP ${res.status}`;
  }
}
