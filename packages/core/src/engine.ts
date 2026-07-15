/**
 * The moderation engine — orchestrates S0–S6 over per-user session state.
 *
 * `analyze()` is local-first and self-contained: it normalizes, runs the
 * deterministic rules, scores, and applies the ambiguity gate, committing a
 * final explainable decision. Messages in the ambiguity band are resolved with
 * the configured local fallback and flagged `escalateToAI` so a provider can be
 * consulted before commit in a later milestone (S5). `judgeWithVerdict()` maps a
 * provider verdict through the same decision engine.
 */
import type { ChannelConfig } from '@ozenmod/database';
import type { Category } from '@ozenmod/shared';
import type { AIVerdict } from '@ozenmod/ai';
import type { Analysis, Decision, IncomingMessage, Severity, Signal, UserSession } from './types';
import { normalize } from './normalize';
import { deterministic } from './rules';
import { scoreText } from './scoring';
import { gate } from './gate';
import { decide, reviewResult, type DecisionResult } from './decision';
import { categoryLabel } from './labels';

const HIGH_RISK: Category[] = ['hate', 'threat', 'sexual', 'scam', 'harassment'];
const MAX_TIMESTAMPS = 30;
const MAX_RECENT_TEXTS = 6;

function newSession(login: string, now: number): UserSession {
  return {
    login,
    strikes: 0,
    firstSeenAt: now,
    lastActionAt: null,
    messageTimestamps: [],
    recentNormalized: [],
    seen: false,
  };
}

function isExempt(msg: IncomingMessage, config: ChannelConfig): boolean {
  if (msg.roles.includes('broadcaster')) return true;
  const ex = config.moderation.exemptions;
  if (ex.moderators && msg.roles.includes('moderator')) return true;
  if (ex.vips && msg.roles.includes('vip')) return true;
  if (ex.subscribers && msg.roles.includes('subscriber')) return true;
  if (ex.regulars && msg.roles.includes('regular')) return true;
  return false;
}

function describe(category: Category, evidence: string | undefined, targeted: boolean): string {
  const ev = evidence ? ` ("${evidence}")` : '';
  switch (category) {
    case 'harassment':
      return `${targeted ? 'Targeted harassment' : 'Insulting language'}${ev}`;
    case 'hate':
      return `Hate/discriminatory language${ev}`;
    case 'threat':
      return `Threatening language${ev}`;
    case 'sexual':
      return `Sexual content${ev}`;
    case 'scam':
      return `Possible scam${ev}`;
    case 'advertising':
      return `Unsolicited self-promotion${ev}`;
    case 'toxicity':
      return `Toxic language${ev}`;
    default:
      return `${categoryLabel(category)}${ev}`;
  }
}

function allowDecision(reason: string): Decision {
  return {
    action: 'allow',
    actionLabel: 'Allowed',
    category: 'none',
    categoryLabel: 'Clean',
    severity: 0,
    confidence: 1,
    reason,
    source: 'local',
    enforcement: { type: 'none' },
  };
}

function ignoreDecision(sinceMs: number): Decision {
  return {
    action: 'ignore',
    actionLabel: 'Ignored',
    category: 'none',
    categoryLabel: 'Clean',
    severity: 0,
    confidence: 1,
    reason: `Duplicate of an event already actioned ${Math.round(sinceMs / 1000)}s ago`,
    source: 'local',
    enforcement: { type: 'none' },
  };
}

function verdictSignal(verdict: AIVerdict): Signal {
  return {
    category: verdict.category,
    severity: verdict.severity,
    confidence: verdict.confidence,
    reason: verdict.reason,
    source: 'ai',
  };
}

export class ModerationEngine {
  private sessions = new Map<string, UserSession>();
  private cfg: ChannelConfig;

  constructor(config: ChannelConfig) {
    this.cfg = config;
  }

  get config(): ChannelConfig {
    return this.cfg;
  }

  setConfig(config: ChannelConfig): void {
    this.cfg = config;
  }

  /** Clears all per-user session state (called when the stream ends). */
  reset(): void {
    this.sessions.clear();
  }

  getSession(login: string, now: number = Date.now()): UserSession {
    const key = login.toLowerCase();
    let s = this.sessions.get(key);
    if (!s) {
      s = newSession(key, now);
      this.sessions.set(key, s);
    }
    return s;
  }

  /** Number of users with at least one strike (for counters/diagnostics). */
  activeStrikeCount(): number {
    let n = 0;
    for (const s of this.sessions.values()) if (s.strikes > 0) n += 1;
    return n;
  }

