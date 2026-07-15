import { describe, it, expect } from 'vitest';
import { interpretMessage, parseEnvelope } from './messages';

const env = (type: string, payload: Record<string, unknown> = {}) => ({
  metadata: { message_type: type },
  payload,
});

describe('interpretMessage', () => {
  it('extracts the session id from welcome', () => {
    const out = interpretMessage(env('session_welcome', { session: { id: 'sess-1' } }));
    expect(out).toEqual({ kind: 'welcome', sessionId: 'sess-1' });
  });

  it('recognizes keepalive', () => {
    expect(interpretMessage(env('session_keepalive')).kind).toBe('keepalive');
  });

  it('extracts the reconnect url', () => {
    const out = interpretMessage(
      env('session_reconnect', { session: { reconnect_url: 'wss://reconnect' } }),
    );
    expect(out).toEqual({ kind: 'reconnect', reconnectUrl: 'wss://reconnect' });
  });

  it('maps a stream.online notification with the start time', () => {
    const out = interpretMessage(
      env('notification', {
        subscription: { type: 'stream.online' },
        event: { started_at: '2026-07-14T22:00:00Z' },
      }),
    );
    expect(out.kind).toBe('notification');
    if (out.kind === 'notification' && out.event.type === 'stream.online') {
      expect(out.event.startedAt).toBe(Date.parse('2026-07-14T22:00:00Z'));
    } else {
      throw new Error('expected stream.online');
    }
  });

  it('maps a stream.offline notification', () => {
    const out = interpretMessage(
      env('notification', { subscription: { type: 'stream.offline' }, event: {} }),
    );
    expect(out).toEqual({ kind: 'notification', event: { type: 'stream.offline' } });
  });

  it('ignores unrelated notifications and unknown types', () => {
    expect(
      interpretMessage(env('notification', { subscription: { type: 'channel.follow' } })).kind,
    ).toBe('ignored');
    expect(interpretMessage(env('something_else')).kind).toBe('ignored');
  });
});

describe('parseEnvelope', () => {
  it('parses a valid envelope and rejects junk', () => {
    expect(
      parseEnvelope('{"metadata":{"message_type":"session_keepalive"},"payload":{}}'),
    ).not.toBeNull();
    expect(parseEnvelope('not json')).toBeNull();
    expect(parseEnvelope('{"nope":1}')).toBeNull();
  });
});
