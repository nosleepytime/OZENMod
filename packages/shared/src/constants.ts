/** Product-wide constants. */

export const APP_NAME = 'OZENMod';
export const APP_TAGLINE = 'AI moderation that actually understands your chat.';
export const GITHUB_URL = 'https://github.com/nosleepytime/OZENMod';
export const RELEASES_URL = `${GITHUB_URL}/releases`;
export const DOCS_URL = `${GITHUB_URL}/tree/main/docs`;
export const ISSUES_URL = `${GITHUB_URL}/issues`;
export const DISCUSSIONS_URL = `${GITHUB_URL}/discussions`;

/** Minimal Twitch scopes the bot requests — see docs/ARCHITECTURE.md §5.2. */
export const TWITCH_SCOPES = [
  'chat:read',
  'chat:edit',
  'moderator:manage:chat_messages',
  'moderator:manage:banned_users',
  'moderator:manage:warnings',
  'moderator:read:chatters',
] as const;

/** Categories as shown in configuration UIs (order matters). */
export const CATEGORY_SETTINGS = [
  { id: 'harassment', label: 'Harassment & insults', threshold: 0.55, aiAssist: true },
  { id: 'hate', label: 'Hate & discrimination', threshold: 0.4, aiAssist: true },
  { id: 'threat', label: 'Threats & violence', threshold: 0.35, aiAssist: true },
  { id: 'sexual', label: 'Sexual content', threshold: 0.5, aiAssist: true },
  { id: 'spam', label: 'Spam & flood', threshold: 0.65, aiAssist: false },
  { id: 'scam', label: 'Scam & phishing', threshold: 0.45, aiAssist: true },
  { id: 'advertising', label: 'Advertising', threshold: 0.7, aiAssist: false },
  { id: 'toxicity', label: 'General toxicity', threshold: 0.6, aiAssist: true },
] as const;
