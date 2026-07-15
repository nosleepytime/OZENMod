/**
 * Twitch IRC client over WSS. Thin I/O around the pure parser: it authenticates,
 * requests the tags/commands capabilities, answers PING, emits ChatMessage for
 * each PRIVMSG, and reconnects with jittered backoff. The WebSocket is injected
 * (defaults to the platform WebSocket) so the client is testable.
 */
import type { ChatMessage } from '../types';
import { Backoff } from '../backoff';
import { defaultWebSocketFactory, type WebSocketFactory, type WebSocketLike } from '../websocket';
import { parseIrcMessage, toChatMessage } from './parse';

const IRC_URL = 'wss://irc-ws.chat.twitch.tv:443';

export interface IrcClientOptions {
  channel: string;
  nick: string;
  /** OAuth access token WITHOUT the "oauth:" prefix (added internally). */
  getAccessToken: () => Promise<string> | string;
  webSocketFactory?: WebSocketFactory;
  onMessage: (message: ChatMessage) => void;
  onStateChange?: (state: { connected: boolean; reconnecting: boolean }) => void;
  onSystem?: (line: string) => void;
}

export class IrcClient {
  private ws: WebSocketLike | null = null;
  private readonly opts: IrcClientOptions;
  private readonly factory: WebSocketFactory;
  private readonly backoff = new Backoff({ baseMs: 1000, maxMs: 30_000 });
  private closedByUser = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(opts: IrcClientOptions) {
    this.opts = opts;
    this.factory = opts.webSocketFactory ?? defaultWebSocketFactory;
  }

  async connect(): Promise<void> {
    this.closedByUser = false;
    const token = await this.opts.getAccessToken();
    const ws = this.factory(IRC_URL);
    this.ws = ws;

    ws.addEventListener('open', () => {
      ws.send('CAP REQ :twitch.tv/tags twitch.tv/commands');
      ws.send(`PASS oauth:${token}`);
      ws.send(`NICK ${this.opts.nick.toLowerCase()}`);
      ws.send(`JOIN #${this.opts.channel.toLowerCase()}`);
      this.backoff.reset();
      this.opts.onStateChange?.({ connected: true, reconnecting: false });
    });

    ws.addEventListener('message', (ev) => this.onData(String(ev.data)));

    ws.addEventListener('close', () => {
      this.opts.onStateChange?.({ connected: false, reconnecting: !this.closedByUser });
      if (!this.closedByUser) this.scheduleReconnect();
    });

    ws.addEventListener('error', () => {
      // A close event follows; reconnection is handled there.
    });
  }

  private onData(raw: string): void {
    // A single frame may contain multiple CRLF-separated lines.
    for (const line of raw.split('\r\n')) {
      if (!line) continue;
      const msg = parseIrcMessage(line);
      if (msg.command === 'PING') {
        this.ws?.send(`PONG :${msg.params[0] ?? 'tmi.twitch.tv'}`);
        continue;
      }
      if (msg.command === 'PRIVMSG') {
        const chat = toChatMessage(msg);
        if (chat) this.opts.onMessage(chat);
        continue;
      }
      this.opts.onSystem?.(line);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    const delay = this.backoff.next();
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connect();
    }, delay);
  }

  /** Post a chat message (used for public warnings). */
  say(text: string): void {
    this.ws?.send(`PRIVMSG #${this.opts.channel.toLowerCase()} :${text}`);
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
