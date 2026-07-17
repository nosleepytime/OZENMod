import { describe, it, expect, vi } from 'vitest';
import { runResearch, parsePlan, type ChatFn } from './research';
import type { WebSearch, SearchResult } from './keenable';

const OPTS = { timeoutMs: 2000 };

function fakeSearch(results: SearchResult[]): WebSearch {
  return { search: vi.fn(async () => results) };
}

describe('parsePlan', () => {
  it('accepts a search plan and normalizes site to a domain', () => {
    expect(
      parsePlan({ action: 'search', query: ' scam ', site: 'https://twitch.tv/help' }),
    ).toEqual({
      action: 'search',
      query: 'scam',
      site: 'twitch.tv',
    });
  });
  it('accepts an answer plan', () => {
    expect(parsePlan({ action: 'answer', answer: 'hi', sources: ['https://a', 1] })).toEqual({
      action: 'answer',
      answer: 'hi',
      sources: ['https://a'],
    });
  });
  it('rejects invalid plans', () => {
    expect(parsePlan({ action: 'search' })).toBeNull();
    expect(parsePlan({ action: 'answer', answer: '' })).toBeNull();
    expect(parsePlan('nope')).toBeNull();
  });
});

describe('runResearch', () => {
  it('searches once, then answers using the results', async () => {
    const chat = vi
      .fn<ChatFn>()
      .mockResolvedValueOnce('{"action":"search","query":"free bits scam","reason":"verify"}')
      .mockResolvedValueOnce(
        '{"action":"answer","answer":"Yes, that is a known scam.","sources":["https://example.com/a"]}',
      );
    const search = fakeSearch([
      { title: 'Scam report', url: 'https://example.com/a', description: 'd', snippet: 's' },
    ]);

    const res = await runResearch({ request: 'is bit.ly/x a scam?' }, { chat, search }, OPTS);

    expect(res.usedSearch).toBe(true);
    expect(res.searches).toBe(1);
    expect(res.answer).toContain('known scam');
    expect(res.sources).toEqual([{ title: 'Scam report', url: 'https://example.com/a' }]);
    expect((search.search as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1);
  });

  it('answers directly when no search is needed', async () => {
    const chat = vi
      .fn<ChatFn>()
      .mockResolvedValue('{"action":"answer","answer":"Sure, here you go.","sources":[]}');
    const search = fakeSearch([]);
    const res = await runResearch({ request: 'say hi' }, { chat, search }, OPTS);
    expect(res.usedSearch).toBe(false);
    expect(res.searches).toBe(0);
    expect(res.answer).toBe('Sure, here you go.');
  });

  it('answers unaided when search is unavailable even if the model asks to search', async () => {
    const chat = vi.fn<ChatFn>().mockResolvedValue('{"action":"search","query":"anything"}');
    const res = await runResearch({ request: 'latest news?' }, { chat, search: null }, OPTS);
    expect(res.usedSearch).toBe(false);
    expect(res.answer).toContain('unavailable');
  });

  it('stops at the search budget and still answers', async () => {
    const chat = vi.fn<ChatFn>().mockResolvedValue('{"action":"search","query":"loop"}');
    const search = fakeSearch([{ title: 'r', url: 'https://x/y', description: '', snippet: '' }]);
    const res = await runResearch({ request: 'x' }, { chat, search }, { ...OPTS, maxSearches: 2 });
    expect(res.searches).toBe(2);
    // Falls back to collected sources when forced to answer.
    expect(res.sources).toEqual([{ title: 'r', url: 'https://x/y' }]);
  });

  it('treats non-JSON output as the answer', async () => {
    const chat = vi.fn<ChatFn>().mockResolvedValue('just a plain sentence');
    const res = await runResearch({ request: 'x' }, { chat, search: null }, OPTS);
    expect(res.answer).toBe('just a plain sentence');
  });
});
