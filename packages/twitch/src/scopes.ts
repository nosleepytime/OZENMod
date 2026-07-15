/**
 * Minimal Twitch scopes the bot requests (docs/ARCHITECTURE.md §5.2). The app
 * asks for nothing it does not use; re-consent is required if this list grows.
 */
export const TWITCH_SCOPES = [
  'chat:read',
  'chat:edit',
  'moderator:manage:chat_messages',
  'moderator:manage:banned_users',
  'moderator:manage:warnings',
  'moderator:read:chatters',
] as const;

export type TwitchScope = (typeof TWITCH_SCOPES)[number];

/** Which scope each moderation action requires (for pre-flight permission checks). */
export const ACTION_SCOPES: Record<string, TwitchScope> = {
  delete: 'moderator:manage:chat_messages',
  timeout: 'moderator:manage:banned_users',
  ban: 'moderator:manage:banned_users',
  unban: 'moderator:manage:banned_users',
  warn: 'moderator:manage:warnings',
};
