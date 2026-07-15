/**
 * Demo session data for milestone M2 — replaced by real Twitch/engine data in
 * M3–M6. Kept in the main process so the renderer only ever sees it through IPC,
 * exactly like real data will flow.
 */
import type { ModerationEvent, ReviewItem } from '@ozenmod/shared';
import type { LogEntry } from '../ipc-contract';

const base = Date.UTC(2026, 6, 14, 22, 0, 0);
const at = (offsetSeconds: number) => base + offsetSeconds * 1000;

export const DEMO_EVENTS: ModerationEvent[] = [
  {
    id: 'ev-10',
    at: at(871),
    userLogin: 'grifter_joe',
    userDisplay: 'grifter_joe',
    category: 'scam',
    categoryLabel: 'Scam link',
    action: 'timeout',
    actionLabel: 'Deleted + 10m',
    source: 'local',
    reason: 'Phishing link — credential scam pattern',
  },
  {
    id: 'ev-09',
    at: at(838),
    userLogin: 'xx_rager_xx',
    userDisplay: 'xX_rager_Xx',
    category: 'harassment',
    categoryLabel: 'Harassment',
    action: 'warn',
    actionLabel: 'Warning 2/3',
    source: 'ai',
    reason: 'Targeted insult at @mia_kplays after a prior warning',
    strike: '2/3',
  },
  {
    id: 'ev-08',
    at: at(760),
    userLogin: 'spamlord2000',
    userDisplay: 'spamlord2000',
    category: 'flood',
    categoryLabel: 'Flood',
    action: 'timeout',
    actionLabel: 'Timeout 5m',
    source: 'local',
    reason: '9 messages in 8 s (limit: 5 per 10 s)',
  },
  {
    id: 'ev-07',
    at: at(542),
    userLogin: 'edgy_kiddo',
    userDisplay: 'edgy_kiddo',
    category: 'hate',
    categoryLabel: 'Hate speech',
    action: 'ban',
    actionLabel: 'Banned',
    source: 'ai',
    reason: 'Slur directed at a chatter (severity 3) — ladder bypassed',
  },
  {
    id: 'ev-06',
    at: at(487),
    userLogin: 'confused_carl',
    userDisplay: 'confused_carl',
    category: 'toxicity',
    categoryLabel: 'Toxicity',
    action: 'allow',
    actionLabel: 'Allowed',
    source: 'ai',
    reason: 'Quoting another user to disagree — not an attack (confidence 0.88)',
  },
];

export const DEMO_REVIEW: ReviewItem[] = [
  {
    id: 'rv-1',
    at: at(887),
    userLogin: 'old_pal_dan',
    snippet: '“you absolute muppet lol”',
    note: 'Possible banter between regulars',
    confidence: 0.41,
  },
  {
    id: 'rv-2',
    at: at(415),
    userLogin: 'new_viewer42',
    snippet: '“is this stream always this dead”',
    note: 'Borderline toxicity, no target',
    confidence: 0.52,
  },
];

export function seedLogs(): LogEntry[] {
  const now = Date.now();
  const s = (offset: number): number => now - offset * 1000;
  return [
    { at: s(30), level: 'info', message: 'OZENMod 0.1.0 started — runtime: desktop' },
    { at: s(29), level: 'info', message: 'Startup sweep: no stale session found for #pixelforge' },
    { at: s(28), level: 'ai', message: 'Provider Pollinations healthy — test verdict in 142 ms' },
    {
      at: s(20),
      level: 'info',
      message: 'Config loaded (version 41) — sensitivity: balanced, ladder: 3 strikes',
    },
  ];
}
