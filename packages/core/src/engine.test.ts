import { describe, it, expect } from 'vitest';
import { defaultConfig, type ChannelConfig } from '@ozenmod/database';
import { ModerationEngine } from './engine';
import type { ChatRole, IncomingMessage } from './types';

function msg(text: string, over: Partial<IncomingMessage> = {}): IncomingMessage {
  return {
    id: Math.random().toString(36).slice(2),
    login: over.login ?? 'viewer1',
    displayName: over.displayName ?? over.login ?? 'viewer1',
    text,
    timestamp: over.timestamp ?? 0,
    roles: over.roles ?? ['viewer'],
    emoteCount: over.emoteCount ?? 0,
    mentions: over.mentions ?? [],
  };
}

function engine(mut?: (c: ChannelConfig) => void): ModerationEngine {
  const cfg = defaultConfig(0);
  mut?.(cfg);
  return new ModerationEngine(cfg);
}

describe('S0 exemptions', () => {
  it('allows the broadcaster without analysis', () => {
    const e = engine();
    const d = e.analyze(msg('you are an idiot', { roles: ['broadcaster'], mentions: ['bob'] }));
    expect(d.decision.action).toBe('allow');
  });

  it('allows moderators by default but not subscribers', () => {
    const e = engine();
    const mod = e.analyze(msg('kill yourself', { login: 'm', roles: ['moderator'] }));
    expect(mod.decision.action).toBe('allow');
    const sub = e.analyze(msg('kill yourself', { login: 's', roles: ['subscriber'] }));
    expect(sub.decision.action).toBe('ban');
  });
});

describe('clean traffic', () => {
  it('allows an ordinary message', () => {
    const e = engine();
    const d = e.analyze(msg('good luck on the run tonight!'));
    expect(d.decision.action).toBe('allow');
    expect(d.escalateToAI).toBe(false);
  });
});

describe('S6 severity bypass', () => {
  it('bans an explicit threat', () => {
    const e = engine();
    const d = e.analyze(msg('i will find you and kill you', { mentions: ['bob'] }));
    expect(d.decision.action).toBe('ban');
    expect(d.decision.severity).toBe(3);
    expect(d.decision.reason).toContain('severity 3');
  });

  it('bans a slur even with leetspeak evasion', () => {
    const e = engine();
    const d = e.analyze(msg('shut up you n1gger', { mentions: ['bob'] }));
    expect(d.decision.category).toBe('hate');
    expect(d.decision.action).toBe('ban');
  });

  it('applies a long timeout for a high-severity banned term', () => {
    const e = engine((c) => {
      c.filters.bannedTerms = [{ term: 'secretword', severity: 'high' }];
    });
    const d = e.analyze(msg('here is the secretword'));
    expect(d.decision.action).toBe('timeout');
    expect(d.decision.severity).toBe(3);
  });
});

describe('S2 links', () => {
  it('flags a URL shortener under the trusted policy', () => {
    const e = engine();
    const d = e.analyze(msg('claim free stuff at bit.ly/xyz'));
    expect(d.decision.category).toBe('scam');
    expect(d.decision.enforcement.type === 'timeout' || d.decision.action === 'timeout').toBe(true);
  });

  it('allows a trusted domain', () => {
    const e = engine();
    const d = e.analyze(msg('clip here clips.twitch.tv/abc'));
    expect(d.decision.action).toBe('allow');
  });
});

describe('S2 composition', () => {
  it('deletes a caps wall', () => {
    const e = engine();
    const d = e.analyze(msg('THIS IS AN ENORMOUS WALL OF SHOUTING TEXT'));
    expect(d.decision.category).toBe('spam');
    expect(d.decision.action).toBe('delete');
  });

  it('times out flooding', () => {
    const e = engine();
    let last;
    for (let i = 0; i < 6; i++) {
      last = e.analyze(msg(`message number ${i}`, { timestamp: i * 500 }), i * 500);
    }
    expect(last!.decision.category).toBe('flood');
    expect(last!.decision.action).toBe('timeout');
  });

  it('deletes copypasta duplicates', () => {
    const e = engine();
    let d;
    for (let i = 0; i < 3; i++)
      d = e.analyze(msg('same copypasta line', { timestamp: i * 3000 }), i * 3000);
    expect(d!.decision.action).toBe('delete');
    expect(d!.decision.reason).toContain('repeated');
  });
});

