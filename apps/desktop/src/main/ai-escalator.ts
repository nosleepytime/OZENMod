/**
 * AiEscalator — calls the configured AI provider on the ambiguity-band messages
 * the engine flags (S5). Only the keyless, free Pollinations provider is wired
 * for automatic escalation; providers that need API keys are selected in the AI
 * settings and used for the manual assistant. Enforces the per-minute AI budget,
 * a soft timeout, and a short circuit breaker after a failure so chat never
 * blocks on the AI. See docs/MODERATION.md §3 (S5).
 */
import {
  createPollinationsProvider,
  type AIProvider,
  type AIVerdict,
  type ModerationRequest,
} from '@ozenmod/ai';
import type { ChannelConfig } from '@ozenmod/database';

const SOFT_TIMEOUT_MS = 3000;
const BREAKER_MS = 30_000;

export interface AiEscalator {
  /** True when automatic escalation is possible for the current provider. */
  available(config: ChannelConfig): boolean;
  /** Judge one message, or null to fall back (over budget, unhealthy, error). */
  judge(request: ModerationRequest, config: ChannelConfig): Promise<AIVerdict | null>;
}

export function createAiEscalator(
  onLog: (level: 'info' | 'warn' | 'error', message: string) => void,
): AiEscalator {
  let provider: AIProvider | null = null;
  const callTimes: number[] = [];
  let breakerUntil = 0;

  function getProvider(config: ChannelConfig): AIProvider | null {
    if (config.ai.provider !== 'pollinations') return null;
    if (!provider) provider = createPollinationsProvider();
    return provider;
  }

  function withinBudget(config: ChannelConfig, now: number): boolean {
    const cutoff = now - 60_000;
    while (callTimes.length > 0 && callTimes[0]! < cutoff) callTimes.shift();
    return callTimes.length < config.ai.maxCallsPerMinute;
  }

  return {
    available: (config) => getProvider(config) !== null,

    async judge(request, config) {
      const now = Date.now();
      const p = getProvider(config);
      if (!p) return null;
      if (now < breakerUntil) return null;
      if (!withinBudget(config, now)) return null;
      callTimes.push(now);
      try {
        return await p.moderate(request, { timeoutMs: SOFT_TIMEOUT_MS });
      } catch (e) {
        breakerUntil = Date.now() + BREAKER_MS;
        onLog(
          'warn',
          `AI provider error — using local fallback for 30s: ${e instanceof Error ? e.message : String(e)}`,
        );
        return null;
      }
    },
  };
}
