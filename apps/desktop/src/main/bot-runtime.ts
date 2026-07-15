/**
 * BotRuntime — the orchestrator the desktop main process owns. This is the
 * "local runtime" implementation (docs/ARCHITECTURE.md §9); a future hosted
 * worker would be a second implementation of the same shape, which is why the
 * engine, providers and database packages take a runtime context rather than
 * Electron APIs.
 *
 * Milestone M2 ships this with a self-contained demo session (no real Twitch or
 * Firebase yet) so the whole app is navigable and the AI Assistant executes
 * end-to-end. M3–M6 replace the demo internals with the real IRC/Helix/EventSub
 * clients, the moderation engine and the AI provider — the IPC surface and the
 * UI do not change.
 */
import { EventEmitter } from 'node:events';
import { parseCommand, actionMeta } from '@ozenmod/ai';
import type { CommandIntent, ModerationEvent, ReviewItem } from '@ozenmod/shared';
import type { BotState, BotStatus, CommandResult, LogEntry, SystemInfo } from '../ipc-contract';
import { DEMO_EVENTS, DEMO_REVIEW, seedLogs } from './demo';

export class BotRuntime extends EventEmitter {
  private state: BotState = 'idle';
  private sessionStartedAt: number | null = null;
  private readonly channel = 'pixelforge';
  private readonly botAccount = 'ozenmod_bot';
  private readonly appVersion: string;
  private logs: LogEntry[] = [];
  private feed: ModerationEvent[] = [...DEMO_EVENTS];
  private review: ReviewItem[] = [...DEMO_REVIEW];
  private stats = { messages: 0, actions: 0, aiCalls: 0, reviewPending: DEMO_REVIEW.length };
  private tick?: NodeJS.Timeout;

  constructor(appVersion: string) {
    super();
    this.appVersion = appVersion;
    this.logs = seedLogs();
  }

  getStatus(): BotStatus {
    return {
      state: this.state,
      channel: this.channel,
      botAccount: this.botAccount,
      sessionStartedAt: this.sessionStartedAt,
      health: {
        twitch: this.state === 'protecting',
        ai: true,
        eventSub: this.state === 'protecting',
        aiLatencyMs: 142,
        aiProvider: 'Pollinations',
      },
      stats: { ...this.stats },
      appVersion: this.appVersion,
    };
  }

  getSystemInfo(): SystemInfo {
    const mem = process.memoryUsage().rss / (1024 * 1024);
    return {
      appVersion: this.appVersion,
      cpuPercent: this.state === 'protecting' ? 2.1 : 0.4,
      memoryMb: Math.round(mem),
      chatLatencyMs: this.state === 'protecting' ? 41 : 0,
      aiLatencyMs: 1100,
      lastSyncAt: this.state === 'protecting' ? Date.now() - 12_000 : null,
      updateAvailable: false,
    };
  }

  getFeed(): ModerationEvent[] {
    return [...this.feed];
  }

  getReviewQueue(): ReviewItem[] {
    return [...this.review];
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  start(): BotStatus {
    if (this.state === 'protecting' || this.state === 'starting') return this.getStatus();
    this.setState('starting');
    this.log('info', `Connecting to Twitch IRC as ${this.botAccount}…`);
    setTimeout(() => {
      this.sessionStartedAt = Date.now();
      this.setState('protecting');
      this.stats.messages = 12_482;
      this.stats.actions = 96;
      this.stats.aiCalls = 214;
      this.log('info', `stream.online received — session started for #${this.channel}`);
      this.log('ai', 'Provider Pollinations healthy — test verdict in 142 ms');
      this.startTicking();
    }, 600);
    return this.getStatus();
  }

  stop(): BotStatus {
    if (this.state === 'idle') return this.getStatus();
    this.setState('stopping');
    this.stopTicking();
    this.log('info', 'Finalizing session — writing summary, clearing temporary data');
    setTimeout(() => {
      this.sessionStartedAt = null;
      this.setState('idle');
      this.log('info', 'Session ended — temporary warnings and counters deleted');
    }, 400);
    return this.getStatus();
  }

  /** Parse a command; execute immediately unless it needs confirmation. */
  runCommand(raw: string): CommandResult {
    const intent = parseCommand(raw);
    if (intent.action === 'unknown') {
      return { intent, status: 'failed', message: intent.reply };
    }
    if (intent.needsConfirmation) {
      return { intent, status: 'needs-confirmation', message: intent.reply };
    }
    return this.execute(intent);
  }

  confirmCommand(intent: CommandIntent): CommandResult {
    return this.execute(intent);
  }

  private execute(intent: CommandIntent): CommandResult {
    const meta = actionMeta(intent);
    const isQuery = intent.action.startsWith('query') || intent.action === 'undo_last';
    if (!isQuery) {
      this.stats.actions += 1;
      const event: ModerationEvent = {
        id: `cmd-${Date.now()}`,
        at: Date.now(),
        userLogin: intent.target ?? 'channel',
        userDisplay: intent.target ?? 'channel',
        category: 'none',
        categoryLabel: 'Manual',
        action:
          intent.action === 'ban'
            ? 'ban'
            : intent.action === 'timeout'
              ? 'timeout'
              : intent.action === 'warn'
                ? 'warn'
                : 'ignore',
        actionLabel: meta.title,
        source: 'manual',
        reason: intent.reason ?? 'Manual action via AI Assistant',
      };
      this.feed = [event, ...this.feed].slice(0, 50);
      this.emit('feed', event);
    }
    this.log('action', `${meta.title} via AI Assistant — ${intent.target ?? 'channel'}`);
    return { intent, status: 'done', message: intent.reply };
  }

  private startTicking() {
    this.stopTicking();
    this.tick = setInterval(() => {
      if (this.state !== 'protecting') return;
      this.stats.messages += Math.floor(6 + Math.random() * 10);
      this.emit('status', this.getStatus());
    }, 4000);
  }

  private stopTicking() {
    if (this.tick) clearInterval(this.tick);
    this.tick = undefined;
  }

  private setState(state: BotState) {
    this.state = state;
    this.emit('status', this.getStatus());
  }

  private log(level: LogEntry['level'], message: string) {
    const entry: LogEntry = { at: Date.now(), level, message };
    this.logs = [...this.logs, entry].slice(-500);
    this.emit('log', entry);
  }

  dispose() {
    this.stopTicking();
    this.removeAllListeners();
  }
}
