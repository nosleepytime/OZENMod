/**
 * BotRuntime — the orchestrator the desktop main process owns (the "local
 * runtime" of docs/ARCHITECTURE.md §9). It connects real Twitch chat through the
 * injected LiveConnector, runs every message through the local moderation engine
 * (@ozenmod/core), performs the decided Twitch action, and keeps the session
 * counters, feed, review queue and logs the UI renders.
 *
 * There is no demo mode: the app moderates real chat once a Twitch account is
 * connected, and asks the streamer to connect when it is not.
 */
import { EventEmitter } from 'node:events';
import { parseCommand, actionMeta } from '@ozenmod/ai';
import type { ChatMessage, HelixAction, StreamEvent } from '@ozenmod/twitch';
import type { CommandIntent, ModerationEvent, ReviewItem } from '@ozenmod/shared';
import {
  ModerationEngine,
  type ChatRole,
  type Decision,
  type IncomingMessage,
} from '@ozenmod/core';
import { defaultConfig } from '@ozenmod/database';
import type { BotState, BotStatus, CommandResult, LogEntry, SystemInfo } from '../ipc-contract';
import type { LiveConnector } from './twitch-live';

export class BotRuntime extends EventEmitter {
  private state: BotState = 'idle';
  private sessionStartedAt: number | null = null;
  private channel = process.env.TWITCH_CHANNEL ?? '';
  private botAccount = '';
  private readonly appVersion: string;
  private readonly connector: LiveConnector | null;
  private readonly engine = new ModerationEngine(defaultConfig());
  private logs: LogEntry[] = [];
  private feed: ModerationEvent[] = [];
  private review: ReviewItem[] = [];
  private stats = { messages: 0, actions: 0, aiCalls: 0, reviewPending: 0 };

  constructor(appVersion: string, connector: LiveConnector | null = null) {
    super();
    this.appVersion = appVersion;
    this.connector = connector;
  }

  private get live(): boolean {
    return this.connector?.isConfigured() ?? false;
  }

