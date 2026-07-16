/**
 * SessionWriter — the bot's write path into RTDB. Writes the temporary session
 * node (status, counters, recent events, review queue, warnings) and, at stream
 * end, finalizes the permanent summary + lifetime aggregates and deletes the
 * whole session node. Depends only on a minimal RTDB interface so it is trivially
 * testable. See docs/DATABASE.md §2 and §4.
 */
import { paths } from './paths';
import type {
  LifetimeStats,
  RecentEvent,
  ReviewEntry,
  SessionCounters,
  SessionStatus,
  WarningRecord,
} from './schema';
import { finalizeSession, mergeLifetime } from './session-lifecycle';

/** The subset of RestClient the writer needs (so a fake can be passed in tests). */
export interface RtdbLike {
  get<T>(path: string): Promise<T | null>;
  set(path: string, value: unknown): Promise<void>;
  update(path: string, value: Record<string, unknown>): Promise<void>;
  push(path: string, value: unknown): Promise<string>;
  remove(path: string): Promise<void>;
}

export class SessionWriter {
  constructor(
    private readonly rest: RtdbLike,
    private readonly uid: string,
  ) {}

  /** Write the session status at start. */
  begin(status: SessionStatus): Promise<void> {
    return this.rest.set(paths.status(this.uid), status);
  }

  /** Refresh the heartbeat (and keep online true). */
  heartbeat(lastHeartbeat: number): Promise<void> {
    return this.rest.update(paths.status(this.uid), { lastHeartbeat, online: true });
  }

  /** Flush the current counters (debounced by the caller). */
  counters(counters: SessionCounters): Promise<void> {
    return this.rest.set(paths.counters(this.uid), counters);
  }

  /** Append a moderation event to the rolling recent list. */
  event(entry: RecentEvent): Promise<string> {
    return this.rest.push(paths.recent(this.uid), entry);
  }

  /** Append an item to the human-review queue. */
  review(entry: ReviewEntry): Promise<string> {
    return this.rest.push(paths.review(this.uid), entry);
  }

  /** Set a user's temporary warning record. */
  setWarning(twitchUserId: string, record: WarningRecord): Promise<void> {
    return this.rest.set(paths.warning(this.uid, twitchUserId), record);
  }

  /** Delete a warning record (called the moment the final action fires). */
  clearWarning(twitchUserId: string): Promise<void> {
    return this.rest.remove(paths.warning(this.uid, twitchUserId));
  }

  /** Trim recent-event push ids beyond the newest `keep`. */
  async trimRecent(ids: string[]): Promise<void> {
    await Promise.all(ids.map((id) => this.rest.remove(`${paths.recent(this.uid)}/${id}`)));
  }

  /**
   * Finalize the session at stream end: write the compact summary, merge the
   * lifetime aggregates, and delete the entire temporary session node.
   */
  async finalize(
    startedAt: number,
    counters: SessionCounters,
    now: number = Date.now(),
  ): Promise<void> {
    await this.rest.set(paths.lastSession(this.uid), finalizeSession(startedAt, counters, now));
    const lifetime = await this.rest.get<LifetimeStats>(paths.lifetime(this.uid));
    await this.rest.set(paths.lifetime(this.uid), mergeLifetime(lifetime, counters, now));
    await this.rest.remove(paths.session(this.uid));
  }
}
