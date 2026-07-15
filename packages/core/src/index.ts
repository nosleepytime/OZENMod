export { ModerationEngine } from './engine';
export type {
  Analysis,
  ChatRole,
  Decision,
  Enforcement,
  IncomingMessage,
  Severity,
  Signal,
  UserSession,
} from './types';
export { normalize, containsTerm, containsWord, foldTerm } from './normalize';
export type { NormalizedText } from './normalize';
export { scoreText, isTargeted } from './scoring';
export type { ScoreResult } from './scoring';
export { deterministic, extractDomains } from './rules';
export { gate, thresholds } from './gate';
export type { GateDecision, GateThresholds } from './gate';
export { decide } from './decision';
export type { DecisionResult } from './decision';
export { categoryLabel, formatDuration, CATEGORY_LABELS } from './labels';
export { LEXICON } from './lexicon';
