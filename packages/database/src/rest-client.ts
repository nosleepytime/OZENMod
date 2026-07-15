/**
 * RTDB REST client used by the bot (docs/DATABASE.md §1). The bot uses REST — not
 * a persistent socket — so it never consumes a realtime connection; only open
 * dashboards do. Config is polled with ETag so unchanged reads transfer ~nothing.
 *
 * Auth: the Firebase custom-token → ID-token is passed as `access_token`. `fetch`
 * is injectable for tests.
 */
export interface RestClientOptions {
  /** e.g. https://your-db.firebaseio.com (no trailing slash). */
  databaseUrl: string;
  /** Returns a currently-valid Firebase ID token (caller refreshes it). */
  getIdToken: () => Promise<string> | string;
  fetchImpl?: typeof fetch;
}

export interface ConfigPollResult<T> {
  /** null when the server returned 304 Not Modified. */
  value: T | null;
  etag: string | null;
  notModified: boolean;
}

export class RestClient {
  private readonly databaseUrl: string;
  private readonly getIdToken: () => Promise<string> | string;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: RestClientOptions) {
    this.databaseUrl = opts.databaseUrl.replace(/\/$/, '');
    this.getIdToken = opts.getIdToken;
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  private async url(path: string): Promise<string> {
    const token = await this.getIdToken();
    return `${this.databaseUrl}/${path}.json?auth=${encodeURIComponent(token)}`;
  }

  /** Read a node. Returns null if it doesn't exist. */
  async get<T>(path: string): Promise<T | null> {
    const res = await this.fetchImpl(await this.url(path));
    if (!res.ok) throw new Error(`RTDB GET ${path} → HTTP ${res.status}`);
    return (await res.json()) as T | null;
  }

  /** Overwrite a node (PUT). */
  async set(path: string, value: unknown): Promise<void> {
    const res = await this.fetchImpl(await this.url(path), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(value),
    });
    if (!res.ok) throw new Error(`RTDB PUT ${path} → HTTP ${res.status}`);
  }

  /** Shallow-merge fields into a node (PATCH) — the debounced counter/heartbeat flush. */
  async update(path: string, value: Record<string, unknown>): Promise<void> {
    const res = await this.fetchImpl(await this.url(path), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(value),
    });
    if (!res.ok) throw new Error(`RTDB PATCH ${path} → HTTP ${res.status}`);
  }

  /** Append to a list (POST) and return the generated push id. */
  async push(path: string, value: unknown): Promise<string> {
    const res = await this.fetchImpl(await this.url(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(value),
    });
    if (!res.ok) throw new Error(`RTDB POST ${path} → HTTP ${res.status}`);
    const json = (await res.json()) as { name: string };
    return json.name;
  }

  /** Delete a node. */
  async remove(path: string): Promise<void> {
    const res = await this.fetchImpl(await this.url(path), { method: 'DELETE' });
    if (!res.ok) throw new Error(`RTDB DELETE ${path} → HTTP ${res.status}`);
  }

  /**
   * Poll a node with an ETag. Pass the previous etag; a 304 returns
   * { notModified: true } with near-zero transfer.
   */
  async pollWithEtag<T>(path: string, previousEtag: string | null): Promise<ConfigPollResult<T>> {
    const headers: Record<string, string> = { 'X-Firebase-ETag': 'true' };
    if (previousEtag) headers['if-none-match'] = previousEtag;
    const res = await this.fetchImpl(await this.url(path), { headers });
    if (res.status === 304) return { value: null, etag: previousEtag, notModified: true };
    if (!res.ok) throw new Error(`RTDB poll ${path} → HTTP ${res.status}`);
    const etag = res.headers.get('ETag');
    const value = (await res.json()) as T | null;
    return { value, etag, notModified: false };
  }
}
