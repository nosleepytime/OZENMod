/**
 * Local slash-grammar parser for the AI Assistant.
 *
 * This is the deterministic fallback described in docs/AI-PROVIDERS.md §7 — it
 * turns a plain-English or slash command into a structured CommandIntent with
 * zero AI, so the assistant keeps working when no provider is available. In the
 * full product (M6) an AI parse runs first and this is the safety net; in the
 * M1 web app it powers the interactive demo end-to-end.
 */
import type { CommandIntent } from '@ozenmod/shared';

const DURATION_UNITS: Record<string, number> = {
  s: 1,
  sec: 1,
  secs: 1,
  second: 1,
  seconds: 1,
  m: 60,
  min: 60,
  mins: 60,
  minute: 60,
  minutes: 60,
  h: 3600,
  hr: 3600,
  hrs: 3600,
  hour: 3600,
  hours: 3600,
  d: 86400,
  day: 86400,
  days: 86400,
};

function parseDuration(text: string): number | undefined {
  const m = text.match(/(\d+)\s*(s|secs?|seconds?|m|mins?|minutes?|h|hrs?|hours?|d|days?)\b/i);
  if (!m) return undefined;
  const value = Number(m[1]);
  const unit = DURATION_UNITS[m[2]!.toLowerCase()];
  return unit ? value * unit : undefined;
}

function humanDuration(seconds: number): string {
  if (seconds % 86400 === 0) return `${seconds / 86400} day${seconds === 86400 ? '' : 's'}`;
  if (seconds % 3600 === 0) return `${seconds / 3600} hour${seconds === 3600 ? '' : 's'}`;
  if (seconds % 60 === 0) return `${seconds / 60} minutes`;
  return `${seconds} seconds`;
}

/** Pull a username after a keyword, ignoring a leading @ and filler words. */
function extractTarget(text: string): string | undefined {
  // 1. Explicit @mention wins.
  const at = text.match(/@([a-z0-9_]{3,25})/i);
  if (at) return at[1];

  const cleaned = text.replace(/[,.]/g, ' ');

  // 2. Possessive form: "<user>'s warning / strikes / timeout / messages".
  const poss = cleaned.match(
    /\b([a-z0-9_]{3,25})['’]s\s+(?:warnings?|strikes?|timeouts?|messages?|ban|mute)/i,
  );
  if (poss) return poss[1];

  // 3. After an action or preposition keyword.
  const kw = cleaned.match(
    /\b(?:ban|unban|timeout|time out|untimeout|warn|unwarn|mute|unmute|purge|delete|remove|clear|reset|approve|exempt|lift(?: the)?(?: timeout)?(?: on)?|from|for|on)\s+@?([a-z0-9_]{3,25})/i,
  );
  if (kw && !isFillerWord(kw[1]!)) return kw[1];

  return undefined;
}

/** Words that follow a keyword but are not usernames. */
function isFillerWord(word: string): boolean {
  return /^(all|the|everyone|everybody|his|her|their|this|that|user|chatter|message|messages|warning|warnings|strike|strikes|timeout|timeouts)$/i.test(
    word,
  );
}

function extractReason(text: string): string | undefined {
  const m = text.match(/\b(?:because|reason:?|since)\s+(.+)$/i);
  if (m) return cleanReason(m[1]!);

  // "for <reason>" — but only if it isn't just a duration like "for 10 min".
  const forMatch = text.match(/\bfor\s+(.+)$/i);
  if (forMatch) {
    // Strip a leading duration ("10 min, spamming" → "spamming").
    const rest = forMatch[1]!.replace(
      /^\d+\s*(?:s|secs?|seconds?|m|mins?|minutes?|h|hrs?|hours?|d|days?)\b[\s,]*/i,
      '',
    );
    if (rest.trim() && !/^\d+\s*(?:s|m|h|d)/i.test(rest)) return cleanReason(rest);
  }
  return undefined;
}

function cleanReason(reason: string): string | undefined {
  const r = reason
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/^(he|she|they|it)\s+(keeps?|was|is|were)\s+/i, '')
    .trim();
  return r.length > 0 ? r : undefined;
}

