/**
 * S2 — Deterministic rules. Hard, instant checks that do not need scoring:
 * streamer banned terms, link policy, flood/rate, duplicates and composition
 * (caps / emotes). Returns the highest-priority hard signal, or null when the
 * message is clean of deterministic hits. Pure and synchronous.
 *
 * See docs/MODERATION.md §3 (S2).
 */
import type { ChannelConfig } from '@ozenmod/database';
import type { IncomingMessage, Signal, UserSession } from './types';
import type { NormalizedText } from './normalize';
import { containsTerm } from './normalize';

const SHORTENERS = [
  'bit.ly',
  'tinyurl.com',
  'goo.gl',
  't.co',
  'ow.ly',
  'is.gd',
  'buff.ly',
  'cutt.ly',
  'rb.gy',
  'shorturl.at',
  'discord.gg',
];
const SUSPICIOUS_TLD = ['ru', 'tk', 'top', 'xyz', 'gq', 'ml', 'cf', 'ga', 'zip', 'mov', 'click'];
const COMMON_TLD = [
  'com',
  'net',
  'org',
  'io',
  'tv',
  'gg',
  'co',
  'me',
  'gov',
  'edu',
  'uk',
  'de',
  'fr',
  'ca',
  'us',
  'info',
  'biz',
  'live',
  'stream',
  'app',
  'dev',
  'link',
  'online',
  'site',
  'shop',
  ...SUSPICIOUS_TLD,
];

/** Extract host names from a message (schemeless URLs included). */
export function extractDomains(text: string): string[] {
  const out: string[] = [];
  const re = /(https?:\/\/)?((?:[a-z0-9-]+\.)+[a-z]{2,})(\/[^\s]*)?/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const scheme = m[1];
    const path = m[3];
    let host = (m[2] ?? '').toLowerCase();
    if (host.startsWith('www.')) host = host.slice(4);
    const tld = host.split('.').pop() ?? '';
    // Ignore token like "node.js" unless it clearly is a URL (scheme or path).
    if (!scheme && !path && !COMMON_TLD.includes(tld)) continue;
    out.push(host);
  }
  return out;
}

function isTrusted(host: string, trusted: Set<string>): boolean {
  if (trusted.has(host)) return true;
  // Subdomain of a trusted domain (clips.twitch.tv trusts twitch.tv).
  for (const t of trusted) if (host === t || host.endsWith(`.${t}`)) return true;
  return false;
}

function isScammy(host: string): boolean {
  const tld = host.split('.').pop() ?? '';
  return SHORTENERS.includes(host) || SUSPICIOUS_TLD.includes(tld);
}

function capsPercent(text: string): { pct: number; letters: number } {
  const cased = text.match(/[a-z]/gi)?.length ?? 0;
  const upper = text.match(/[A-Z]/g)?.length ?? 0;
  return { pct: cased === 0 ? 0 : (upper / cased) * 100, letters: cased };
}

export function deterministic(
  msg: IncomingMessage,
  norm: NormalizedText,
  session: UserSession,
  config: ChannelConfig,
  now: number,
): Signal | null {
  // 1. Streamer banned terms — high → instant action (severity 3), low → strike.
  for (const bt of config.filters.bannedTerms) {
    if (containsTerm(norm, bt.term)) {
      return {
        category: 'toxicity',
        severity: bt.severity === 'high' ? 3 : 1,
        confidence: 1,
        reason: `Blocked term "${bt.term}"`,
        source: 'local',
      };
    }
  }

  // 2. Link policy.
  const domains = extractDomains(msg.text);
  if (domains.length > 0 && config.filters.linkPolicy !== 'allow') {
    const trusted = new Set(config.filters.trustedDomains.map((d) => d.toLowerCase()));
    const offending =
      config.filters.linkPolicy === 'block-all'
        ? domains
        : domains.filter((d) => !isTrusted(d, trusted));
    if (offending.length > 0) {
      const scammy = offending.some(isScammy);
      const host = offending[0]!;
      return {
        category: scammy ? 'scam' : 'advertising',
        severity: scammy ? 3 : 1,
        confidence: 1,
        reason: scammy
          ? `Suspicious link (${host}) — link policy: ${config.filters.linkPolicy}`
          : `Link not on the trusted list (${host})`,
        source: 'local',
      };
    }
  } else if (domains.length > 0 && config.filters.linkPolicy === 'allow') {
    const scammy = domains.find(isScammy);
    if (scammy) {
      return {
        category: 'scam',
        severity: 2,
        confidence: 1,
        reason: `Suspicious link (${scammy}) — URL shortener or high-risk domain`,
        source: 'local',
      };
    }
  }

  // 3. Flood / rate — sliding window per user.
  const windowMs = config.filters.spam.windowSeconds * 1000;
  const inWindow = session.messageTimestamps.filter((t) => now - t < windowMs).length;
  if (inWindow + 1 > config.filters.spam.ratePerWindow) {
    return {
      category: 'flood',
      severity: 1,
      confidence: 1,
      reason: `${inWindow + 1} messages in ${config.filters.spam.windowSeconds}s (limit ${config.filters.spam.ratePerWindow})`,
      source: 'local',
    };
  }

  // 4. Duplicates / copypasta.
  if (norm.canonical.length > 0) {
    const repeats = session.recentNormalized.filter((t) => t === norm.canonical).length;
    if (repeats >= 2) {
      return {
        category: 'spam',
        severity: 1,
        confidence: 1,
        reason: `Same message repeated ${repeats + 1}×`,
        source: 'local',
      };
    }
  }

  // 5. Composition — caps wall and emote wall.
  const caps = capsPercent(msg.text);
  if (caps.letters >= 8 && caps.pct >= config.filters.spam.capsPct) {
    return {
      category: 'spam',
      severity: 1,
      confidence: 1,
      reason: `${Math.round(caps.pct)}% capitals across ${caps.letters} letters (limit ${config.filters.spam.capsPct}%)`,
      source: 'local',
    };
  }
  if (msg.emoteCount > config.filters.spam.emoteMax) {
    return {
      category: 'spam',
      severity: 1,
      confidence: 1,
      reason: `${msg.emoteCount} emotes (limit ${config.filters.spam.emoteMax})`,
      source: 'local',
    };
  }

  return null;
}
