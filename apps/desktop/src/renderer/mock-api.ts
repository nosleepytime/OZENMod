/**
 * Browser fallback for window.ozenmod. In the packaged app the preload bridge
 * provides the real API backed by the main-process BotRuntime. When the renderer
 * is opened in a plain browser (design preview / screenshots), this stand-in
 * serves the same shape from equivalent demo data and the shared command parser,
 * so the UI is fully interactive without Electron.
 */
import { parseCommand } from '@ozenmod/ai';
import type { CommandIntent, ModerationEvent, ReviewItem } from '@ozenmod/shared';
import type { BotStatus, LogEntry, OzenmodApi, SystemInfo, CommandResult } from '../ipc-contract';

const at = (o: number) => Date.UTC(2026, 6, 14, 22, 0, 0) + o * 1000;

const FEED: ModerationEvent[] = [
  {
    id: 'e1',
    at: at(221),
    userLogin: 'mia_kplays',
    userDisplay: 'mia_kplays',
    category: 'none',
    categoryLabel: 'Clean',
    action: 'allow',
    actionLabel: 'Allowed',
    source: 'local',
    reason: '',
  },
  {
    id: 'e2',
    at: at(238),
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
    id: 'e3',
    at: at(252),
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
    id: 'e4',
    at: at(271),
    userLogin: 'grifter_joe',
    userDisplay: 'grifter_joe',
    category: 'scam',
    categoryLabel: 'Scam link',
    action: 'timeout',
    actionLabel: 'Deleted + Timeout 10m',
    source: 'local',
    reason: 'Phishing link — credential scam pattern',
  },
  {
    id: 'e5',
    at: at(287),
    userLogin: 'old_pal_dan',
    userDisplay: 'old_pal_dan',
    category: 'toxicity',
    categoryLabel: 'Toxicity',
    action: 'review',
    actionLabel: 'Sent to review',
    source: 'ai',
    reason: 'Possible banter between regulars · confidence 0.41',
  },
];

const REVIEW: ReviewItem[] = [
  {
    id: 'r1',
    at: at(287),
    userLogin: 'old_pal_dan',
    snippet: '“you absolute muppet lol”',
    note: 'Possible banter',
    confidence: 0.41,
  },
  {
    id: 'r2',
    at: at(15),
    userLogin: 'new_viewer42',
    snippet: '“is this stream always this dead”',
    note: 'Borderline toxicity',
    confidence: 0.52,
  },
];

const LOGS: LogEntry[] = [
  { at: at(2), level: 'info', message: 'OZENMod 0.1.0 started — runtime: desktop' },
  { at: at(3), level: 'info', message: 'Connected to Twitch IRC as ozenmod_bot (41 ms)' },
  { at: at(4), level: 'ai', message: 'Provider Pollinations healthy — test verdict in 142 ms' },
  {
    at: at(238),
    level: 'action',
    message: 'Warning 2/3 → xX_rager_Xx — targeted insult (AI, confidence 0.83)',
  },
  { at: at(271), level: 'action', message: 'Deleted + Timeout 10m → grifter_joe — phishing link' },
  {
    at: at(280),
    level: 'warn',
    message: 'Pollinations latency 2.31 s above soft limit — retrying',
  },
];

const status: BotStatus = {
  state: 'protecting',
  channel: 'pixelforge',
  botAccount: 'ozenmod_bot',
  sessionStartedAt: Date.now() - 8076_000,
  health: { twitch: true, ai: true, eventSub: true, aiLatencyMs: 142, aiProvider: 'Pollinations' },
  stats: { messages: 12482, actions: 96, aiCalls: 214, reviewPending: 2 },
  appVersion: '0.1.0',
};

const system: SystemInfo = {
  appVersion: '0.1.0',
  cpuPercent: 2.1,
  memoryMb: 84,
  chatLatencyMs: 41,
  aiLatencyMs: 1100,
  lastSyncAt: Date.now() - 12000,
  updateAvailable: false,
};

function execute(intent: CommandIntent): CommandResult {
  const isQuery = intent.action.startsWith('query') || intent.action === 'undo_last';
  return {
    intent,
    status: 'done',
    message: intent.reply || (isQuery ? 'Done.' : 'Action applied.'),
  };
}

export const mockApi: OzenmodApi = {
  getStatus: async () => status,
  startBot: async () => ({ ...status, state: 'protecting' }),
  stopBot: async () => ({ ...status, state: 'idle', sessionStartedAt: null }),
  getSystemInfo: async () => system,
  getFeed: async () => FEED,
  getReviewQueue: async () => REVIEW,
  getLogs: async () => LOGS,
  beginTwitchAuth: async () => ({
    userCode: 'QXRV-PLMH',
    verificationUri: 'https://www.twitch.tv/activate',
    expiresInSeconds: 872,
    status: 'waiting',
  }),
  runCommand: async (raw: string) => {
    const intent = parseCommand(raw);
    if (intent.action === 'unknown') return { intent, status: 'failed', message: intent.reply };
    if (intent.needsConfirmation)
      return { intent, status: 'needs-confirmation', message: intent.reply };
    return execute(intent);
  },
  confirmCommand: async (intent: CommandIntent) => execute(intent),
  onStatus: () => () => {},
  onFeed: () => () => {},
  onLog: () => () => {},
};

/** The real bridge in Electron, or the mock in a browser. */
export function getApi(): OzenmodApi {
  return typeof window !== 'undefined' && window.ozenmod ? window.ozenmod : mockApi;
}
