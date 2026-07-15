/**
 * EventSub WebSocket client. Connects, captures the session id from the welcome
 * frame, asks the caller to create the subscriptions (via Helix, done in the
 * orchestrator), forwards stream.online/offline events, and follows reconnect
 * frames. Backoff handles unexpected drops. WebSocket is injected for tests.
 */
import type { StreamEvent } from '../types';
import { Backoff } from '../backoff';
import { defaultWebSocketFactory, type WebSocketFactory, type WebSocketLike } from '../websocket';
import { interpretMessage, parseEnvelope } from './messages';

const EVENTSUB_URL = 'wss://eventsub.wss.twitch.tv/ws';

export interface EventSubClientOptions {
  webSocketFactory?: WebSocketFactory;
  /** Called with the session id so the caller can create subscriptions via Helix. */
  onWelcome: (sessionId: string) => void | Promise<void>;
  onStreamEvent: (event: StreamEvent) => void;
  onStateChange?: (state: { connected: boolean; reconnecting: boolean }) => void;
}

export class EventSubClient {
  private ws: WebSocketLike | null = null;
  private readonly opts: EventSubClientOptions;
  private readonly factory: WebSocketFactory;
  private readonly backoff = new Backoff({ baseMs: 1000, maxMs: 30_000 });
  private closedByUser = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(opts: EventSubClientOptions) {
    this.opts = opts;
    this.factory = opts.webSocketFactory ?? defaultWebSocketFactory;
  }

  connect(url: string = EVENTSUB_URL): void {
    this.closedByUser = false;
    const ws = this.factory(url);
    this.ws = ws;

    ws.addEventListener('open', () => {
      this.backoff.reset();
      this.opts.onStateChange?.({ connected: true, reconnecting: false });
    });

    ws.addEventListener('message', (ev) => this.onData(String(ev.data)));

    ws.addEventListener('close', () => {
      this.opts.onStateChange?.({ connected: false, reconnecting: !this.closedByUser });
      if (!this.closedByUser) this.scheduleReconnect(EVENTSUB_URL);
    });

    ws.addEventListener('error', () => {
      // Handled by the close event.
    });
  }

  /** Exposed for tests / the orchestrator to feed a raw frame. */
  onData(raw: string): void {
    const env = parseEnvelope(raw);
    if (!env) return;
    const outcome = interpretMessage(env);
    switch (outcome.kind) {
      case 'welcome':
        void this.opts.onWelcome(outcome.sessionId);
        break;
      case 'reconnect':
        // Twitch keeps the old socket alive until the new one welcomes us.
        this.closedByUser = true;
        this.ws?.close();
        this.closedByUser = false;
        this.connect(outcome.reconnectUrl);
        break;
      case 'notification':
        this.opts.onStreamEvent(outcome.event);
        break;
      case 'keepalive':
      case 'revocation':
      case 'ignored':
        break;
    }
  }

  private scheduleReconnect(url: string): void {
    if (this.reconnectTimer) return;
    const delay = this.backoff.next();
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect(url);
    }, delay);
  }

  disconnect(): void {
    this.closedByUser = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }
}

/** Build the Helix request body to subscribe to a stream event over WebSocket. */
export function streamSubscriptionBody(
  type: 'stream.online' | 'stream.offline',
  broadcasterId: string,
  sessionId: string,
): Record<string, unknown> {
  return {
    type,
    version: '1',
    condition: { broadcaster_user_id: broadcasterId },
    transport: { method: 'websocket', session_id: sessionId },
  };
}
