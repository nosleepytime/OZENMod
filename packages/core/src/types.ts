/**
 * Public types for the moderation engine. Framework-free; the desktop runtime
 * and (later) a hosted worker both drive the same engine.
 */
import type { Category, ModerationAction } from '@ozenmod/shared';

export type Severity = 0 | 1 | 2 | 3;

/** Roles derived from Twitch badges, most privileged first. */
export type ChatRole = 'broadcaster' | 'moderator' | 'vip' | 'subscriber' | 'regular' | 'viewer';

/** One chat message handed to the engine (already parsed from IRC). */
export interface IncomingMessage {
  id: string;
  login: string;
  displayName: string;
  text: string;
  /** Unix epoch milliseconds. */
  timestamp: number;
  roles: ChatRole[];
  /** Number of emotes (counted for spam, excluded from text analysis). */
  emoteCount: number;
  /** @-mentioned logins, lower-cased. */
  mentions: string[];
}

/** Per-user, per-session state. Temporary — cleared when the stream ends. */
export interface UserSession {
  login: string;
  strikes: number;
  firstSeenAt: number;
  lastActionAt: number | null;
  /** Recent message timestamps (ms), for flood detection. */
  messageTimestamps: number[];
  /** Recent normalized message texts, for duplicate detection. */
  recentNormalized: string[];
  /** True once the user has sent at least one message this session. */
  seen: boolean;
}

/** A category signal produced by S2 (deterministic) or S3 (heuristic) or S5 (AI). */
export interface Signal {
  category: Category;
  severity: Severity;
  /** 0..1 — how sure we are this is the right category/severity. */
  confidence: number;
  /** English clause describing what was detected (no action verb). */
  reason: string;
  source: 'local' | 'ai';
}

/** The Twitch enforcement to carry out for a decision. */
export type Enforcement =
  | { type: 'none' }
  | { type: 'delete' }
  | { type: 'warn'; text: string }
  | { type: 'timeout'; seconds: number }
  | { type: 'ban' };

/** The engine's explainable output for one message. */
export interface Decision {
  action: ModerationAction;
  actionLabel: string;
  category: Category;
  categoryLabel: string;
  severity: Severity;
  confidence: number;
  /** Full English explanation, always present. */
  reason: string;
  source: 'local' | 'ai' | 'manual';
  /** Ladder position when relevant, e.g. "2/3". */
  strike?: string;
  enforcement: Enforcement;
}

/** Result of local analysis (S0–S4) for one message. */
export interface Analysis {
  /** Decision to use directly (when !escalateToAI) or as the AI fallback. */
  decision: Decision;
  /** True when the message is ambiguous and should be sent to the AI. */
  escalateToAI: boolean;
  /** The signal that would be judged by the AI, for the request context. */
  signal: Signal;
  /** Per-category scores, for diagnostics. */
  scores: Partial<Record<Category, number>>;
  aggregate: number;
}
