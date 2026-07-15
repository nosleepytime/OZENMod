import { describe, it, expect } from 'vitest';
import { RateLimiter } from './rate-limiter';
import { Backoff } from '../backoff';

describe('RateLimiter', () => {
  it('allows a burst up to capacity then blocks', () => {
    let t = 0;
    const rl = new RateLimiter({ capacity: 3, refillPerSecond: 1, now: () => t });
    expect(rl.tryRemove()).toBe(true);
    expect(rl.tryRemove()).toBe(true);
    expect(rl.tryRemove()).toBe(true);
    expect(rl.tryRemove()).toBe(false);
  });

  it('refills over time', () => {
    let t = 0;
    const rl = new RateLimiter({ capacity: 2, refillPerSecond: 2, now: () => t });
    rl.tryRemove();
    rl.tryRemove();
    expect(rl.tryRemove()).toBe(false);
    t = 500; // 0.5s * 2/s = 1 token
    expect(rl.tryRemove()).toBe(true);
  });

  it('reports time until the next token', () => {
    let t = 0;
    const rl = new RateLimiter({ capacity: 1, refillPerSecond: 1, now: () => t });
    rl.tryRemove();
    expect(rl.msUntilAvailable()).toBe(1000);
    t = 250;
    expect(rl.msUntilAvailable()).toBe(750);
  });
});

describe('Backoff', () => {
  it('grows exponentially and caps at maxMs', () => {
    const b = new Backoff({ baseMs: 1000, factor: 2, maxMs: 8000, jitter: () => 1 });
    expect(b.next()).toBe(1000);
    expect(b.next()).toBe(2000);
    expect(b.next()).toBe(4000);
    expect(b.next()).toBe(8000);
    expect(b.next()).toBe(8000); // capped
  });

  it('applies jitter and resets', () => {
    const b = new Backoff({ baseMs: 1000, factor: 2, jitter: () => 0.5 });
    expect(b.next()).toBe(500);
    b.reset();
    expect(b.next()).toBe(500);
  });
});
