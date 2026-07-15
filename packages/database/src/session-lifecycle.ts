/**
 * Pure session-lifecycle logic (docs/DATABASE.md §4). No I/O — the REST client
 * and the desktop runtime call these to decide what to write and delete, so the
 * cleanup rules are testable in isolation.
 */
import type { LifetimeStats, SessionCounters, SessionStatus, SessionSummary } from './schema';
import { EMPTY_COUNTERS } from './schema';

/** A session heartbeat older than this is considered a crashed/abandoned session. */
export const STALE_HEARTBEAT_MS = 2 * 60 * 1000;

/** Build the compact summary written to channels/{uid}/lastSession at stream end. */
export function finalizeSession(
  startedAt: number,
  counters: SessionCounters,
  now: number = Date.now(),
): SessionSummary {
  return { startedAt, endedAt: now, counters: { ...counters } };
}

/** Merge a finished session's counters into the lifetime aggregates. */
export function mergeLifetime(
  lifetime: LifetimeStats | null,
  counters: SessionCounters,
  now: number = Date.now(),
): LifetimeStats {
  const base: LifetimeStats = lifetime ?? {
    messagesAnalyzed: 0,
    actionsTaken: 0,
    aiCalls: 0,
    sessions: 0,
    firstSessionAt: now,
  };
  const actions = counters.deleted + counters.timeouts + counters.bans + counters.warningsIssued;
  return {
    messagesAnalyzed: base.messagesAnalyzed + counters.messages,
    actionsTaken: base.actionsTaken + actions,
    aiCalls: base.aiCalls + counters.aiCalls,
    sessions: base.sessions + 1,
    firstSessionAt: base.firstSessionAt || now,
  };
}

/** Is a leftover session stale (crash) and safe to finalize on next startup? */
export function isStaleSession(
  status: Pick<SessionStatus, 'lastHeartbeat'>,
  now: number = Date.now(),
  thresholdMs: number = STALE_HEARTBEAT_MS,
): boolean {
  return now - status.lastHeartbeat > thresholdMs;
}

/**
 * A warning strike reaches the final action when it hits maxStrikes; at that
 * point the temporary warning record is deleted (docs/DATABASE.md §4.1).
 */
export function reachedFinalAction(count: number, maxStrikes: number): boolean {
  return count >= maxStrikes;
}

/** Trim a ring buffer of pushed entries to the newest `keep`, returning the ids to delete. */
export function idsToTrim(entries: { id: string; t: number }[], keep: number): string[] {
  if (entries.length <= keep) return [];
  return [...entries]
    .sort((a, b) => a.t - b.t)
    .slice(0, entries.length - keep)
    .map((e) => e.id);
}

export { EMPTY_COUNTERS };
