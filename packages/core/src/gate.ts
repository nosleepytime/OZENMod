/**
 * S4 — Ambiguity gate. Two thresholds per sensitivity preset decide whether a
 * scored message is allowed, acted on locally, or escalated to the AI. Certain
 * categories prefer AI inside the band; when AI assist is off for a category the
 * band is resolved locally instead. See docs/MODERATION.md §3 (S4).
 */
import type { ChannelConfig } from '@ozenmod/database';
import type { Category, Sensitivity } from '@ozenmod/shared';

export interface GateThresholds {
  low: number;
  high: number;
}

const PRESETS: Record<Sensitivity, GateThresholds> = {
  lenient: { low: 0.4, high: 0.8 },
  balanced: { low: 0.3, high: 0.7 },
  strict: { low: 0.2, high: 0.55 },
};

export function thresholds(sensitivity: Sensitivity): GateThresholds {
  return PRESETS[sensitivity];
}

export type GateDecision = 'allow' | 'act' | 'escalate';

export function gate(aggregate: number, category: Category, config: ChannelConfig): GateDecision {
  const t = thresholds(config.moderation.sensitivity);
  const cat = config.moderation.categories[category];
  if (cat && !cat.detect) return 'allow';

  const high = Math.max(cat?.threshold ?? t.high, t.low);
  if (aggregate < t.low) return 'allow';
  if (aggregate >= high) return 'act';
  // Inside the ambiguity band.
  return cat?.aiAssist ? 'escalate' : 'act';
}
