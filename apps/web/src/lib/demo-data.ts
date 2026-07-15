/**
 * Demo data shown in the dashboard until the live Firebase integration lands
 * (milestone M4). Every page that renders from this module is labeled
 * "Demo data" in the top bar.
 */
import type { ModerationEvent, ReviewItem } from '@ozenmod/shared';

export const DEMO_CHANNEL = {
  login: 'pixelforge',
  display: 'PixelForge',
  botLogin: 'ozenmod_bot',
  sessionTime: '02:14:36',
  live: true,
};

export const DEMO_STATS = {
  messagesAnalyzed: 12482,
  actionsTaken: 96,
  aiCalls: 214,
  aiSharePct: 1.7,
  resolvedLocallyPct: 98.3,
  localCount: 12268,
  reviewPending: 2,
};

/** Messages analyzed per 30 minutes (current session). Max y-axis: 2000. */
export const DEMO_ACTIVITY = [
  { label: '18:00', value: 620 },
  { label: '18:30', value: 980 },
  { label: '19:00', value: 1370 },
  { label: '19:30', value: 1810 },
  { label: '20:00', value: 1540 },
  { label: '20:30', value: 1685 },
  { label: '21:00', value: 1930, highlight: true },
  { label: '21:30', value: 1720 },
  { label: '22:00', value: 827 },
] as const;

export const DEMO_BREAKDOWN = [
  { label: 'Deleted', value: 42 },
  { label: 'Warnings', value: 31 },
  { label: 'Timeouts', value: 17 },
  { label: 'Review', value: 4 },
  { label: 'Bans', value: 2 },
] as const;

const t = (h: number, m: number, s: number) => Date.UTC(2026, 6, 14, h, m, s);

export const DEMO_EVENTS: ModerationEvent[] = [
  {
    id: 'ev-10',
    at: t(22, 14, 31),
    userLogin: 'grifter_joe',
    userDisplay: 'grifter_joe',
    category: 'scam',
    categoryLabel: 'Scam link',
    action: 'timeout',
    actionLabel: 'Deleted + 10m',
    source: 'local',
    reason: 'URL shortener promising free bits — link policy: trusted only',
  },
  {
    id: 'ev-09',
    at: t(22, 13, 58),
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
    at: t(22, 12, 40),
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
    at: t(22, 11, 2),
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
    at: t(22, 9, 47),
    userLogin: 'confused_carl',
    userDisplay: 'confused_carl',
    category: 'toxicity',
    categoryLabel: 'Toxicity',
    action: 'allow',
    actionLabel: 'Allowed',
    source: 'ai',
    reason: 'Quoting another user to disagree — not an attack (confidence 0.88)',
  },
  {
    id: 'ev-05',
    at: t(22, 8, 13),
    userLogin: 'meme_machine',
    userDisplay: 'meme_machine',
    category: 'spam',
    categoryLabel: 'Spam',
    action: 'delete',
    actionLabel: 'Deleted',
    source: 'local',
    reason: 'Same message repeated 4× in 60 s',
  },
  {
    id: 'ev-04',
    at: t(22, 5, 33),
    userLogin: 'caps_locker',
    userDisplay: 'caps_locker',
    category: 'spam',
    categoryLabel: 'Spam',
    action: 'delete',
    actionLabel: 'Deleted',
    source: 'local',
    reason: '87% capitals across 120 characters (limit 70%)',
  },
  {
    id: 'ev-03',
    at: t(22, 2, 19),
    userLogin: 'promo_pete',
    userDisplay: 'promo_pete',
    category: 'advertising',
    categoryLabel: 'Advertising',
    action: 'delete',
    actionLabel: 'Deleted',
    source: 'local',
    reason: 'Unsolicited self-promotion (follow-for-follow)',
  },
  {
    id: 'ev-02',
    at: t(21, 58, 41),
    userLogin: 'old_pal_dan',
    userDisplay: 'old_pal_dan',
    category: 'toxicity',
    categoryLabel: 'Toxicity',
    action: 'allow',
    actionLabel: 'Allowed',
    source: 'ai',
    reason: 'Friendly banter with emotes — no hostility toward a target',
  },
  {
    id: 'ev-01',
    at: t(21, 55, 7),
    userLogin: 'repeat_rita',
    userDisplay: 'repeat_rita',
    category: 'evasion',
    categoryLabel: 'Evasion',
    action: 'warn',
    actionLabel: 'Warning 1/3',
    source: 'local',
    reason: 'Banned term matched after homoglyph folding',
    strike: '1/3',
  },
];

export const DEMO_REVIEW: ReviewItem[] = [
  {
    id: 'rv-1',
    at: t(22, 10, 12),
    userLogin: 'old_pal_dan',
    snippet: '“you absolute muppet lol”',
    note: 'Possible banter between regulars',
    confidence: 0.41,
  },
  {
    id: 'rv-2',
    at: t(22, 6, 55),
    userLogin: 'new_viewer42',
    snippet: '“is this stream always this dead”',
    note: 'Borderline toxicity, no target',
    confidence: 0.52,
  },
];

export const DEMO_BANNED_TERMS = [
  { term: 'buy followers', severity: 'high' },
  { term: 'free bits', severity: 'high' },
  { term: 'trashcan andy', severity: 'low' },
  { term: 'stream sniping', severity: 'low' },
] as const;

export const DEMO_TRUSTED_DOMAINS = ['clips.twitch.tv', 'youtube.com', 'github.com'] as const;

export function formatTime(at: number): string {
  const d = new Date(at);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

/** Deterministic avatar gradient per user (no external images in demo mode). */
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#FCD34D,#F59E0B)',
  'linear-gradient(135deg,#F9A8D4,#EC4899)',
  'linear-gradient(135deg,#93C5FD,#3B82F6)',
  'linear-gradient(135deg,#FCA5A5,#EF4444)',
  'linear-gradient(135deg,#86EFAC,#22C55E)',
  'linear-gradient(135deg,#C4B5FD,#8B5CF6)',
  'linear-gradient(135deg,#FDBA74,#F97316)',
  'linear-gradient(135deg,#A5F3FC,#06B6D4)',
  'linear-gradient(135deg,#94A3B8,#64748B)',
  'linear-gradient(135deg,#F0ABFC,#D946EF)',
];

export function avatarGradient(login: string): string {
  let hash = 0;
  for (const ch of login) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length] as string;
}
