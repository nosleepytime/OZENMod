/**
 * Exponential backoff with full jitter, used by the IRC and EventSub reconnect
 * loops. Pure and testable (jitter is injectable).
 */
export interface BackoffOptions {
  baseMs?: number;
  maxMs?: number;
  factor?: number;
  /** Returns a value in [0,1); defaults to Math.random. Injectable for tests. */
  jitter?: () => number;
}

export class Backoff {
  private attempt = 0;
  private readonly baseMs: number;
  private readonly maxMs: number;
  private readonly factor: number;
  private readonly jitter: () => number;

  constructor(opts: BackoffOptions = {}) {
    this.baseMs = opts.baseMs ?? 1000;
    this.maxMs = opts.maxMs ?? 30_000;
    this.factor = opts.factor ?? 2;
    this.jitter = opts.jitter ?? Math.random;
  }

  /** Next delay in ms (with full jitter) and advance the attempt counter. */
  next(): number {
    const raw = Math.min(this.maxMs, this.baseMs * this.factor ** this.attempt);
    this.attempt++;
    return Math.floor(raw * this.jitter());
  }

  /** Ceiling for the current attempt without jitter (useful for assertions/UI). */
  ceiling(): number {
    return Math.min(this.maxMs, this.baseMs * this.factor ** this.attempt);
  }

  reset(): void {
    this.attempt = 0;
  }
}
