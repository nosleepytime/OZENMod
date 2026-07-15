/**
 * Twitch IRCv3 message parser. Pure and fully unit-tested — the rest of the IRC
 * client is thin I/O around this. Reference: the IRCv3 message-tags grammar as
 * used by Twitch (tmi.twitch.tv).
 */
import type { ChatMessage } from '../types';

export interface IrcMessage {
  raw: string;
  tags: Record<string, string>;
  /** Prefix nick (e.g. "user" from "user!user@user.tmi.twitch.tv"), if present. */
  nick?: string;
  command: string;
  params: string[];
}

/** Unescape an IRCv3 tag value (\s → space, \: → ;, \\ → \, \r \n). */
function unescapeTagValue(value: string): string {
  let out = '';
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (ch === '\\' && i + 1 < value.length) {
      const next = value[++i];
      out +=
        next === 's' ? ' ' : next === ':' ? ';' : next === 'r' ? '\r' : next === 'n' ? '\n' : next!;
    } else {
      out += ch;
    }
  }
  return out;
}

function parseTags(segment: string): Record<string, string> {
  const tags: Record<string, string> = {};
  for (const pair of segment.split(';')) {
    if (!pair) continue;
    const eq = pair.indexOf('=');
    if (eq === -1) {
      tags[pair] = '';
    } else {
      tags[pair.slice(0, eq)] = unescapeTagValue(pair.slice(eq + 1));
    }
  }
  return tags;
}

/** Parse a single raw IRC line into its structural parts. */
export function parseIrcMessage(line: string): IrcMessage {
  const raw = line;
  let rest = line.replace(/\r?\n$/, '');
  let tags: Record<string, string> = {};
  let nick: string | undefined;

  if (rest.startsWith('@')) {
    const sp = rest.indexOf(' ');
    tags = parseTags(rest.slice(1, sp));
    rest = rest.slice(sp + 1);
  }

  if (rest.startsWith(':')) {
    const sp = rest.indexOf(' ');
    const prefix = rest.slice(1, sp);
    const bang = prefix.indexOf('!');
    nick = bang === -1 ? prefix : prefix.slice(0, bang);
    rest = rest.slice(sp + 1);
  }

  // Command + params. A trailing param begins with " :".
  const params: string[] = [];
  let command = '';
  const trailingIdx = rest.indexOf(' :');
  let head = rest;
  let trailing: string | undefined;
  if (trailingIdx !== -1) {
    head = rest.slice(0, trailingIdx);
    trailing = rest.slice(trailingIdx + 2);
  } else if (rest.startsWith(':')) {
    // Message with only a trailing param.
    trailing = rest.slice(1);
    head = '';
  }
  const parts = head.split(' ').filter(Boolean);
  command = parts.shift() ?? '';
  params.push(...parts);
  if (trailing !== undefined) params.push(trailing);

  return { raw, tags, nick, command, params };
}

function tagTrue(tags: Record<string, string>, key: string): boolean {
  return tags[key] === '1';
}

/** Count emotes from the `emotes` tag (e.g. "25:0-4,6-10/1902:12-16"). */
export function countEmotes(emotesTag: string | undefined): number {
  if (!emotesTag) return 0;
  let count = 0;
  for (const group of emotesTag.split('/')) {
    if (!group) continue;
    const colon = group.indexOf(':');
    if (colon === -1) continue;
    count += group
      .slice(colon + 1)
      .split(',')
      .filter(Boolean).length;
  }
  return count;
}

/**
 * Convert a PRIVMSG IrcMessage into a domain ChatMessage. Returns null for any
 * non-PRIVMSG line (PING, JOIN, NOTICE, USERNOTICE, …).
 */
export function toChatMessage(msg: IrcMessage): ChatMessage | null {
  if (msg.command !== 'PRIVMSG') return null;
  const channel = (msg.params[0] ?? '').replace(/^#/, '');
  const text = msg.params[1] ?? '';
  const tags = msg.tags;
  const badges = tags['badges'] ?? '';
  const login = msg.nick ?? tags['login'] ?? '';

  return {
    id: tags['id'] ?? '',
    channel,
    userId: tags['user-id'] ?? '',
    login,
    displayName: tags['display-name'] || login,
    text,
    color: tags['color'] || undefined,
    isBroadcaster: /(^|,)broadcaster\//.test(badges),
    isModerator: tagTrue(tags, 'mod') || /(^|,)moderator\//.test(badges),
    isVip: /(^|,)vip\//.test(badges) || tags['vip'] === '1',
    isSubscriber: tagTrue(tags, 'subscriber') || /(^|,)subscriber\//.test(badges),
    emoteCount: countEmotes(tags['emotes']),
    timestamp: tags['tmi-sent-ts'] ? Number(tags['tmi-sent-ts']) : Date.now(),
  };
}
