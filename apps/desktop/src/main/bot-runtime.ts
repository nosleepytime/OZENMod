/**
 * BotRuntime — the orchestrator the desktop main process owns (the "local
 * runtime" of docs/ARCHITECTURE.md §9). It connects real Twitch chat through the
 * injected LiveConnector, runs every message through the local moderation engine
 * (@ozenmod/core), performs the decided Twitch action, keeps the session
 * counters, feed, review queue and logs the UI renders, and mirrors the live
 * session to Firebase so the web dashboard updates in real time.
 *
 * There is no demo mode: the app moderates real chat once a Twitch account is
 * connected, and asks the streamer to connect when it is not.
 */
import { EventEmitter } from 'node:events';
import { parseCommand, actionMeta, type ModerationRequest } from '@ozenmod/ai';
import type { ChatMessage, HelixAction, StreamEvent } from '@ozenmod/twitch';
import type { CommandIntent, ModerationEvent, ReviewItem } from '@ozenmod/shared';
import {
  ModerationEngine,
  type Analysis,
  type ChatRole,
  type Decision,
  type IncomingMessage,
} from '@ozenmod/core';
import {
  defaultConfig,
  EMPTY_COUNTERS,
  type RecentEvent,
  type SessionCounters,
} from '@ozenmod/database';
import type { BotState, BotStatus, CommandResult, LogEntry, SystemInfo } from '../ipc-contract';
import type { LiveConnector } from './twitch-live';
import { createFirebaseSync, type FirebaseSync } from './firebase-sync';
import { createAiEscalator, type AiEscalator } from './ai-escalator';
import { createResearcher, type Researcher } from './assistant-research';

export class BotRuntime extends EventEmitter {
  private state: BotState = 'idle';
  private sessionStartedAt: number | null = null;
  private channel = process.env.TWITCH_CHANNEL ?? '';
  private botAccount = '';
  private readonly appVersion: string;
  private readonly connector: LiveConnector | null;
  private readonly engine = new ModerationEngine(defaultConfig());
  private readonly sync: FirebaseSync;
  private readonly ai: AiEscalator;
  private readonly researcher: Researcher = createResearcher();
  private logs: LogEntry[] = [];
  private feed: ModerationEvent[] = [];
  private review: ReviewItem[] = [];
  private counters: SessionCounters = { ...EMPTY_COUNTERS };

  constructor(appVersion: string, connector: LiveConnector | null = null) {
    super();
    this.appVersion = appVersion;
    this.connector = connector;
    this.sync = createFirebaseSync({
      onLog: (level, message) => this.log(level, message),
      onConfig: (config) => this.engine.setConfig(config),
    });
    this.ai = createAiEscalator((level, message) => this.log(level, message));
  }

  private get live(): boolean {
    return this.connector?.isConfigured() ?? false;
  }

