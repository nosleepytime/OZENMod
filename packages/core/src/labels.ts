/** Human-readable English labels — every event the engine emits is explainable. */
import type { Category } from '@ozenmod/shared';

export const CATEGORY_LABELS: Record<Category, string> = {
  harassment: 'Harassment',
  hate: 'Hate speech',
  threat: 'Threat',
  sexual: 'Sexual content',
  spam: 'Spam',
  flood: 'Flood',
  scam: 'Scam',
  advertising: 'Advertising',
  evasion: 'Evasion',
  toxicity: 'Toxicity',
  none: 'Clean',
};

export function categoryLabel(category: Category): string {
  return CATEGORY_LABELS[category] ?? category;
}

/** Compact duration, e.g. 45 → "45s", 600 → "10m", 86400 → "24h". */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3600)}h`;
}
