/**
 * A minimal WebSocket abstraction so the IRC and EventSub clients can run
 * against the platform WebSocket in production (Node 22 / browsers) and against
 * a fake in tests. Only the members the clients use are declared.
 */
export interface WebSocketEventMap {
  open: undefined;
  close: { code: number; reason: string };
  error: unknown;
  message: { data: unknown };
}

export interface WebSocketLike {
  send(data: string): void;
  close(code?: number, reason?: string): void;
  addEventListener<K extends keyof WebSocketEventMap>(
    type: K,
    listener: (ev: WebSocketEventMap[K]) => void,
  ): void;
}

export type WebSocketFactory = (url: string) => WebSocketLike;

/** Default factory using the global WebSocket (available in Node 22+ and browsers). */
export const defaultWebSocketFactory: WebSocketFactory = (url) => {
  const Ctor = (globalThis as { WebSocket?: new (url: string) => WebSocketLike }).WebSocket;
  if (!Ctor) {
    throw new Error(
      'No global WebSocket available. Provide a WebSocketFactory (e.g. the "ws" package) in options.',
    );
  }
  return new Ctor(url);
};
