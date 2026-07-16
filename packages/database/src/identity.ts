/**
 * Firebase Identity token client for non-browser clients (the desktop bot).
 * Exchanges a custom token minted by the web server for a Firebase ID token via
 * the public REST endpoints, and refreshes it before expiry. Framework-free;
 * `fetch` and the clock are injectable for tests. See docs/ARCHITECTURE.md §4.
 */

export interface IdSession {
  idToken: string;
  refreshToken: string;
  /** Unix epoch ms when the ID token expires. */
  expiresAt: number;
}

interface SignInResponse {
  idToken: string;
  refreshToken: string;
  expiresIn: string;
}

interface RefreshResponse {
  id_token: string;
  refresh_token: string;
  expires_in: string;
}

export interface IdentityOptions {
  apiKey: string;
  fetchImpl?: typeof fetch;
  now?: () => number;
}

export class IdentityToolkit {
  private readonly apiKey: string;
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => number;

  constructor(opts: IdentityOptions) {
    this.apiKey = opts.apiKey;
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.now = opts.now ?? Date.now;
  }

  /** Exchange a Firebase custom token for an ID token + refresh token. */
  async signInWithCustomToken(customToken: string): Promise<IdSession> {
    const res = await this.fetchImpl(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: customToken, returnSecureToken: true }),
      },
    );
    if (!res.ok) throw new Error(`signInWithCustomToken → HTTP ${res.status}`);
    const j = (await res.json()) as SignInResponse;
    return {
      idToken: j.idToken,
      refreshToken: j.refreshToken,
      expiresAt: this.now() + Number(j.expiresIn) * 1000,
    };
  }

  /** Exchange a refresh token for a fresh ID token. */
  async refresh(refreshToken: string): Promise<IdSession> {
    const res = await this.fetchImpl(
      `https://securetoken.googleapis.com/v1/token?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`,
      },
    );
    if (!res.ok) throw new Error(`token refresh → HTTP ${res.status}`);
    const j = (await res.json()) as RefreshResponse;
    return {
      idToken: j.id_token,
      refreshToken: j.refresh_token,
      expiresAt: this.now() + Number(j.expires_in) * 1000,
    };
  }
}

/** Refresh window: renew the ID token this long before it actually expires. */
const REFRESH_SKEW_MS = 5 * 60 * 1000;

/**
 * Holds the current ID session and refreshes it on demand. `getIdToken` is the
 * exact shape RestClient wants, so a manager can back the bot's REST client.
 */
export class TokenManager {
  private session: IdSession | null = null;

  constructor(
    private readonly kit: IdentityToolkit,
    private readonly now: () => number = Date.now,
  ) {}

  async start(customToken: string): Promise<void> {
    this.session = await this.kit.signInWithCustomToken(customToken);
  }

  get signedIn(): boolean {
    return this.session !== null;
  }

  async getIdToken(): Promise<string> {
    if (!this.session) throw new Error('TokenManager: not signed in');
    if (this.now() > this.session.expiresAt - REFRESH_SKEW_MS) {
      this.session = await this.kit.refresh(this.session.refreshToken);
    }
    return this.session.idToken;
  }
}