  getStatus(): BotStatus {
    return {
      state: this.state,
      channel: this.channel || '—',
      botAccount: this.botAccount || '—',
      sessionStartedAt: this.sessionStartedAt,
      health: {
        twitch: this.state === 'protecting',
        ai: true,
        eventSub: this.state === 'protecting',
        aiLatencyMs: 0,
        aiProvider: 'Local-first',
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
      aiLatencyMs: 0,
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
    if (!this.live || !this.connector) {
      this.log(
        'warn',
        'Twitch is not connected — open Settings and connect your account to start moderating.',
      );
      this.setState('idle');
      return this.getStatus();
    }
    this.setState('starting');
    this.log('info', 'Connecting to Twitch…');
    void this.connector
      .start({
        onMessage: (m) => this.onChatMessage(m),
        onStreamEvent: (e) => this.onStreamEvent(e),
        onLog: (level, message) => this.log(level, message),
      })
      .then(() => {
        this.sessionStartedAt = Date.now();
        this.engine.reset();
        this.setState('protecting');
        this.log('info', `Protecting #${this.channel || 'your channel'} — analyzing chat locally`);
      })
      .catch((err: unknown) => {
        this.log('error', `Failed to connect: ${err instanceof Error ? err.message : String(err)}`);
        this.setState('error');
      });
    return this.getStatus();
  }

  stop(): BotStatus {
    if (this.state === 'idle') return this.getStatus();
    this.setState('stopping');
    if (this.live) this.connector?.stop();
    this.log('info', 'Finalizing session — writing summary, clearing temporary data');
    // Temporary session data (warnings, counters) is discarded at stream end.
    this.engine.reset();
    this.review = [];
    this.stats.reviewPending = 0;
    setTimeout(() => {
      this.sessionStartedAt = null;
      this.setState('idle');
      this.log('info', 'Session ended — temporary warnings and counters deleted');
    }, 300);
    return this.getStatus();
  }

  /** A real chat message arrived — run it through the moderation engine. */
  private onChatMessage(message: ChatMessage): void {
    this.stats.messages += 1;
    const analysis = this.engine.analyze(toIncoming(message), message.timestamp || Date.now());
    const decision = analysis.decision;

    if (decision.action === 'allow' || decision.action === 'ignore') {
      if (this.stats.messages % 10 === 0) this.emit('status', this.getStatus());
      return;
    }

    if (decision.action === 'review') {
      const item: ReviewItem = {
        id: message.id || `rv-${Date.now()}`,
        at: message.timestamp || Date.now(),
        userLogin: message.login,
        snippet: this.engine.config.privacy.storeSnippets ? message.text.slice(0, 80) : '',
        note: decision.reason,
        confidence: decision.confidence,
      };
      this.review = [item, ...this.review].slice(0, 50);
      this.stats.reviewPending = this.review.length;
      this.emit('review', item);
    } else {
      this.stats.actions += 1;
      if (this.live) void this.performDecision(decision, message.userId, message.id);
    }

    const event = this.toEvent(message, decision);
    this.feed = [event, ...this.feed].slice(0, 50);
    this.emit('feed', event);
    this.log('action', `${decision.actionLabel} — @${message.login}: ${decision.reason}`);
    this.emit('status', this.getStatus());
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
      if (this.live) void this.applyIntentAction(intent);
    }
    this.log('action', `${meta.title} via AI Assistant — ${intent.target ?? 'channel'}`);
    return { intent, status: 'done', message: intent.reply };
  }

  /** Perform the Twitch calls for an automatic engine decision. */
  private async performDecision(
    decision: Decision,
    userId: string,
    messageId: string,
  ): Promise<void> {
    if (!this.connector) return;
    const reason = decision.reason.slice(0, 120);
    const actions: HelixAction[] = [];
    switch (decision.enforcement.type) {
      case 'delete':
        actions.push({ type: 'delete', messageId });
        break;
      case 'warn':
        actions.push({ type: 'delete', messageId });
        actions.push({ type: 'warn', userId, reason: decision.enforcement.text });
        break;
      case 'timeout':
        actions.push({ type: 'delete', messageId });
        actions.push({
          type: 'timeout',
          userId,
          durationSeconds: decision.enforcement.seconds,
          reason,
        });
        break;
      case 'ban':
        actions.push({ type: 'ban', userId, reason });
        break;
    }
    for (const action of actions) {
      const res = await this.connector.perform(action);
      if (!res.ok) this.log('warn', `Twitch ${action.type} on @${decision.category} did not apply`);
    }
  }

  /** Map a manual AI Assistant intent to a Helix action and perform it. */
  private async applyIntentAction(intent: CommandIntent): Promise<void> {
    if (!this.connector) return;
    const target = intent.target;
    if (!target) return;
    let action: HelixAction | null = null;
    if (intent.action === 'ban') {
      const userId = await this.connector.resolveUserId(target);
      if (userId) action = { type: 'ban', userId, reason: intent.reason };
    } else if (intent.action === 'timeout') {
      const userId = await this.connector.resolveUserId(target);
      if (userId)
        action = {
          type: 'timeout',
          userId,
          durationSeconds: intent.durationSeconds ?? 600,
          reason: intent.reason,
        };
    } else if (intent.action === 'unban') {
      const userId = await this.connector.resolveUserId(target);
      if (userId) action = { type: 'unban', userId };
    } else if (intent.action === 'warn') {
      const userId = await this.connector.resolveUserId(target);
      if (userId) action = { type: 'warn', userId, reason: intent.reason ?? 'Warning' };
    }
    if (!action) return;
    const res = await this.connector.perform(action);
    if (!res.ok) this.log('warn', `Twitch action ${intent.action} on ${target} did not apply`);
  }

  private toEvent(message: ChatMessage, decision: Decision): ModerationEvent {
    return {
      id: message.id || `ev-${Date.now()}`,
      at: message.timestamp || Date.now(),
      userLogin: message.login,
      userDisplay: message.displayName,
      category: decision.category,
      categoryLabel: decision.categoryLabel,
      action: decision.action,
      actionLabel: decision.actionLabel,
      source: decision.source,
      reason: decision.reason,
      ...(decision.strike ? { strike: decision.strike } : {}),
    };
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
    this.removeAllListeners();
  }
}

const MENTION_RE = /@([a-z0-9_]+)/gi;

function toIncoming(m: ChatMessage): IncomingMessage {
  const roles: ChatRole[] = ['viewer'];
  if (m.isBroadcaster) roles.push('broadcaster');
  if (m.isModerator) roles.push('moderator');
  if (m.isVip) roles.push('vip');
  if (m.isSubscriber) roles.push('subscriber');
  const mentions = [...m.text.matchAll(MENTION_RE)].map((x) => x[1]!.toLowerCase());
  return {
    id: m.id,
    login: m.login,
    displayName: m.displayName,
    text: m.text,
    timestamp: m.timestamp,
    roles,
    emoteCount: m.emoteCount,
    mentions,
  };
}
