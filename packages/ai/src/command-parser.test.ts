import { describe, it, expect } from 'vitest';
import { parseCommand } from './command-parser';

describe('parseCommand', () => {
  it('parses a timeout with duration and reason, stripping the duration from the reason', () => {
    const r = parseCommand('timeout spamlord2000 for 10 min, he keeps spamming his discord');
    expect(r.action).toBe('timeout');
    expect(r.target).toBe('spamlord2000');
    expect(r.durationSeconds).toBe(600);
    expect(r.reason).toBe('spamming his discord');
    expect(r.needsConfirmation).toBe(false);
  });

  it('removes a warning using the possessive form', () => {
    const r = parseCommand("remove xX_rager_Xx's warning, that was just banter");
    expect(r.action).toBe('unwarn');
    expect(r.target).toBe('xX_rager_Xx');
  });

  it('requires confirmation for a permanent ban', () => {
    const r = parseCommand('ban grifter_joe');
    expect(r.action).toBe('ban');
    expect(r.target).toBe('grifter_joe');
    expect(r.needsConfirmation).toBe(true);
  });

  it('does not require confirmation for an unban', () => {
    const r = parseCommand('unban grifter_joe');
    expect(r.action).toBe('unban');
    expect(r.needsConfirmation).toBe(false);
  });

  it('clears one user’s strikes without confirmation', () => {
    const r = parseCommand("clear all of dan's strikes");
    expect(r.action).toBe('clear_strikes');
    expect(r.target).toBe('dan');
    expect(r.needsConfirmation).toBe(false);
  });

  it('treats clearing everyone’s strikes as a mass action needing confirmation', () => {
    const r = parseCommand('clear all strikes');
    expect(r.action).toBe('clear_strikes');
    expect(r.target).toBeUndefined();
    expect(r.needsConfirmation).toBe(true);
  });

  it('lifts a timeout', () => {
    const r = parseCommand('lift the timeout on spammer99');
    expect(r.action).toBe('untimeout');
    expect(r.target).toBe('spammer99');
  });

  it('requires confirmation for timeouts longer than 24 hours', () => {
    const r = parseCommand('timeout badguy 48h');
    expect(r.action).toBe('timeout');
    expect(r.durationSeconds).toBe(48 * 3600);
    expect(r.needsConfirmation).toBe(true);
  });

  it('supports slash syntax', () => {
    const r = parseCommand('/timeout badguy 1h');
    expect(r.action).toBe('timeout');
    expect(r.target).toBe('badguy');
    expect(r.durationSeconds).toBe(3600);
  });

  it('answers queries without acting', () => {
    expect(parseCommand('who did I ban today?').action).toBe('query_actions');
    expect(parseCommand('session stats').action).toBe('query_stats');
    expect(parseCommand("what are rager_x's strikes").action).toBe('query_user');
  });

  it('reverts with undo', () => {
    expect(parseCommand('undo').action).toBe('undo_last');
  });

  it('falls back to unknown for non-commands', () => {
    const r = parseCommand('hello there bot');
    expect(r.action).toBe('unknown');
    expect(r.confidence).toBeLessThan(0.7);
  });

  it('warns with @mention targets', () => {
    const r = parseCommand('warn @toxic_tom for being rude');
    expect(r.action).toBe('warn');
    expect(r.target).toBe('toxic_tom');
    expect(r.reason).toBe('being rude');
  });
});
