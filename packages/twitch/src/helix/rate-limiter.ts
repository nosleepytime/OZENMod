/**
 * Token-bucket rate limiter for the Helix client. Twitch allows bursts up to a
 * bucket size that refills at a steady rate; this enforces it locally so we stay
 * under the limit instead of relying on 429s. Time is injectable for tests.
 */
export interface RateLimiterOptions {
  /** Maximum tokens (burst size). */
  capacity: number;
  /** Tokens added per second. */
  refillPerSecond: number;
  now?: () => number;
}

export class RateLimiter {
  private tokens: number;
  private readonly capacity: number;
  private readonly refillPerSecond: number;
  private readonly now: () => number;
  private lastRefill: number;

  constructor(opts: RateLimiterOptions) {
    this.capacity = opts.capacity;
    this.refillPerSecond = opts.refillPerSecond;
    this.now = opts.now ?? Date.now;
    this.tokens = opts.capacity;
    this.lastRefill = this.now();
  }

  private refill(): void {
    const t = this.now();
    const elapsedSec = (t - this.lastRefill) / 1000;
    if (elapsedSec <= 0) return;
    this.tokens = Math.min(this.capacity, this.tokens + elapsedSec * this.refillPerSecond);
    this.lastRefill = t;
  }

  /** Try to consume one token immediately. Returns true if allowed. */
  tryRemove(): boolean {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }

  /** Milliseconds until at least one token is available (0 if available now). */
  msUntilAvailable(): number {
    this.refill();
    if (this.tokens >= 1) return 0;
    const needed = 1 - this.tokens;
    return Math.ceil((needed / this.refillPerSecond) * 1000);
  }

  get available(): number {
    this.refill();
    return Math.floor(this.tokens);
  }
}
