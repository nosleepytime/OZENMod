/**
 * S3 — Heuristic scoring. Turns the normalized message into weighted per-category
 * scores with context multipliers (target detection, negation/quotation
 * dampening). Pure and synchronous. See docs/MODERATION.md §3 (S3).
 */
import type { Category } from '@ozenmod/shared';
import type { IncomingMessage, Severity } from './types';
import type { NormalizedText } from './normalize';
import { containsTerm, containsWord } from './normalize';
import { LEXICON, DAMPENERS } from './lexicon';

export interface ScoreResult {
  scores: Partial<Record<Category, number>>;
  severity: Partial<Record<Category, Severity>>;
  evidence: Partial<Record<Category, string>>;
  targeted: boolean;
  /** Highest-scoring category, or null when nothing matched. */
  top: { category: Category; score: number } | null;
  /** The aggregate risk score in [0,1] (the top category's score). */
  aggregate: number;
}

const SECOND_PERSON = /(?:^|[^a-z])(?:you|u|ur|your|youre|ure)(?:[^a-z]|$)/;

/** A message targets someone if it @-mentions or addresses a person directly. */
export function isTargeted(msg: IncomingMessage, norm: NormalizedText): boolean {
  if (msg.mentions.length > 0) return true;
  return norm.candidates.some((c) => SECOND_PERSON.test(c));
}

export function scoreText(norm: NormalizedText, msg: IncomingMessage): ScoreResult {
  const targeted = isTargeted(msg, norm);
  const dampened = DAMPENERS.some((d) => containsTerm(norm, d));

  const scores: Partial<Record<Category, number>> = {};
  const severity: Partial<Record<Category, Severity>> = {};
  const evidence: Partial<Record<Category, string>> = {};

  for (const entry of LEXICON) {
    const hit = entry.word ? containsWord(norm, entry.term) : containsTerm(norm, entry.term);
    if (!hit) continue;

    let weight = entry.weight;
    if (entry.targeted && targeted) weight *= 1.4;
    // Quotation/negation only dampens the interpersonal categories.
    if (
      dampened &&
      (entry.category === 'harassment' || entry.category === 'hate' || entry.category === 'threat')
    ) {
      weight *= 0.5;
    }

    const prev = scores[entry.category] ?? 0;
    scores[entry.category] = Math.min(1, prev + weight);
    if (entry.severity && (severity[entry.category] ?? 0) < entry.severity) {
      severity[entry.category] = entry.severity;
    }
    if (!evidence[entry.category]) evidence[entry.category] = entry.term;
  }

  let top: { category: Category; score: number } | null = null;
  for (const [category, score] of Object.entries(scores) as [Category, number][]) {
    if (!top || score > top.score) top = { category, score };
  }

  return { scores, severity, evidence, targeted, top, aggregate: top?.score ?? 0 };
}
