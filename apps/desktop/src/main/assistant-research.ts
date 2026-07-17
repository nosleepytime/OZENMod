/**
 * The AI Assistant's research/answer path. When the streamer types something
 * that is not a moderation command (a question, a "is this link legit?", a
 * lookup), the assistant runs the @ozenmod/ai research loop: the model decides
 * whether it needs Keenable web search, runs it, and answers with sources.
 *
 * Keenable web search is FREE with no API key (unauthenticated tier), so search
 * is always available. An optional OZENMOD_KEENABLE_API_KEY only raises the rate
 * limits; it is a per-streamer secret and is never shipped or stored.
 */
import { createKeenableSearch, pollinationsChat, runResearch } from '@ozenmod/ai';

const RESEARCH_TIMEOUT_MS = 8000;
const MAX_SEARCHES = 3;

export interface Researcher {
  /** Web search is always available (free, keyless). */
  searchEnabled: boolean;
  ask(text: string, context?: string): Promise<string>;
}

export function createResearcher(): Researcher {
  // Keyless free tier by default; the optional key only lifts rate limits.
  const search = createKeenableSearch(process.env.OZENMOD_KEENABLE_API_KEY);

  return {
    searchEnabled: true,
    async ask(text: string, context?: string): Promise<string> {
      const res = await runResearch(
        { request: text, ...(context ? { context } : {}) },
        { chat: pollinationsChat, search },
        { timeoutMs: RESEARCH_TIMEOUT_MS, maxSearches: MAX_SEARCHES },
      );
      if (res.sources.length === 0) return res.answer;
      const cites = res.sources.map((s) => `• ${s.url}`).join('\n');
      return `${res.answer}\n\nSources:\n${cites}`;
    },
  };
}
