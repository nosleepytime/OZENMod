/**
 * The AI Assistant's research loop. Drives an AI chat model with the Keenable
 * search tool using a strict JSON protocol: the model replies with either a
 * search step or a final answer, and the loop runs the search and feeds the
 * results back until the model answers or the search budget is spent.
 *
 * Framework-free: `chat` and `search` are injected, so the whole loop is
 * testable with fakes and works with any provider. See instructions.ts.
 */
import type { CallOptions } from '../types';
import { SEARCH_TOOL_INSTRUCTIONS } from './instructions';
import type { SearchResult, WebSearch } from './keenable';

export type ChatFn = (
  messages: { role: string; content: string }[],
  opts: CallOptions,
) => Promise<string>;

export interface ResearchRequest {
  /** The streamer's natural-language request. */
  request: string;
  /** Optional extra context (recent chat, the message under review, etc.). */
  context?: string;
}

export interface ResearchSource {
  title: string;
  url: string;
}

export interface ResearchResult {
  answer: string;
  usedSearch: boolean;
  searches: number;
  sources: ResearchSource[];
}

export interface ResearchDeps {
  chat: ChatFn;
  /** null when no Keenable key is configured — the model answers unaided. */
  search: WebSearch | null;
}

export interface ResearchOptions extends CallOptions {
  /** Max search calls before forcing a final answer (default 3). */
  maxSearches?: number;
}

type Plan =
  | { action: 'search'; query: string; site?: string }
  | { action: 'answer'; answer: string; sources: string[] };

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

/** Extract the first balanced JSON object from a possibly noisy string. */
function extractJson(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

function toDomain(site: string): string {
  return site
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '');
}

export function parsePlan(raw: unknown): Plan | null {
  if (!isObject(raw)) return null;
  if (raw.action === 'search') {
    if (typeof raw.query !== 'string' || !raw.query.trim()) return null;
    const plan: Plan = { action: 'search', query: raw.query.trim() };
    if (typeof raw.site === 'string' && raw.site.trim()) plan.site = toDomain(raw.site);
    return plan;
  }
  if (raw.action === 'answer') {
    const answer = typeof raw.answer === 'string' ? raw.answer.trim() : '';
    if (!answer) return null;
    const sources = Array.isArray(raw.sources)
      ? raw.sources.filter((s): s is string => typeof s === 'string')
      : [];
    return { action: 'answer', answer, sources };
  }
  return null;
}

function formatResults(results: SearchResult[]): string {
  return results
    .map((r, i) => `${i + 1}. ${r.title}\n   ${r.url}\n   ${r.snippet || r.description}`)
    .join('\n');
}

function dedupeSources(results: SearchResult[]): ResearchSource[] {
  const seen = new Set<string>();
  const out: ResearchSource[] = [];
  for (const r of results) {
    if (seen.has(r.url)) continue;
    seen.add(r.url);
    out.push({ title: r.title, url: r.url });
  }
  return out.slice(0, 8);
}

function titleFor(results: SearchResult[], url: string): string {
  return results.find((r) => r.url === url)?.title ?? url;
}

export async function runResearch(
  req: ResearchRequest,
  deps: ResearchDeps,
  opts: ResearchOptions,
): Promise<ResearchResult> {
  const maxSearches = opts.maxSearches ?? 3;
  const collected: SearchResult[] = [];
  const messages: { role: string; content: string }[] = [
    { role: 'system', content: SEARCH_TOOL_INSTRUCTIONS },
    {
      role: 'user',
      content:
        `Streamer request: ${req.request}` +
        (req.context ? `\n\nContext:\n${req.context}` : '') +
        (deps.search
          ? ''
          : '\n\n(Web search is unavailable right now — answer from your own knowledge and say clearly if you are unsure.)'),
    },
  ];

  let searches = 0;
  for (let step = 0; step <= maxSearches; step++) {
    let content: string;
    try {
      content = await deps.chat(messages, opts);
    } catch {
      break;
    }

    const plan = parsePlan(extractJson(content));
    // No valid plan — treat the raw text as the answer.
    if (!plan) {
      return {
        answer: content.trim() || 'I could not produce an answer.',
        usedSearch: searches > 0,
        searches,
        sources: dedupeSources(collected),
      };
    }

    const mustAnswer = plan.action === 'answer' || !deps.search || searches >= maxSearches;
    if (mustAnswer) {
      const answer =
        plan.action === 'answer'
          ? plan.answer
          : 'I need to look this up but web search is unavailable, so I cannot verify it.';
      const sources =
        plan.action === 'answer' && plan.sources.length > 0
          ? plan.sources.map((url) => ({ title: titleFor(collected, url), url }))
          : dedupeSources(collected);
      return { answer, usedSearch: searches > 0, searches, sources };
    }

    // action === 'search'
    searches += 1;
    let results: SearchResult[] = [];
    try {
      results = await deps.search!.search({ query: plan.query, site: plan.site, limit: 6 }, opts);
    } catch {
      results = [];
    }
    collected.push(...results);
    messages.push({ role: 'assistant', content: JSON.stringify(plan) });
    messages.push({
      role: 'user',
      content:
        results.length > 0
          ? `Search results:\n${formatResults(results)}`
          : 'No results found. Try different search terms, or answer from what you already know.',
    });
  }

  return {
    answer: 'I searched but could not reach a confident answer. Try rephrasing the question.',
    usedSearch: searches > 0,
    searches,
    sources: dedupeSources(collected),
  };
}
