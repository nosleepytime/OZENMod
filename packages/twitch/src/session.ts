/**
 * TwitchChatSession — the orchestrator the desktop main process (and, later, a
 * hosted runtime) uses. It wires the TokenManager, Helix client, IRC client and
 * EventSub client together so callers deal with one object: start it, receive
 * chat messages and stream events, perform moderation actions, post warnings,
 * and stop it. The moderation engine (M5) sits between onMessage and perform().
 */
import type { ChatMessage, HelixAction, StreamEvent, TwitchTokens } from './types';
import { HelixClient, type HelixResult } from './helix/client';
import { IrcClient } from './irc/client';
import { EventSubClient, streamSubscriptionBody } from './eventsub/client';
import { TokenManager, type OAuthContext } from './oauth/tokens';
import type { WebSocketFactory } from './websocket';

export interface TwitchChatSessionOptions {
  clientId: string;
  channel: string;
  /** Login the bot posts as (the streamer or a dedicated bot account). */
  botLogin: string;
  broadcasterId: string;
  /** Moderator id for Helix actions; defaults to broadcasterId. */
  moderatorId?: string;
  tokens: TwitchTokens;
  /** Persist refreshed tokens (desktop app → OS keychain). */
  saveTokens: (tokens: TwitchTokens) => Promise<void> | void;

  onMessage: (message: ChatMessage) => void;
  onStreamEvent?: (event: StreamEvent) => void;
  onLog?: (level: 'info' | 'warn' | 'error', message: string) => void;

  // Injectable for tests.
  fetchImpl?: typeof fetch;
  webSocketFactory?: WebSocketFactory;
}

export class TwitchChatSession {
  private readonly opts: TwitchChatSessionOptions;
  private readonly tokens: TokenManager;
  private readonly helix: HelixClient;
  private readonly irc: IrcClient;
  private readonly eventSub: EventSubClient;

  constructor(opts: TwitchChatSessionOptions) {
    this.opts = opts;
    const ctx: OAuthContext = { clientId: opts.clientId, fetchImpl: opts.fetchImpl };
    this.tokens = new TokenManager(ctx, opts.tokens, opts.saveTokens);

    this.helix = new HelixClient({
      clientId: opts.clientId,
      getAccessToken: () => this.tokens.getAccessToken(),
      broadcasterId: opts.broadcasterId,
      moderatorId: opts.moderatorId,
      fetchImpl: opts.fetchImpl,
    });

    this.irc = new IrcClient({
      channel: opts.channel,
      nick: opts.botLogin,
      getAccessToken: () => this.tokens.getAccessToken(),
      webSocketFactory: opts.webSocketFactory,
      onMessage: opts.onMessage,
      onStateChange: (s) =>
        opts.onLog?.(
          'info',
          `IRC ${s.connected ? 'connected' : s.reconnecting ? 'reconnecting' : 'disconnected'}`,
        ),
    });

    this.eventSub = new EventSubClient({
      webSocketFactory: opts.webSocketFactory,
      onWelcome: (sessionId) => this.subscribeStreamEvents(sessionId),
      onStreamEvent: (event) => opts.onStreamEvent?.(event),
      onStateChange: (s) =>
        opts.onLog?.(
          'info',
          `EventSub ${s.connected ? 'connected' : s.reconnecting ? 'reconnecting' : 'disconnected'}`,
        ),
    });
  }

  async start(): Promise<void> {
    await this.irc.connect();
    this.eventSub.connect();
  }

  private async subscribeStreamEvents(sessionId: string): Promise<void> {
    if (!sessionId) return;
    for (const type of ['stream.online', 'stream.offline'] as const) {
      const res = await this.helix.subscribeEventSub(
        streamSubscriptionBody(type, this.opts.broadcasterId, sessionId),
      );
      if (!res.ok)
        this.opts.onLog?.('warn', `EventSub subscribe ${type} failed (HTTP ${res.status})`);
    }
    this.opts.onLog?.('info', 'EventSub subscribed: stream.online, stream.offline');
  }

  /** Execute a moderation action via Helix. */
  perform(action: HelixAction): Promise<HelixResult> {
    return this.helix.perform(action);
  }

  /** Resolve a chat login to a user id (for AI Assistant command targets). */
  async resolveUserId(login: string): Promise<string | null> {
    const [user] = await this.helix.getUsersByLogin([login]);
    return user?.id ?? null;
  }

  /** Post a public chat message (used for warnings). */
  say(text: string): void {
    this.irc.say(text);
  }

  stop(): void {
    this.irc.disconnect();
    this.eventSub.disconnect();
  }
}
