/** Twitch integration types (docs/ARCHITECTURE.md §5). Framework-free. */

/** OAuth tokens for a Twitch identity. */
export interface TwitchTokens {
  accessToken: string;
  refreshToken: string;
  /** Unix epoch ms when the access token expires. */
  expiresAt: number;
  scopes: string[];
}

/** The authenticated Twitch user (from Helix /users). */
export interface TwitchUser {
  id: string;
  login: string;
  displayName: string;
  avatarUrl: string;
}

/** A parsed chat message with the moderation-relevant fields resolved. */
export interface ChatMessage {
  /** Twitch message id (needed to delete a single message). */
  id: string;
  channel: string;
  userId: string;
  login: string;
  displayName: string;
  /** Raw message text (emotes still present). */
  text: string;
  color?: string;
  isBroadcaster: boolean;
  isModerator: boolean;
  isVip: boolean;
  isSubscriber: boolean;
  /** Number of emotes Twitch tagged in the message (for spam heuristics). */
  emoteCount: number;
  /** Unix epoch ms from the tmi-sent-ts tag, or receipt time. */
  timestamp: number;
}

/** A moderation action the engine asks the Helix client to perform. */
export type HelixAction =
  | { type: 'delete'; messageId: string }
  | { type: 'timeout'; userId: string; durationSeconds: number; reason?: string }
  | { type: 'ban'; userId: string; reason?: string }
  | { type: 'unban'; userId: string }
  | { type: 'warn'; userId: string; reason: string };

/** Stream lifecycle events delivered by EventSub. */
export type StreamEvent = { type: 'stream.online'; startedAt: number } | { type: 'stream.offline' };

export interface ConnectionState {
  connected: boolean;
  reconnecting: boolean;
  lastError?: string;
}