  analyze(msg: IncomingMessage, now: number = Date.now()): Analysis {
    const session = this.getSession(msg.login, now);
    const firstTime = !session.seen;
    const norm = normalize(msg.text);

    const cooldownMs = this.cfg.moderation.cooldownSeconds * 1000;
    const inCooldown = session.lastActionAt !== null && now - session.lastActionAt < cooldownMs;

    const finish = (analysis: Analysis): Analysis => {
      // Record message stats after analysis so flood/duplicate use prior history.
      session.messageTimestamps = [...session.messageTimestamps, now].slice(-MAX_TIMESTAMPS);
      if (norm.canonical) {
        session.recentNormalized = [...session.recentNormalized, norm.canonical].slice(
          -MAX_RECENT_TEXTS,
        );
      }
      session.seen = true;
      return analysis;
    };

    const commit = (result: DecisionResult, signal: Signal, aggregate: number): Analysis => {
      const acted =
        result.decision.action !== 'allow' &&
        result.decision.action !== 'ignore' &&
        result.decision.action !== 'review';
      // Cooldown: don't double-punish queued burst messages (non-severe only).
      if (acted && inCooldown && signal.severity < 3) {
        const since = now - (session.lastActionAt ?? now);
        return finish({
          decision: ignoreDecision(since),
          escalateToAI: false,
          signal,
          scores: {},
          aggregate,
        });
      }
      session.strikes = result.nextStrikes;
      if (acted) session.lastActionAt = now;
      return finish({
        decision: result.decision,
        escalateToAI: false,
        signal,
        scores: {},
        aggregate,
      });
    };

    // S0 — exemptions.
    if (isExempt(msg, this.cfg)) {
      return finish({
        decision: allowDecision('Exempt role — not analyzed'),
        escalateToAI: false,
        signal: cleanSignal(),
        scores: {},
        aggregate: 0,
      });
    }

    // S2 — deterministic hard rules.
    const det = deterministic(msg, norm, session, this.cfg, now);
    if (det) {
      return commit(decide(det, session, this.cfg, now), det, det.confidence);
    }

    // S3 — heuristic scoring.
    const sc = scoreText(norm, msg);
    if (!sc.top || sc.top.score <= 0) {
      return finish({
        decision: allowDecision(`Clean (aggregate ${sc.aggregate.toFixed(2)})`),
        escalateToAI: false,
        signal: cleanSignal(),
        scores: sc.scores,
        aggregate: sc.aggregate,
      });
    }

    const category = sc.top.category;
    let risk = sc.top.score;
    if (firstTime && this.cfg.moderation.firstTimeChatterBoost) risk += 0.1;
    risk += Math.min(0.15, session.strikes * 0.05);
    risk = Math.min(1, risk);

    const severity: Severity = sc.severity[category] ?? (risk >= 0.85 ? 2 : 1);
    const signal: Signal = {
      category,
      severity,
      confidence: risk,
      reason: describe(category, sc.evidence[category], sc.targeted),
      source: 'local',
    };

    // Hard lexicon hit (slur / explicit threat) — act now, bypass the gate.
    if (severity >= 3) {
      return commit(decide(signal, session, this.cfg, now), signal, risk);
    }

    // S4 — ambiguity gate.
    const g = gate(risk, category, this.cfg);
    if (g === 'allow') {
      return finish({
        decision: allowDecision(`Clean (aggregate ${risk.toFixed(2)})`),
        escalateToAI: false,
        signal,
        scores: sc.scores,
        aggregate: risk,
      });
    }
    if (g === 'act') {
      return commit(decide(signal, session, this.cfg, now), signal, risk);
    }

    // g === 'escalate' — resolve locally with the fallback policy, flag for AI.
    const result = this.fallback(signal, session, now);
    const analysis = commit(result, signal, risk);
    return { ...analysis, escalateToAI: true, scores: sc.scores };
  }

  /** Fallback policy used when the AI is unavailable or over budget. */
  private fallback(signal: Signal, session: UserSession, now: number): DecisionResult {
    if (this.cfg.ai.fallback === 'strict-local') {
      return decide(signal, session, this.cfg, now);
    }
    // conservative-local: high-risk categories go to review, low-risk are allowed.
    if (HIGH_RISK.includes(signal.category)) {
      return reviewResult(signal, session);
    }
    return {
      nextStrikes: session.strikes,
      decision: allowDecision(
        `Ambiguous but low-risk — allowed (aggregate ${signal.confidence.toFixed(2)})`,
      ),
    };
  }

  /**
   * Map a provider verdict through the decision engine and commit it. Used when
   * an escalated message is judged by the AI (S5 → S6).
   */
  judgeWithVerdict(msg: IncomingMessage, verdict: AIVerdict, now: number = Date.now()): Decision {
    const session = this.getSession(msg.login, now);
    if (verdict.action === 'allow') {
      return allowDecision(verdict.reason || 'Allowed by AI review');
    }
    const result = decide(verdictSignal(verdict), session, this.cfg, now);
    session.strikes = result.nextStrikes;
    if (result.decision.action !== 'review') session.lastActionAt = now;
    return result.decision;
  }
}

function cleanSignal(): Signal {
  return { category: 'none', severity: 0, confidence: 1, reason: 'Clean', source: 'local' };
}
