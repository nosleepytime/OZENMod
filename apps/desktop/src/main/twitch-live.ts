/**
 * LiveConnector — bridges the real Twitch integration (@ozenmod/twitch) to the
 * BotRuntime. When the app is configured (a Twitch client id in the environment
 * and stored tokens), `createLiveConnector` returns a connector that opens a
 * TwitchChatSession; otherwise it returns a null connector and the runtime asks
 * the streamer to connect. The moderation engine (@ozenmod/core) runs inside the
 * BotRuntime between the incoming chat this delivers and the action performed.
 */
import type { ChatMessage, HelixAction, StreamEvent, TwitchTokens } from '@ozenmod/twitch';
import { TwitchChatSession, validateToken } from '@ozenmod/twitch';
import { loadTokens, saveTokens } from './token-vault';

export interface LiveHandlers {
  onMessage: (message: ChatMessage) => void;
  onStreamEvent: (event: StreamEvent) => void;
  onLog: (level: 'info' | 'warn' | 'error', message: string) => void;
}

export interface LiveConnector {
  isConfigured(): boolean;
  start(handlers: LiveHandlers): Promise<void>;
  stop(): void;
  perform(action: HelixAction): Promise<{ ok: boolean }>;
  resolveUserId(login: string): Promise<string | null>;
  say(text: string): void;
}

/** Null connector — used when Twitch is not configured; the runtime asks to connect. */
const nullConnector: LiveConnector = {
  isConfigured: () => false,
  start: async () => {},
  stop: () => {},
  perform: async () => ({ ok: false }),
  resolveUserId: async () => null,
  say: () => {},
};

interface LiveConfig {
  clientId: string;
  tokens: TwitchTokens;
}

function readConfig(): LiveConfig | null {
  const clientId = process.env.TWITCH_CLIENT_ID;
  if (!clientId) return null;
  const tokens = loadTokens();
  if (!tokens) return null;
  return { clientId, tokens };
}

export function createLiveConnector(): LiveConnector {
  const config = readConfig();
  if (!config) return nullConnector;

  let session: TwitchChatSession | null = null;

  return {
    isConfigured: () => true,

    async start(handlers: LiveHandlers) {
      // Resolve identity + channel/broadcaster from the validated token.
      const identity = await validateToken(
        { clientId: config.clientId },
        config.tokens.accessToken,
      );
      if (!identity) {
        handlers.onLog('error', 'Twitch token invalid — please reconnect in Settings');
        return;
      }
      session = new TwitchChatSession({
        clientId: config.clientId,
        channel: process.env.TWITCH_CHANNEL ?? identity.login,
        botLogin: identity.login,
        broadcasterId: identity.userId,
        tokens: config.tokens,
        saveTokens,
        onMessage: handlers.onMessage,
        onStreamEvent: handlers.onStreamEvent,
        onLog: handlers.onLog,
      });
      await session.start();
      handlers.onLog('info', `Connected to Twitch as ${identity.login}`);
    },

    stop() {
      session?.stop();
      session = null;
    },

    async perform(action: HelixAction) {
      if (!session) return { ok: false };
      const res = await session.perform(action);
      return { ok: res.ok };
    },

    resolveUserId(login: string) {
      return session ? session.resolveUserId(login) : Promise.resolve(null);
    },

    say(text: string) {
      session?.say(text);
    },
  };
}
