/**
 * AI Assistant research endpoint (web). Runs the @ozenmod/ai research loop
 * server-side so the Keenable API key stays a secret — the browser only ever
 * sees the answer and its sources. Used by the dashboard assistant for
 * questions and lookups (non-moderation-command input).
 */
import { NextResponse } from 'next/server';
import { runResearch, pollinationsChat, createKeenableSearch, type WebSearch } from '@ozenmod/ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  let body: { request?: unknown; context?: unknown };
  try {
    body = (await request.json()) as { request?: unknown; context?: unknown };
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const q = typeof body.request === 'string' ? body.request.trim() : '';
  if (!q) return NextResponse.json({ error: 'missing_request' }, { status: 400 });
  const context = typeof body.context === 'string' ? body.context : undefined;

  const key = process.env.KEENABLE_API_KEY ?? process.env.OZENMOD_KEENABLE_API_KEY;
  const search: WebSearch | null = key ? createKeenableSearch(key) : null;

  try {
    const res = await runResearch(
      { request: q, ...(context ? { context } : {}) },
      { chat: pollinationsChat, search },
      { timeoutMs: 8000, maxSearches: 3 },
    );
    return NextResponse.json({
      answer: res.answer,
      sources: res.sources,
      usedSearch: res.usedSearch,
    });
  } catch {
    return NextResponse.json({
      answer: 'The assistant is unavailable right now. Please try again.',
      sources: [],
      usedSearch: false,
    });
  }
}
