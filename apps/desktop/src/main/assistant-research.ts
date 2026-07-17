/**
 * The AI Assistant's research/answer path. When the streamer types something
 * that is not a moderation command (a question, a "is this link legit?", a
 * lookup), the assistant runs the @ozenmod/ai research loop: the model decides
 * whether it needs Keenable web search, runs it, and answers with sources.
 *
 * The Keenable API key is a per-streamer secret. In development / self-hosting
 * it is read from OZENMOD_KEENABLE_API_KEY; without it the assistant still
 * answers from the model's own knowledge (and says when it is unsure).
 */
import { createKeenableSearch, pollinationsChat, runResearch, type WebSearch } from '@ozenmod/ai';

const RESEARCH_TIMEOUT_MS = 8000;
const MAX_SEARCHES = 3;

export interface Researcher {
  /** True when web search is configured (the assistant always answers regardless). */
  searchEnabled: boolean;
  ask(text: string, context?: string): Promise<string>;
}

export function createResearcher(): Researcher {
  const key = process.env.OZENMOD_KEENABLE_API_KEY;
  const search: WebSearch | null = key ? createKeenableSearch(key) : null;

  return {
    searchEnabled: search !== null,
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
