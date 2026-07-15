/** Default channel configuration applied on first connect. */
import type { ChannelConfig } from './schema';

export const CONFIG_VERSION = 1;

export function defaultConfig(now: number = Date.now()): ChannelConfig {
  return {
    configVersion: CONFIG_VERSION,
    updatedAt: now,
    general: { botAccount: null, autoStartOnLive: true },
    moderation: {
      sensitivity: 'balanced',
      categories: {
        harassment: { detect: true, aiAssist: true, threshold: 0.55 },
        hate: { detect: true, aiAssist: true, threshold: 0.4 },
        threat: { detect: true, aiAssist: true, threshold: 0.35 },
        sexual: { detect: true, aiAssist: true, threshold: 0.5 },
        spam: { detect: true, aiAssist: false, threshold: 0.65 },
        scam: { detect: true, aiAssist: true, threshold: 0.45 },
        advertising: { detect: true, aiAssist: false, threshold: 0.7 },
        toxicity: { detect: true, aiAssist: true, threshold: 0.6 },
      },
      exemptions: { moderators: true, vips: true, subscribers: false, regulars: false },
      cooldownSeconds: 30,
      firstTimeChatterBoost: true,
    },
    warnings: {
      mode: 'warn-then-sanction',
      maxStrikes: 3,
      ladder: [{ action: 'warn' }, { action: 'warn' }],
      finalAction: { action: 'timeout', seconds: 1800 },
      reset: 'per-stream',
    },
    filters: {
      bannedTerms: [],
      linkPolicy: 'trusted',
      trustedDomains: ['clips.twitch.tv', 'youtube.com'],
      spam: { capsPct: 70, emoteMax: 12, repeatWindow: 8, ratePerWindow: 5, windowSeconds: 10 },
    },
    ai: {
      provider: 'pollinations',
      model: 'openai',
      maxCallsPerMinute: 20,
      fallback: 'conservative-local',
    },
    privacy: { storeSnippets: false },
  };
}
