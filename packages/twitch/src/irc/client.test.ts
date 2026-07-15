import { describe, it, expect, vi } from 'vitest';
import { IrcClient } from './client';
import type { WebSocketEventMap, WebSocketLike } from '../websocket';

/** A controllable fake WebSocket that records sent frames and lets tests emit. */
class FakeWebSocket implements WebSocketLike {
  sent: string[] = [];
  private handlers: Record<string, ((ev: unknown) => void)[]> = {};
  send(data: string) {
    this.sent.push(data);
  }
  close() {
    this.emit('close', { code: 1000, reason: '' });
  }
  addEventListener<K extends keyof WebSocketEventMap>(
    type: K,
    cb: (ev: WebSocketEventMap[K]) => void,
  ) {
    (this.handlers[type] ??= []).push(cb as (ev: unknown) => void);
  }
  emit(type: string, ev?: unknown) {
    for (const cb of this.handlers[type] ?? []) cb(ev);
  }
  open() {
    this.emit('open');
  }
  message(data: string) {
    this.emit('message', { data });
  }
}

describe('IrcClient', () => {
  it('authenticates and joins on open', async () => {
    const ws = new FakeWebSocket();
    const client = new IrcClient({
      channel: 'PixelForge',
      nick: 'OZENMod_Bot',
      getAccessToken: () => 'abc123',
      webSocketFactory: () => ws,
      onMessage: () => {},
    });
    await client.connect();
    ws.open();
    expect(ws.sent[0]).toBe('CAP REQ :twitch.tv/tags twitch.tv/commands');
    expect(ws.sent).toContain('PASS oauth:abc123');
    expect(ws.sent).toContain('NICK ozenmod_bot');
    expect(ws.sent).toContain('JOIN #pixelforge');
  });

  it('answers PING with PONG', async () => {
    const ws = new FakeWebSocket();
    const client = new IrcClient({
      channel: 'c',
      nick: 'b',
      getAccessToken: () => 't',
      webSocketFactory: () => ws,
      onMessage: () => {},
    });
    await client.connect();
    ws.open();
    ws.message('PING :tmi.twitch.tv\r\n');
    expect(ws.sent).toContain('PONG :tmi.twitch.tv');
  });

  it('emits a ChatMessage for a PRIVMSG', async () => {
    const ws = new FakeWebSocket();
    const onMessage = vi.fn();
    const client = new IrcClient({
      channel: 'c',
      nick: 'b',
      getAccessToken: () => 't',
      webSocketFactory: () => ws,
      onMessage,
    });
    await client.connect();
    ws.open();
    ws.message(
      '@badges=;display-name=Viewer;id=x1;user-id=9 :viewer!viewer@viewer PRIVMSG #c :hello there\r\n',
    );
    expect(onMessage).toHaveBeenCalledTimes(1);
    expect(onMessage.mock.calls[0]![0].text).toBe('hello there');
    expect(onMessage.mock.calls[0]![0].displayName).toBe('Viewer');
  });

  it('handles multiple lines in one frame', async () => {
    const ws = new FakeWebSocket();
    const onMessage = vi.fn();
    const client = new IrcClient({
      channel: 'c',
      nick: 'b',
      getAccessToken: () => 't',
      webSocketFactory: () => ws,
      onMessage,
    });
    await client.connect();
    ws.open();
    ws.message(
      '@id=1;user-id=1 :a!a@a PRIVMSG #c :one\r\n@id=2;user-id=2 :b!b@b PRIVMSG #c :two\r\n',
    );
    expect(onMessage).toHaveBeenCalledTimes(2);
  });

  it('says a message to the channel', async () => {
    const ws = new FakeWebSocket();
    const client = new IrcClient({
      channel: 'PixelForge',
      nick: 'b',
      getAccessToken: () => 't',
      webSocketFactory: () => ws,
      onMessage: () => {},
    });
    await client.connect();
    ws.open();
    client.say('@user warning 1/3: be nice');
    expect(ws.sent).toContain('PRIVMSG #pixelforge :@user warning 1/3: be nice');
  });
});
