import { describe, it, expect } from 'vitest';
import {
  finalizeSession,
  mergeLifetime,
  isStaleSession,
  reachedFinalAction,
  idsToTrim,
  STALE_HEARTBEAT_MS,
} from './session-lifecycle';
import type { SessionCounters } from './schema';

const counters: SessionCounters = {
  messages: 1000,
  deleted: 10,
  timeouts: 5,
  bans: 1,
  warningsIssued: 8,
  aiCalls: 20,
  reviewed: 3,
};

describe('finalizeSession', () => {
  it('produces a compact summary with copied counters', () => {
    const s = finalizeSession(100, counters, 5000);
    expect(s.startedAt).toBe(100);
    expect(s.endedAt).toBe(5000);
    expect(s.counters).toEqual(counters);
    expect(s.counters).not.toBe(counters); // copy
  });
});

describe('mergeLifetime', () => {
  it('accumulates counters and increments the session count', () => {
    const merged = mergeLifetime(null, counters, 42);
    expect(merged.messagesAnalyzed).toBe(1000);
    expect(merged.actionsTaken).toBe(10 + 5 + 1 + 8);
    expect(merged.aiCalls).toBe(20);
    expect(merged.sessions).toBe(1);
    expect(merged.firstSessionAt).toBe(42);
  });

  it('adds onto an existing lifetime and keeps the first-session timestamp', () => {
    const prev = {
      messagesAnalyzed: 500,
      actionsTaken: 10,
      aiCalls: 5,
      sessions: 2,
      firstSessionAt: 7,
    };
    const merged = mergeLifetime(prev, counters, 999);
    expect(merged.messagesAnalyzed).toBe(1500);
    expect(merged.sessions).toBe(3);
    expect(merged.firstSessionAt).toBe(7);
  });
});

describe('isStaleSession', () => {
  it('flags a session whose heartbeat is older than the threshold', () => {
    const now = 1_000_000;
    expect(isStaleSession({ lastHeartbeat: now - STALE_HEARTBEAT_MS - 1 }, now)).toBe(true);
    expect(isStaleSession({ lastHeartbeat: now - 1000 }, now)).toBe(false);
  });
});

describe('reachedFinalAction', () => {
  it('is true at or beyond maxStrikes', () => {
    expect(reachedFinalAction(3, 3)).toBe(true);
    expect(reachedFinalAction(2, 3)).toBe(false);
  });
});

describe('idsToTrim', () => {
  it('keeps the newest N and returns the oldest ids to delete', () => {
    const entries = [
      { id: 'a', t: 1 },
      { id: 'b', t: 2 },
      { id: 'c', t: 3 },
      { id: 'd', t: 4 },
    ];
    expect(idsToTrim(entries, 2).sort()).toEqual(['a', 'b']);
    expect(idsToTrim(entries, 4)).toEqual([]);
    expect(idsToTrim(entries, 10)).toEqual([]);
  });
});
