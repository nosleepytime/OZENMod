/**
 * S6 — Decision engine. Maps a category signal + channel policy + user session
 * state to a final, explainable action: severity bypass, the warning ladder,
 * simple deletes and human review. Pure: returns the decision and the user's
 * next strike count without mutating anything. See docs/MODERATION.md §3 (S6).
 */
import type { ChannelConfig } from '@ozenmod/database';
import type { Category } from '@ozenmod/shared';
import type { Decision, Signal, UserSession } from './types';
import { categoryLabel, formatDuration } from './labels';

/** Below this confidence, a non-severe signal goes to review instead of action. */
const REVIEW_CONFIDENCE = 0.6;
/** Severity-3 timeout length (24h) for non-ban severe categories. */
const SEVERE_TIMEOUT = 86_400;

/** Categories that progress through the warning ladder rather than plain delete. */
const LADDERED: Category[] = [
  'harassment',
  'hate',
  'threat',
  'sexual',
  'scam',
  'toxicity',
  'evasion',
];

export interface DecisionResult {
  decision: Decision;
  nextStrikes: number;
}

export function decide(
  signal: Signal,
  session: UserSession,
  config: ChannelConfig,
  _now: number,
): DecisionResult {
  if (signal.severity < 3 && signal.confidence < REVIEW_CONFIDENCE) {
    return reviewResult(signal, session);
  }
  if (signal.severity >= 3) {
    return severeResult(signal, session);
  }
  if (!LADDERED.includes(signal.category)) {
    return simpleResult(signal, session);
  }
  return ladderResult(signal, session, config);
}

export function reviewResult(signal: Signal, session: UserSession): DecisionResult {
  return {
    nextStrikes: session.strikes,
    decision: {
      action: 'review',
      actionLabel: 'Needs review',
      category: signal.category,
      categoryLabel: categoryLabel(signal.category),
      severity: signal.severity,
      confidence: signal.confidence,
      reason: `${signal.reason} — confidence ${signal.confidence.toFixed(2)}, queued for human review`,
      source: signal.source,
      enforcement: { type: 'none' },
    },
  };
}

function severeResult(signal: Signal, session: UserSession): DecisionResult {
  const ban = signal.category === 'threat' || signal.category === 'hate';
  const decision: Decision = ban
    ? {
        action: 'ban',
        actionLabel: 'Banned',
        category: signal.category,
        categoryLabel: categoryLabel(signal.category),
        severity: 3,
        confidence: signal.confidence,
        reason: `${signal.reason} (severity 3) — immediate ban`,
        source: signal.source,
        enforcement: { type: 'ban' },
      }
    : {
        action: 'timeout',
        actionLabel: `Deleted + ${formatDuration(SEVERE_TIMEOUT)}`,
        category: signal.category,
        categoryLabel: categoryLabel(signal.category),
        severity: 3,
        confidence: signal.confidence,
        reason: `${signal.reason} (severity 3) — immediate ${formatDuration(SEVERE_TIMEOUT)} timeout`,
        source: signal.source,
        enforcement: { type: 'timeout', seconds: SEVERE_TIMEOUT },
      };
  // A severe action fires immediately; the ladder counter is cleared.
  return { decision, nextStrikes: 0 };
}

function simpleResult(signal: Signal, session: UserSession): DecisionResult {
  if (signal.category === 'flood') {
    return {
      nextStrikes: session.strikes,
      decision: {
        action: 'timeout',
        actionLabel: 'Deleted + 60s',
        category: signal.category,
        categoryLabel: categoryLabel(signal.category),
        severity: signal.severity,
        confidence: signal.confidence,
        reason: signal.reason,
        source: signal.source,
        enforcement: { type: 'timeout', seconds: 60 },
      },
    };
  }
  return {
    nextStrikes: session.strikes,
    decision: {
      action: 'delete',
      actionLabel: 'Deleted',
      category: signal.category,
      categoryLabel: categoryLabel(signal.category),
      severity: signal.severity,
      confidence: signal.confidence,
      reason: signal.reason,
      source: signal.source,
      enforcement: { type: 'delete' },
    },
  };
}

function ladderResult(signal: Signal, session: UserSession, config: ChannelConfig): DecisionResult {
  const max = Math.max(1, config.warnings.maxStrikes);
  const next = session.strikes + 1;

  if (next >= max) {
    const final = config.warnings.finalAction;
    const strike = `${max}/${max}`;
    if (final.action === 'ban') {
      return {
        nextStrikes: 0,
        decision: {
          action: 'ban',
          actionLabel: 'Banned',
          category: signal.category,
          categoryLabel: categoryLabel(signal.category),
          severity: signal.severity,
          confidence: signal.confidence,
          reason: `${signal.reason} — strike ${strike}, banned`,
          source: signal.source,
          strike,
          enforcement: { type: 'ban' },
        },
      };
    }
    const seconds = final.seconds ?? 1800;
    return {
      nextStrikes: 0,
      decision: {
        action: 'timeout',
        actionLabel: `Timeout ${formatDuration(seconds)}`,
        category: signal.category,
        categoryLabel: categoryLabel(signal.category),
        severity: signal.severity,
        confidence: signal.confidence,
        reason: `${signal.reason} — strike ${strike}, ${formatDuration(seconds)} timeout`,
        source: signal.source,
        strike,
        enforcement: { type: 'timeout', seconds },
      },
    };
  }

  const strike = `${next}/${max}`;
  // Escalating-timeouts mode reads the per-step ladder; default is a chat warning.
  if (config.warnings.mode === 'escalating-timeouts') {
    const step = config.warnings.ladder[next - 1];
    if (step && step.action === 'timeout') {
      const seconds = step.seconds ?? 60;
      return {
        nextStrikes: next,
        decision: {
          action: 'timeout',
          actionLabel: `Timeout ${formatDuration(seconds)}`,
          category: signal.category,
          categoryLabel: categoryLabel(signal.category),
          severity: signal.severity,
          confidence: signal.confidence,
          reason: `${signal.reason} — strike ${strike}, ${formatDuration(seconds)} timeout`,
          source: signal.source,
          strike,
          enforcement: { type: 'timeout', seconds },
        },
      };
    }
  }
  return {
    nextStrikes: next,
    decision: {
      action: 'warn',
      actionLabel: `Warning ${strike}`,
      category: signal.category,
      categoryLabel: categoryLabel(signal.category),
      severity: signal.severity,
      confidence: signal.confidence,
      reason: `${signal.reason} — strike ${strike}`,
      source: signal.source,
      strike,
      enforcement: { type: 'warn', text: `warning ${strike}: ${categoryLabel(signal.category)}` },
    },
  };
}
