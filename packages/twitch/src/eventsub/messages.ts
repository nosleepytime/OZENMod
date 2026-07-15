/**
 * Pure handling of EventSub WebSocket messages (docs/ARCHITECTURE.md §5.3).
 * The client is thin I/O around interpretMessage(), which classifies each frame
 * so the transport layer knows what to do (store session id, resubscribe,
 * emit a stream event, reconnect).
 */
import type { StreamEvent } from '../types';

export interface EventSubEnvelope {
  metadata: { message_type: string; message_id?: string };
  payload: Record<string, unknown>;
}

export type EventSubOutcome =
  | { kind: 'welcome'; sessionId: string }
  | { kind: 'keepalive' }
  | { kind: 'reconnect'; reconnectUrl: string }
  | { kind: 'revocation'; subscriptionType: string }
  | { kind: 'notification'; event: StreamEvent }
  | { kind: 'ignored' };

/** Classify one parsed EventSub message. */
export function interpretMessage(env: EventSubEnvelope): EventSubOutcome {
  const type = env.metadata.message_type;

  if (type === 'session_welcome') {
    const session = env.payload['session'] as { id?: string } | undefined;
    return { kind: 'welcome', sessionId: session?.id ?? '' };
  }
  if (type === 'session_keepalive') {
    return { kind: 'keepalive' };
  }
  if (type === 'session_reconnect') {
    const session = env.payload['session'] as { reconnect_url?: string } | undefined;
    return { kind: 'reconnect', reconnectUrl: session?.reconnect_url ?? '' };
  }
  if (type === 'revocation') {
    const sub = env.payload['subscription'] as { type?: string } | undefined;
    return { kind: 'revocation', subscriptionType: sub?.type ?? '' };
  }
  if (type === 'notification') {
    const sub = env.payload['subscription'] as { type?: string } | undefined;
    const event = env.payload['event'] as { started_at?: string } | undefined;
    if (sub?.type === 'stream.online') {
      const startedAt = event?.started_at ? Date.parse(event.started_at) : Date.now();
      return { kind: 'notification', event: { type: 'stream.online', startedAt } };
    }
    if (sub?.type === 'stream.offline') {
      return { kind: 'notification', event: { type: 'stream.offline' } };
    }
    return { kind: 'ignored' };
  }
  return { kind: 'ignored' };
}

/** Parse a raw frame into an envelope, or null if malformed. */
export function parseEnvelope(raw: string): EventSubEnvelope | null {
  try {
    const obj = JSON.parse(raw) as EventSubEnvelope;
    if (obj && obj.metadata && typeof obj.metadata.message_type === 'string') return obj;
    return null;
  } catch {
    return null;
  }
}
