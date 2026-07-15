import { describe, it, expect } from 'vitest';
import { parseIrcMessage, toChatMessage, countEmotes } from './parse';

describe('parseIrcMessage', () => {
  it('parses a full tagged PRIVMSG', () => {
    const line =
      '@badge-info=;badges=broadcaster/1;color=#0000FF;display-name=PixelForge;emotes=;id=abc-123;mod=0;room-id=1;subscriber=0;tmi-sent-ts=1700000000000;user-id=42;user-type= :pixelforge!pixelforge@pixelforge.tmi.twitch.tv PRIVMSG #pixelforge :Hello world';
    const msg = parseIrcMessage(line);
    expect(msg.command).toBe('PRIVMSG');
    expect(msg.nick).toBe('pixelforge');
    expect(msg.params[0]).toBe('#pixelforge');
    expect(msg.params[1]).toBe('Hello world');
    expect(msg.tags['display-name']).toBe('PixelForge');
    expect(msg.tags['id']).toBe('abc-123');
  });

  it('preserves colons inside the trailing message', () => {
    const line = ':u!u@u.tmi.twitch.tv PRIVMSG #c :check this http://example.com : cool';
    const msg = parseIrcMessage(line);
    expect(msg.params[1]).toBe('check this http://example.com : cool');
  });

  it('unescapes IRCv3 tag values', () => {
    const line = '@display-name=A\\sB;custom=x\\:y :u!u@u PRIVMSG #c :hi';
    const msg = parseIrcMessage(line);
    expect(msg.tags['display-name']).toBe('A B');
    expect(msg.tags['custom']).toBe('x;y');
  });

  it('parses PING with a trailing param', () => {
    const msg = parseIrcMessage('PING :tmi.twitch.tv');
    expect(msg.command).toBe('PING');
    expect(msg.params[0]).toBe('tmi.twitch.tv');
  });
});

describe('countEmotes', () => {
  it('counts emotes across groups and ranges', () => {
    expect(countEmotes('25:0-4,6-10/1902:12-16')).toBe(3);
    expect(countEmotes('')).toBe(0);
    expect(countEmotes(undefined)).toBe(0);
  });
});

describe('toChatMessage', () => {
  it('resolves broadcaster and mod flags from badges', () => {
    const msg = parseIrcMessage(
      '@badges=broadcaster/1;display-name=Streamer;id=m1;user-id=7;mod=0 :streamer!streamer@streamer PRIVMSG #streamer :gg',
    );
    const chat = toChatMessage(msg)!;
    expect(chat.isBroadcaster).toBe(true);
    expect(chat.isModerator).toBe(false);
    expect(chat.channel).toBe('streamer');
    expect(chat.text).toBe('gg');
    expect(chat.displayName).toBe('Streamer');
  });

  it('detects a moderator via the mod tag', () => {
    const msg = parseIrcMessage(
      '@badges=moderator/1;mod=1;display-name=Mod;id=m2;user-id=8 :mod!mod@mod PRIVMSG #c :cleaning up',
    );
    const chat = toChatMessage(msg)!;
    expect(chat.isModerator).toBe(true);
  });

  it('detects VIP and subscriber', () => {
    const msg = parseIrcMessage(
      '@badges=vip/1,subscriber/12;subscriber=1;display-name=Fan;id=m3;user-id=9 :fan!fan@fan PRIVMSG #c :love this',
    );
    const chat = toChatMessage(msg)!;
    expect(chat.isVip).toBe(true);
    expect(chat.isSubscriber).toBe(true);
  });

  it('returns null for non-PRIVMSG commands', () => {
    expect(toChatMessage(parseIrcMessage('PING :tmi.twitch.tv'))).toBeNull();
    expect(toChatMessage(parseIrcMessage(':tmi.twitch.tv 001 bot :Welcome'))).toBeNull();
  });
});
