/**
 * BotRuntime — the orchestrator the desktop main process owns. This is the
 * "local runtime" implementation (docs/ARCHITECTURE.md §9); a future hosted
 * worker would be a second implementation of the same shape, which is why the
 * engine, providers and database packages take a runtime context rather than
 * Electron APIs.
 *
 * When Twitch is configured (a client id + stored tokens), start() connects a
 * real TwitchChatSession through the injected LiveConnector and the live feed
 * shows real chat. Until the moderation engine lands (M5) every real message is
 * recorded as "allowed" — the connector is the seam the engine will plug into.
 * Without credentials the runtime falls back to a self-contained demo session so
 * the whole app stays navigable and the AI Assistant executes end-to-end. The
 * IPC surface and the UI do not change either way.
 */
import { EventEmitter } from 'node:events';
import { parseCommand, actionMeta } from '@ozenmod/ai';
import type { ChatMessage, HelixAction, StreamEvent } from '@ozenmod/twitch';
import type { CommandIntent, ModerationEvent, ReviewItem } from '@ozenmod/shared';
import type { BotState, BotStatus, CommandResult, LogEntry, SystemInfo } from '../ipc-contract';
import { DEMO_EVENTS, DEMO_REVIEW, seedLogs } from './demo';
import type { LiveConnector } from './twitch-live';

export class BotRuntime extends EventEmitter {
  private state: BotState = 'idle';
  private sessionStartedAt: number | null = null;
  private channel = 'pixelforge';
  private botAccount = 'ozenmod_bot';
  private readonly appVersion: string;
  private readonly connector: LiveConnector | null;
  private logs: LogEntry[] = [];
  private feed: ModerationEvent[] = [...DEMO_EVENTS];
  private review: ReviewItem[] = [...DEMO_REVIEW];
  private stats = { messages: 0, actions: 0, aiCalls: 0, reviewPending: DEMO_REVIEW.length };
  private tick?: NodeJS.Timeout;

  constructor(appVersion: string, connector: LiveConnector | null = null) {
    super();
    this.appVersion = appVersion;
    this.connector = connector;
    this.logs = seedLogs();
  }

  private get live(): boolean {
    return this.connector?.isConfigured() ?? false;
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
    if (this.live && this.connector) {
      this.log('info', 'Connecting to Twitch…');
      void this.connector
        .start({
          onMessage: (m) => this.onChatMessage(m),
          onStreamEvent: (e) => this.onStreamEvent(e),
          onLog: (level, message) => this.log(level, message),
        })
        .then(() => {
          this.sessionStartedAt = Date.now();
          this.setState('protecting');
        })
        .catch((err: unknown) => {
          this.log(
            'error',
            `Failed to connect: ${err instanceof Error ? err.message : String(err)}`,
          );
          this.setState('error');
        });
      return this.getStatus();
    }

    // Demo session (no Twitch credentials configured).
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
    if (this.live) this.connector?.stop();
    this.log('info', 'Finalizing session — writing summary, clearing temporary data');
    setTimeout(() => {
      this.sessionStartedAt = null;
      this.setState('idle');
      this.log('info', 'Session ended — temporary warnings and counters deleted');
    }, 400);
    return this.getStatus();
  }

  /**
   * A real chat message arrived. Until the moderation engine lands (M5) every
   * message is recorded as allowed — this is the seam the engine plugs into.
   */
  private onChatMessage(message: ChatMessage): void {
    this.stats.messages += 1;
    const event: ModerationEvent = {
      id: message.id || `msg-${Date.now()}`,
      at: message.timestamp,
      userLogin: message.login,
      userDisplay: message.displayName,
      category: 'none',
      categoryLabel: 'Clean',
      action: 'allow',
      actionLabel: 'Allowed',
      source: 'local',
      reason: '',
    };
    this.feed = [event, ...this.feed].slice(0, 50);
    this.emit('feed', event);
    if (this.stats.messages % 10 === 0) this.emit('status', this.getStatus());
  }

  private onStreamEvent(event: StreamEvent): void {
    if (event.type === 'stream.online') {
      this.sessionStartedAt = event.startedAt;
      this.log('info', 'stream.online received — session started');
    } else {
      this.log('info', 'stream.offline received — finalizing session');
      this.stop();
    }
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
      // In live mode, actually perform the action via Twitch (best-effort).
      if (this.live) void this.applyLiveAction(intent);
    }
    this.log('action', `${meta.title} via AI Assistant — ${intent.target ?? 'channel'}`);
    return { intent, status: 'done', message: intent.reply };
  }

  /** Map a command intent to a Helix action and perform it via the connector. */
  private async applyLiveAction(intent: CommandIntent): Promise<void> {
    if (!this.connector) return;
    const target = intent.target;
    let action: HelixAction | null = null;
    if (intent.action === 'ban' && target) {
      const userId = await this.connector.resolveUserId(target);
      if (userId) action = { type: 'ban', userId, reason: intent.reason };
    } else if (intent.action === 'timeout' && target) {
      const userId = await this.connector.resolveUserId(target);
      if (userId)
        action = {
          type: 'timeout',
          userId,
          durationSeconds: intent.durationSeconds ?? 600,
          reason: intent.reason,
        };
    } else if (intent.action === 'unban' && target) {
      const userId = await this.connector.resolveUserId(target);
      if (userId) action = { type: 'unban', userId };
    } else if (intent.action === 'warn' && target) {
      const userId = await this.connector.resolveUserId(target);
      if (userId) action = { type: 'warn', userId, reason: intent.reason ?? 'Warning' };
    }
    if (!action) return;
    const res = await this.connector.perform(action);
    if (!res.ok) this.log('warn', `Twitch action ${intent.action} on ${target} did not apply`);
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