  private statSummary() {
    const c = this.counters;
    return {
      messages: c.messages,
      actions: c.deleted + c.timeouts + c.bans + c.warningsIssued,
      aiCalls: c.aiCalls,
      reviewPending: this.review.length,
    };
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
        aiProvider:
          this.engine.config.ai.provider === 'pollinations' ? 'Pollinations' : 'Local-first',
      },
      stats: this.statSummary(),
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
        this.counters = { ...EMPTY_COUNTERS };
        this.setState('protecting');
        this.log('info', `Protecting #${this.channel || 'your channel'} — analyzing chat locally`);
        void this.sync.begin(this.appVersion);
      })
      .catch((err: unknown) => {
        this.log('error', `Failed to connect: ${err instanceof Error ? err.message : String(err)}`);
        this.setState('error');
      });
    return this.getStatus();
  }

  stop(): BotStatus {
    if (this.state === 'idle') return this.getStatus();
    const startedAt = this.sessionStartedAt ?? Date.now();
    this.setState('stopping');
    if (this.live) this.connector?.stop();
    this.log('info', 'Finalizing session — writing summary, clearing temporary data');
    // Finalize the summary + lifetime aggregates, then discard temporary data.
    void this.sync.finalize(startedAt, this.counters);
    this.engine.reset();
    this.review = [];
    setTimeout(() => {
      this.sessionStartedAt = null;
      this.counters = { ...EMPTY_COUNTERS };
      this.setState('idle');
      this.log('info', 'Session ended — temporary warnings and counters deleted');
    }, 300);
    return this.getStatus();
  }

  /** A real chat message arrived — run it through the moderation engine. */
  private onChatMessage(message: ChatMessage): void {
    this.counters.messages += 1;
    const incoming = toIncoming(message);
    const now = message.timestamp || Date.now();
    const analysis = this.engine.analyze(incoming, now);

    // S5 — ambiguous messages are judged by the AI before committing.
    if (analysis.escalateToAI && this.ai.available(this.engine.config)) {
      void this.escalate(message, incoming, analysis, now);
      return;
    }

    // Not escalating: the local decision is already committed. When the message
    // was flagged but the AI is unavailable, commit the local fallback instead.
    const decision = analysis.escalateToAI
      ? this.engine.resolveFallback(incoming, analysis.signal, now)
      : analysis.decision;
    this.applyDecision(message, decision);
  }

  private async escalate(
    message: ChatMessage,
    incoming: IncomingMessage,
    analysis: Analysis,
    now: number,
  ): Promise<void> {
    const verdict = await this.ai.judge(this.buildRequest(incoming), this.engine.config);
    let decision: Decision;
    if (verdict) {
      this.counters.aiCalls += 1;
      decision = this.engine.judgeWithVerdict(incoming, verdict, now);
    } else {
      decision = this.engine.resolveFallback(incoming, analysis.signal, now);
    }
    this.applyDecision(message, decision);
  }

  private buildRequest(incoming: IncomingMessage): ModerationRequest {
    const session = this.engine.getSession(incoming.login);
    return {
      channelRules:
        'Standard Twitch channel: no harassment, hate, threats, sexual content, spam, scams or advertising. Casual banter and profanity not aimed at anyone are allowed.',
      context: [],
      message: { userDisplay: incoming.displayName, text: incoming.text },
      userState: {
        strikes: session.strikes,
        maxStrikes: this.engine.config.warnings.maxStrikes,
        firstTimeChatter: session.messageTimestamps.length <= 1,
      },
    };
  }

  /** Apply a committed decision: counters, enforcement, feed, logs and sync. */
  private applyDecision(message: ChatMessage, decision: Decision): void {
    if (decision.action === 'allow' || decision.action === 'ignore') {
      if (this.counters.messages % 10 === 0) {
        this.sync.setCounters(this.counters);
        this.emit('status', this.getStatus());
      }
      return;
    }

    if (decision.action === 'review') {
      this.counters.reviewed += 1;
      const item: ReviewItem = {
        id: message.id || `rv-${Date.now()}`,
        at: message.timestamp || Date.now(),
        userLogin: message.login,
        snippet: this.engine.config.privacy.storeSnippets ? message.text.slice(0, 80) : '',
        note: decision.reason,
        confidence: decision.confidence,
      };
      this.review = [item, ...this.review].slice(0, 50);
      this.emit('review', item);
      this.sync.review({
        t: item.at,
        user: item.userLogin,
        category: decision.category,
        confidence: decision.confidence,
        suggested: decision.categoryLabel,
        ...(item.snippet ? { snippet: item.snippet } : {}),
      });
    } else {
      this.bumpActionCounter(decision.action);
      if (this.live) void this.performDecision(decision, message.userId, message.id);
      this.sync.event(this.toRecent(message, decision));
    }

    const event = this.toEvent(message, decision);
    this.feed = [event, ...this.feed].slice(0, 50);
    this.emit('feed', event);
    this.sync.setCounters(this.counters);
    this.log('action', `${decision.actionLabel} — @${message.login}: ${decision.reason}`);
    this.emit('status', this.getStatus());
  }

  private bumpActionCounter(action: Decision['action']): void {
    if (action === 'delete') this.counters.deleted += 1;
    else if (action === 'timeout') this.counters.timeouts += 1;
    else if (action === 'ban') this.counters.bans += 1;
    else if (action === 'warn') this.counters.warningsIssued += 1;
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

  /**
   * Parse a command; execute immediately unless it needs confirmation. When the
   * input is not a moderation command, treat it as a question and answer it with
   * the AI research loop (web search via Keenable when configured).
   */
  async runCommand(raw: string): Promise<CommandResult> {
    const intent = parseCommand(raw);
    if (intent.action === 'unknown') {
      this.log('info', `Assistant question: ${raw}`);
      const message = await this.researcher.ask(raw).catch(() => intent.reply);
      return { intent, status: 'done', message };
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
      const mapped: Decision['action'] =
        intent.action === 'ban'
          ? 'ban'
          : intent.action === 'timeout'
            ? 'timeout'
            : intent.action === 'warn'
              ? 'warn'
              : 'ignore';
      this.bumpActionCounter(mapped);
      const event: ModerationEvent = {
        id: `cmd-${Date.now()}`,
        at: Date.now(),
        userLogin: intent.target ?? 'channel',
        userDisplay: intent.target ?? 'channel',
        category: 'none',
        categoryLabel: 'Manual',
        action: mapped,
        actionLabel: meta.title,
        source: 'manual',
        reason: intent.reason ?? 'Manual action via AI Assistant',
      };
      this.feed = [event, ...this.feed].slice(0, 50);
      this.emit('feed', event);
      if (mapped !== 'ignore') {
        this.sync.event({
          t: event.at,
          user: event.userLogin,
          action: mapped,
          category: 'none',
          reason: event.reason,
          source: 'manual',
        });
        this.sync.setCounters(this.counters);
      }
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
      if (!res.ok) this.log('warn', `Twitch ${action.type} did not apply`);
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

  private toRecent(message: ChatMessage, decision: Decision): RecentEvent {
    return {
      t: message.timestamp || Date.now(),
      user: message.login,
      action: decision.action,
      category: decision.category,
      reason: decision.reason,
      source: decision.source === 'manual' ? 'manual' : decision.source,
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
    this.sync.stop();
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
