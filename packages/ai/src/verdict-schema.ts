/**
 * Runtime validation for AI responses. Providers return free-form JSON; these
 * guards reject anything that does not match the strict contract so a malformed
 * or hostile response can never drive a moderation action. (Deliberately
 * dependency-free — no zod — to keep packages/ai importable everywhere.)
 */
import type { Category, CommandIntent } from '@ozenmod/shared';
import type { AIVerdict } from './types';

const CATEGORIES: readonly Category[] = [
  'harassment',
  'hate',
  'threat',
  'sexual',
  'spam',
  'flood',
  'scam',
  'advertising',
  'evasion',
  'toxicity',
  'none',
];

const VERDICT_ACTIONS = ['allow', 'delete', 'warn', 'timeout', 'ban', 'review'] as const;

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/** Parse and validate a moderation verdict; returns null if invalid. */
export function parseVerdict(raw: unknown): AIVerdict | null {
  if (!isObject(raw)) return null;
  const action = raw.action;
  if (typeof action !== 'string' || !VERDICT_ACTIONS.includes(action as AIVerdict['action']))
    return null;

  const category = CATEGORIES.includes(raw.category as Category)
    ? (raw.category as Category)
    : 'none';
  const severityNum = typeof raw.severity === 'number' ? Math.round(raw.severity) : 0;
  const severity = Math.max(0, Math.min(3, severityNum)) as AIVerdict['severity'];
  const confidence = typeof raw.confidence === 'number' ? clamp01(raw.confidence) : 0.5;
  const reason =
    typeof raw.reason === 'string' && raw.reason.trim() ? raw.reason.trim() : 'No reason provided.';

  return { action: action as AIVerdict['action'], category, severity, confidence, reason };
}

const COMMAND_ACTIONS: readonly CommandIntent['action'][] = [
  'ban',
  'unban',
  'timeout',
  'untimeout',
  'warn',
  'unwarn',
  'clear_strikes',
  'delete_messages',
  'purge_user',
  'approve_review',
  'remove_review',
  'add_banned_term',
  'remove_banned_term',
  'add_trusted_domain',
  'remove_trusted_domain',
  'set_link_policy',
  'set_sensitivity',
  'toggle_category',
  'set_ai_budget',
  'exempt_user',
  'unexempt_user',
  'query_user',
  'query_stats',
  'query_actions',
  'undo_last',
  'unknown',
];

/** Tier-2 actions that must always be confirmed regardless of the model's flag. */
function forcesConfirmation(intent: CommandIntent): boolean {
  if (intent.action === 'ban') return true;
  if (intent.action === 'timeout' && (intent.durationSeconds ?? 0) > 86400) return true;
  if (intent.action === 'clear_strikes' && intent.args?.scope === 'all') return true;
  return false;
}

/** Parse and validate a command intent from an AI response; null if invalid. */
export function parseCommandIntent(raw: unknown): CommandIntent | null {
  if (!isObject(raw)) return null;
  if (!COMMAND_ACTIONS.includes(raw.action as CommandIntent['action'])) return null;

  const intent: CommandIntent = {
    action: raw.action as CommandIntent['action'],
    target: typeof raw.target === 'string' ? raw.target : undefined,
    durationSeconds: typeof raw.durationSeconds === 'number' ? raw.durationSeconds : undefined,
    reason: typeof raw.reason === 'string' ? raw.reason : undefined,
    args: isObject(raw.args) ? (raw.args as Record<string, string>) : undefined,
    needsConfirmation: Boolean(raw.needsConfirmation),
    confidence: typeof raw.confidence === 'number' ? clamp01(raw.confidence) : 0.5,
    reply: typeof raw.reply === 'string' ? raw.reply : '',
  };
  // The decision layer, not the model, decides tier-2 confirmation.
  if (forcesConfirmation(intent)) intent.needsConfirmation = true;
  return intent;
}
