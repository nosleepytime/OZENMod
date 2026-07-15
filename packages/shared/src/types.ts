/**
 * Core domain types shared across the website, the desktop app and the
 * moderation engine. Kept framework-free on purpose — see docs/ARCHITECTURE.md.
 */

/** Everything the engine can decide about a message. */
export type ModerationAction =
  'allow' | 'ignore' | 'delete' | 'warn' | 'timeout' | 'ban' | 'review';

/** Content categories the pipeline scores. */
export type Category =
  | 'harassment'
  | 'hate'
  | 'threat'
  | 'sexual'
  | 'spam'
  | 'flood'
  | 'scam'
  | 'advertising'
  | 'evasion'
  | 'toxicity'
  | 'none';

/** Where a decision came from. */
export type DecisionSource = 'local' | 'ai' | 'manual';

/** One moderation event as shown in feeds, logs and the dashboard. */
export interface ModerationEvent {
  id: string;
  /** Unix epoch milliseconds. */
  at: number;
  userLogin: string;
  userDisplay: string;
  category: Category;
  categoryLabel: string;
  action: ModerationAction;
  actionLabel: string;
  source: DecisionSource;
  /** Human-readable English explanation — mandatory for every event. */
  reason: string;
  /** Ladder position when relevant, e.g. "2/3". */
  strike?: string;
}

/** An item waiting for a human decision. */
export interface ReviewItem {
  id: string;
  at: number;
  userLogin: string;
  snippet: string;
  note: string;
  confidence: number;
}

/** Sensitivity presets for the local scoring stage. */
export type Sensitivity = 'lenient' | 'balanced' | 'strict';

/** AI Assistant — structured intent parsed from a plain-English command. */
export interface CommandIntent {
  action:
    | 'ban'
    | 'unban'
    | 'timeout'
    | 'untimeout'
    | 'warn'
    | 'unwarn'
    | 'clear_strikes'
    | 'delete_messages'
    | 'purge_user'
    | 'approve_review'
    | 'remove_review'
    | 'add_banned_term'
    | 'remove_banned_term'
    | 'add_trusted_domain'
    | 'remove_trusted_domain'
    | 'set_link_policy'
    | 'set_sensitivity'
    | 'toggle_category'
    | 'set_ai_budget'
    | 'exempt_user'
    | 'unexempt_user'
    | 'query_user'
    | 'query_stats'
    | 'query_actions'
    | 'undo_last'
    | 'unknown';
  target?: string;
  durationSeconds?: number;
  reason?: string;
  args?: Record<string, string>;
  needsConfirmation: boolean;
  confidence: number;
  reply: string;
}
