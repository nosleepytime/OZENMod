import { describe, it, expect } from 'vitest';
import { SessionWriter, type RtdbLike } from './session-writer';
import { EMPTY_COUNTERS } from './schema';
import type { LifetimeStats } from './schema';

interface Call {
  op: string;
  path: string;
  value?: unknown;
}

function fakeRest(seed: Record<string, unknown> = {}): { rest: RtdbLike; calls: Call[] } {
  const calls: Call[] = [];
  const store: Record<string, unknown> = { ...seed };
  const rest: RtdbLike = {
    async get<T>(path: string) {
      calls.push({ op: 'get', path });
      return (store[path] ?? null) as T | null;
    },
    async set(path, value) {
      calls.push({ op: 'set', path, value });
      store[path] = value;
    },
    async update(path, value) {
      calls.push({ op: 'update', path, value });
    },
    async push(path, value) {
      calls.push({ op: 'push', path, value });
      return 'pushid';
    },
    async remove(path) {
      calls.push({ op: 'remove', path });
    },
  };
  return { rest, calls };
}

const UID = 'twitch:42';

describe('SessionWriter', () => {
  it('writes to the session-scoped paths', async () => {
    const { rest, calls } = fakeRest();
    const w = new SessionWriter(rest, UID);
    await w.event({
      t: 1,
      user: 'bob',
      action: 'warn',
      category: 'harassment',
      reason: 'x',
      source: 'local',
    });
    await w.setWarning('99', { count: 1, lastAt: 1, lastCategory: 'harassment' });
    expect(calls[0]).toMatchObject({ op: 'push', path: `sessions/${UID}/recent` });
    expect(calls[1]).toMatchObject({ op: 'set', path: `sessions/${UID}/warnings/99` });
  });

  it('finalizes: summary + merged lifetime, then deletes the session node', async () => {
    const lifetime: LifetimeStats = {
      messagesAnalyzed: 100,
      actionsTaken: 5,
      aiCalls: 2,
      sessions: 3,
      firstSessionAt: 10,
    };
    const { rest, calls } = fakeRest({ [`channels/${UID}/stats/lifetime`]: lifetime });
    const w = new SessionWriter(rest, UID);
    const counters = { ...EMPTY_COUNTERS, messages: 50, deleted: 4, timeouts: 1, aiCalls: 1 };

    await w.finalize(1000, counters, 5000);

    const ops = calls.map((c) => `${c.op} ${c.path}`);
    expect(ops).toContain(`set channels/${UID}/lastSession`);
    expect(ops).toContain(`get channels/${UID}/stats/lifetime`);
    expect(ops).toContain(`set channels/${UID}/stats/lifetime`);
    expect(ops).toContain(`remove sessions/${UID}`);

    const merged = calls.find((c) => c.op === 'set' && c.path === `channels/${UID}/stats/lifetime`)!
      .value as LifetimeStats;
    expect(merged.messagesAnalyzed).toBe(150);
    expect(merged.sessions).toBe(4);
    // The session node is deleted last (cleanup).
    expect(ops[ops.length - 1]).toBe(`remove sessions/${UID}`);
  });
});