/**
 * Parse one command. Returns a fully-formed intent, including the assistant's
 * English reply and whether confirmation is required (permanent bans, timeouts
 * over 24h and mass actions are always tier-2).
 */
export function parseCommand(input: string): CommandIntent {
  const raw = input.trim();
  const text = raw.replace(/^\//, '').trim();
  const lower = text.toLowerCase();
  const target = extractTarget(text);
  const reason = extractReason(text);

  const unknown = (reply: string): CommandIntent => ({
    action: 'unknown',
    needsConfirmation: false,
    confidence: 0.3,
    reply,
  });

  // Queries
  if (
    /\bwho (did i|have i).*(ban|time)/i.test(lower) ||
    /^actions?\b|recent (bans|timeouts|actions)/i.test(lower)
  ) {
    return {
      action: 'query_actions',
      needsConfirmation: false,
      confidence: 0.9,
      reply: 'Here are the most recent actions this stream.',
    };
  }
  if (/\bstats?\b|how many|session summary/i.test(lower)) {
    return {
      action: 'query_stats',
      needsConfirmation: false,
      confidence: 0.9,
      reply: 'Session stats: 12,482 messages analyzed, 96 actions, 214 AI calls (1.7%).',
    };
  }
  const hasActionVerb =
    /\b(ban|timeout|time out|warn|mute|clear|reset|remove|delete|purge|lift|exempt|add|set)\b/i.test(
      lower,
    );
  if (target && !hasActionVerb && /\b(history|strikes?|record|why|show|list)\b/i.test(lower)) {
    return {
      action: 'query_user',
      target,
      needsConfirmation: false,
      confidence: 0.85,
      reply: `${target}: 2/3 strikes this stream, last action “Warning 2/3” for a targeted insult.`,
    };
  }

  // Undo
  if (/\bundo\b/i.test(lower)) {
    return {
      action: 'undo_last',
      needsConfirmation: false,
      confidence: 0.95,
      reply: 'Reverted the last action.',
    };
  }

  // Rules
  if (/\b(add|block).*(term|word)\b/i.test(lower) || /^term\b/i.test(lower)) {
    const term = text.match(/(?:term|word)s?\s+["']?([^"']+?)["']?$/i)?.[1]?.trim();
    return {
      action: 'add_banned_term',
      args: term ? { term } : undefined,
      needsConfirmation: false,
      confidence: term ? 0.85 : 0.5,
      reply: term ? `Added “${term}” to your banned terms.` : 'Which term should I add?',
    };
  }
  if (/\bsensitiv/i.test(lower)) {
    const level = lower.match(/\b(lenient|balanced|strict)\b/)?.[1];
    return {
      action: 'set_sensitivity',
      args: level ? { level } : undefined,
      needsConfirmation: false,
      confidence: level ? 0.85 : 0.5,
      reply: level
        ? `Sensitivity set to ${level}.`
        : 'Set sensitivity to lenient, balanced or strict?',
    };
  }

  // Forgive
  if (/\bunban\b/i.test(lower)) {
    if (!target) return unknown('Who should I unban?');
    return {
      action: 'unban',
      target,
      reason,
      needsConfirmation: false,
      confidence: 0.9,
      reply: `Unbanned ${target}.`,
    };
  }
  if (/\bunwarn\b|remove.*warn|clear.*warn|delete.*warn/i.test(lower)) {
    if (!target) return unknown('Whose warning should I remove?');
    return {
      action: 'unwarn',
      target,
      reason,
      needsConfirmation: false,
      confidence: 0.9,
      reply: `Removed a warning from ${target} (2/3 → 1/3).`,
    };
  }
  if (/\b(clear|reset).*(strikes?)\b/i.test(lower)) {
    const everyone = /\ball\b|everyone|everybody/i.test(lower) && !target;
    if (everyone) {
      return {
        action: 'clear_strikes',
        args: { scope: 'all' },
        needsConfirmation: true,
        confidence: 0.85,
        reply: 'Clear strikes for every user this stream? This affects everyone.',
      };
    }
    if (!target) return unknown('Whose strikes should I clear?');
    return {
      action: 'clear_strikes',
      target,
      needsConfirmation: false,
      confidence: 0.9,
      reply: `Cleared all of ${target}'s strikes (→ 0/3).`,
    };
  }
  if (/\buntimeout\b|remove.*timeout|lift.*timeout|un-?mute\b/i.test(lower)) {
    if (!target) return unknown('Whose timeout should I lift?');
    return {
      action: 'untimeout',
      target,
      needsConfirmation: false,
      confidence: 0.9,
      reply: `Lifted the timeout on ${target}.`,
    };
  }

  // Punish
  if (/\bban\b/i.test(lower)) {
    if (!target) return unknown('Who should I ban? Try “ban username”.');
    return {
      action: 'ban',
      target,
      reason,
      needsConfirmation: true, // permanent → always confirm
      confidence: 0.9,
      reply: `Ban ${target} permanently${reason ? ` for ${reason}` : ''}?`,
    };
  }
  if (/\btime\s?out\b|\bmute\b/i.test(lower)) {
    if (!target) return unknown('Who should I time out?');
    const seconds = parseDuration(text) ?? 600;
    const overADay = seconds > 86400;
    return {
      action: 'timeout',
      target,
      durationSeconds: seconds,
      reason,
      needsConfirmation: overADay,
      confidence: 0.9,
      reply: overADay
        ? `Time out ${target} for ${humanDuration(seconds)}? That's over 24 hours.`
        : `Timed out ${target} for ${humanDuration(seconds)}${reason ? ` — ${reason}` : ''}.`,
    };
  }
  if (/\bwarn\b/i.test(lower)) {
    if (!target) return unknown('Who should I warn?');
    return {
      action: 'warn',
      target,
      reason,
      needsConfirmation: false,
      confidence: 0.9,
      reply: `Warned ${target}${reason ? ` — ${reason}` : ''} (strike added).`,
    };
  }
  if (/\b(delete|purge|clear).*(message|msg|chat)/i.test(lower) || /\bpurge\b/i.test(lower)) {
    if (!target) return unknown('Whose messages should I remove?');
    return {
      action: 'purge_user',
      target,
      needsConfirmation: false,
      confidence: 0.85,
      reply: `Removed ${target}'s recent messages.`,
    };
  }

  return unknown(
    "I didn't catch a command there. Try “timeout username 10m”, “remove username's warning”, “ban username”, or type / for exact syntax.",
  );
}

export type ActionIcon = 'ban' | 'clock' | 'eye' | 'trash' | 'sparkles' | 'info' | 'undo' | 'check';
export type ActionTone = 'good' | 'warn' | 'danger' | 'info';

/** Human label + icon key for an action, used to render result cards. */
export function actionMeta(intent: CommandIntent): {
  title: string;
  icon: ActionIcon;
  tone: ActionTone;
} {
  switch (intent.action) {
    case 'ban':
      return { title: 'Permanent ban', icon: 'ban', tone: 'danger' };
    case 'unban':
      return { title: 'User unbanned', icon: 'check', tone: 'good' };
    case 'timeout':
      return { title: 'Timeout applied', icon: 'clock', tone: 'warn' };
    case 'untimeout':
      return { title: 'Timeout lifted', icon: 'clock', tone: 'good' };
    case 'warn':
      return { title: 'Warning issued', icon: 'eye', tone: 'warn' };
    case 'unwarn':
      return { title: 'Warning removed', icon: 'eye', tone: 'good' };
    case 'clear_strikes':
      return { title: 'Strikes cleared', icon: 'eye', tone: 'good' };
    case 'purge_user':
    case 'delete_messages':
      return { title: 'Messages removed', icon: 'trash', tone: 'warn' };
    case 'add_banned_term':
    case 'remove_banned_term':
    case 'set_sensitivity':
    case 'set_link_policy':
    case 'toggle_category':
      return { title: 'Rule updated', icon: 'sparkles', tone: 'info' };
    case 'undo_last':
      return { title: 'Reverted', icon: 'undo', tone: 'good' };
    case 'query_user':
    case 'query_stats':
    case 'query_actions':
      return { title: 'Answer', icon: 'info', tone: 'info' };
    default:
      return { title: 'Not understood', icon: 'info', tone: 'info' };
  }
}