describe('S6 warning ladder', () => {
  it('progresses warn → warn → final timeout across the ladder', () => {
    const e = engine();
    const minute = 60_000;
    const a = e.analyze(msg('@bob you are an idiot', { mentions: ['bob'] }), 0);
    const b = e.analyze(msg('@bob you are such a moron', { mentions: ['bob'] }), minute);
    const c = e.analyze(msg('@bob you are pathetic and stupid', { mentions: ['bob'] }), 2 * minute);
    expect(a.decision.action).toBe('warn');
    expect(a.decision.strike).toBe('1/3');
    expect(b.decision.action).toBe('warn');
    expect(b.decision.strike).toBe('2/3');
    expect(c.decision.action).toBe('timeout');
    expect(c.decision.strike).toBe('3/3');
  });

  it('does not double-punish within the cooldown window', () => {
    const e = engine();
    const a = e.analyze(msg('@bob you are an idiot', { mentions: ['bob'] }), 0);
    const b = e.analyze(msg('@bob still an idiot', { mentions: ['bob'] }), 2000);
    expect(a.decision.action).toBe('warn');
    expect(b.decision.action).toBe('ignore');
  });
});

describe('S4 ambiguity gate', () => {
  it('escalates a borderline message and falls back to review', () => {
    const e = engine((c) => {
      c.ai.fallback = 'conservative-local';
      c.moderation.firstTimeChatterBoost = false;
    });
    const d = e.analyze(msg('this whole game is stupid honestly'));
    expect(d.escalateToAI).toBe(true);
    expect(d.decision.action).toBe('review');
  });

  it('acts locally in the band under the strict-local fallback', () => {
    const e = engine((c) => {
      c.ai.fallback = 'strict-local';
      c.moderation.firstTimeChatterBoost = false;
    });
    const d = e.analyze(msg('this whole game is stupid honestly'));
    expect(d.escalateToAI).toBe(true);
    expect(['warn', 'delete', 'timeout', 'review']).toContain(d.decision.action);
  });
});

describe('S5 AI escalation (deferred commit)', () => {
  it('does not commit strikes on the escalate path until resolved', () => {
    const e = engine((c) => {
      c.moderation.firstTimeChatterBoost = false;
    });
    const a = e.analyze(msg('this whole game is stupid honestly', { login: 'x' }));
    expect(a.escalateToAI).toBe(true);
    // The preview is not committed — no strike yet.
    expect(e.getSession('x').strikes).toBe(0);
  });

  it('commits the AI verdict through the ladder', () => {
    const e = engine((c) => {
      c.moderation.firstTimeChatterBoost = false;
    });
    const m = msg('this whole game is stupid honestly', { login: 'x' });
    const a = e.analyze(m);
    expect(a.escalateToAI).toBe(true);
    const decision = e.judgeWithVerdict(m, {
      action: 'warn',
      category: 'harassment',
      severity: 1,
      confidence: 0.9,
      reason: 'Mild insult toward the game, not a person',
    });
    expect(decision.action).toBe('warn');
    expect(decision.source).toBe('ai');
    expect(e.getSession('x').strikes).toBe(1);
  });

  it('an AI "allow" verdict clears the message with no strike', () => {
    const e = engine((c) => {
      c.moderation.firstTimeChatterBoost = false;
    });
    const m = msg('this whole game is stupid honestly', { login: 'x' });
    e.analyze(m);
    const decision = e.judgeWithVerdict(m, {
      action: 'allow',
      category: 'none',
      severity: 0,
      confidence: 0.95,
      reason: 'Frustration at the game, not an attack',
    });
    expect(decision.action).toBe('allow');
    expect(e.getSession('x').strikes).toBe(0);
  });

  it('resolveFallback commits the configured local fallback (conservative → review)', () => {
    const e = engine((c) => {
      c.moderation.firstTimeChatterBoost = false;
      c.ai.fallback = 'conservative-local';
    });
    const m = msg('this whole game is stupid honestly', { login: 'x' });
    const a = e.analyze(m);
    expect(a.escalateToAI).toBe(true);
    const decision = e.resolveFallback(m, a.signal);
    // A borderline high-risk message with no AI goes to human review, no strike.
    expect(decision.action).toBe('review');
    expect(e.getSession('x').strikes).toBe(0);
  });
});

describe('reset', () => {
  it('clears session strikes at stream end', () => {
    const e = engine();
    e.analyze(msg('@bob you are an idiot', { mentions: ['bob'] }), 0);
    expect(e.getSession('viewer1').strikes).toBe(1);
    e.reset();
    expect(e.getSession('viewer1').strikes).toBe(0);
  });
});
