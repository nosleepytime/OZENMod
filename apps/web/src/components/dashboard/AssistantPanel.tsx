'use client';

import { useEffect, useRef, useState } from 'react';
import type { CommandIntent } from '@ozenmod/shared';
import { parseCommand, actionMeta, type ActionIcon, type ActionTone } from '@ozenmod/ai';
import { useAssistant } from './AssistantContext';
import { Icons } from './icons';

/** One entry in the assistant transcript. */
interface Turn {
  id: number;
  command: string;
  intent: CommandIntent;
  /** pending → tier-2 waiting for confirm; done → executed; cancelled/undone. */
  status: 'pending' | 'done' | 'cancelled' | 'undone';
}

const SUGGESTIONS = [
  'Clear all strikes',
  'Who did I ban today?',
  'Add banned term…',
  'Session stats',
];

const ICON: Record<ActionIcon, (typeof Icons)[keyof typeof Icons]> = {
  ban: Icons.ban,
  clock: Icons.clock,
  eye: Icons.eye,
  trash: Icons.trash,
  sparkles: Icons.sparkles,
  info: Icons.info,
  undo: Icons.undo,
  check: Icons.check,
};

const TONE_COLOR: Record<ActionTone, string> = {
  good: 'var(--good)',
  warn: 'var(--warn)',
  danger: 'var(--danger)',
  info: 'var(--accent-2)',
};

let nextId = 1;

export function AssistantPanel() {
  const { open, setOpen } = useAssistant();
  const [input, setInput] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' });
  }, [turns]);

  function submit(raw: string) {
    const command = raw.trim();
    if (!command) return;
    const intent = parseCommand(command);
    const status: Turn['status'] = intent.needsConfirmation ? 'pending' : 'done';
    setTurns((t) => [...t, { id: nextId++, command, intent, status }]);
    setInput('');
  }

  function resolve(id: number, status: Turn['status']) {
    setTurns((t) => t.map((turn) => (turn.id === id ? { ...turn, status } : turn)));
  }

  return (
    <>
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 40 }}
          aria-hidden
        />
      )}
      <aside className="assistant" data-open={open} aria-label="AI Assistant" aria-hidden={!open}>
        <div className="as-head">
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: 'var(--accent-soft)',
              color: 'var(--accent-2)',
              border: '1px solid rgba(124,92,255,.3)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Icons.sparkles className="ic" />
          </span>
          <div className="grow">
            <b style={{ fontSize: 14, display: 'block' }}>AI Assistant</b>
            <span className="card-sub">Moderate in plain English</span>
          </div>
          <span className="kbd">Ctrl K</span>
          <button
            className="btn btn-ghost btn-sm"
            style={{ width: 30, padding: 0 }}
            onClick={() => setOpen(false)}
            aria-label="Close assistant"
          >
            <Icons.x className="ic ic-sm" />
          </button>
        </div>

        <div className="as-thread" ref={threadRef}>
          {turns.length === 0 && <EmptyState />}
          {turns.map((turn) => (
            <TurnView key={turn.id} turn={turn} onResolve={resolve} />
          ))}
        </div>

        <div className="as-suggest">
          {SUGGESTIONS.map((s) => (
            <button className="chip" key={s} onClick={() => submit(s.replace('…', ' toxic-word'))}>
              {s}
            </button>
          ))}
        </div>
        <form
          className="as-composer"
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
        >
          <span className="input grow">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything — ban, timeout, warn, unwarn, stats…"
              aria-label="Assistant command"
            />
          </span>
          <button className="btn btn-primary" style={{ width: 38, padding: 0 }} aria-label="Send">
            <Icons.send className="ic" />
          </button>
        </form>
        <div className="as-foot">
          Commands run through your bot and are logged like any decision. Type{' '}
          <span className="kbd">/</span> for exact syntax — it works even when the AI is offline.
        </div>
      </aside>
    </>
  );
}

function EmptyState() {
  return (
    <div style={{ color: 'var(--text-3)', fontSize: 12.5, lineHeight: 1.7, padding: '6px 2px' }}>
      <p style={{ marginBottom: 10 }}>Tell me what to do in plain English. For example:</p>
      <ul style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <li>“timeout spamlord2000 for 10 min, discord spam”</li>
        <li>“remove xX_rager_Xx&apos;s warning”</li>
        <li>“ban grifter_joe”</li>
        <li>“who did I ban today?”</li>
      </ul>
      <p style={{ marginTop: 10 }}>
        Reversible actions run instantly with an Undo. Permanent bans and mass actions ask first.
      </p>
    </div>
  );
}

function TurnView({
  turn,
  onResolve,
}: {
  turn: Turn;
  onResolve: (id: number, s: Turn['status']) => void;
}) {
  const meta = actionMeta(turn.intent);
  const IconEl = ICON[meta.icon];
  const isQuery = turn.intent.action.startsWith('query') || turn.intent.action === 'unknown';

  return (
    <>
      <div className="as-msg-user">{turn.command}</div>
      <div className={`card as-card${turn.status === 'pending' ? ' as-confirm' : ''}`}>
        {isQuery ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <Icons.sparkles
              className="ic"
              style={{ color: 'var(--accent-2)', marginTop: 1, flex: 'none' }}
            />
            <span style={{ color: 'var(--text-2)' }}>{turn.intent.reply}</span>
          </div>
        ) : (
          <>
            <div className="as-card-head">
              <IconEl className="ic" style={{ color: TONE_COLOR[meta.tone] }} />
              {turn.status === 'pending' ? `${meta.title} — confirm?` : meta.title}
              {turn.status === 'done' && (
                <span className="chip chip-good" style={{ marginLeft: 'auto' }}>
                  <Icons.check className="ic ic-sm" /> Done
                </span>
              )}
              {turn.status === 'cancelled' && (
                <span className="chip" style={{ marginLeft: 'auto' }}>
                  Cancelled
                </span>
              )}
              {turn.status === 'undone' && (
                <span className="chip" style={{ marginLeft: 'auto' }}>
                  Reverted
                </span>
              )}
            </div>

            {turn.intent.target && (
              <div className="as-kv">
                <b>User</b> {turn.intent.target}
              </div>
            )}
            {turn.intent.durationSeconds !== undefined && (
              <div className="as-kv">
                <b>Duration</b> {formatDuration(turn.intent.durationSeconds)}
              </div>
            )}
            {turn.intent.args?.term && (
              <div className="as-kv">
                <b>Term</b> “{turn.intent.args.term}”
              </div>
            )}
            <div className="as-kv">
              <b>Reason</b> {turn.intent.reason ?? 'None given (optional)'}
            </div>

            {turn.status === 'pending' ? (
              <>
                <div className="row">
                  <button
                    className={
                      turn.intent.action === 'ban'
                        ? 'btn btn-danger btn-sm'
                        : 'btn btn-primary btn-sm'
                    }
                    onClick={() => onResolve(turn.id, 'done')}
                  >
                    {turn.intent.action === 'ban' && <Icons.ban className="ic ic-sm" />} Confirm
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => onResolve(turn.id, 'cancelled')}
                  >
                    Cancel
                  </button>
                </div>
                <span className="as-meta">
                  Permanent bans and mass actions always ask for confirmation.
                </span>
              </>
            ) : turn.status === 'done' ? (
              <div className="row">
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => onResolve(turn.id, 'undone')}
                >
                  <Icons.undo className="ic ic-sm" /> Undo
                </button>
                <span className="as-meta" style={{ marginLeft: 'auto' }}>
                  logged in Moderation
                </span>
              </div>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}

function formatDuration(seconds: number): string {
  if (seconds % 86400 === 0) return `${seconds / 86400} day${seconds === 86400 ? '' : 's'}`;
  if (seconds % 3600 === 0) return `${seconds / 3600} hour${seconds === 3600 ? '' : 's'}`;
  if (seconds % 60 === 0) return `${seconds / 60} minutes`;
  return `${seconds} seconds`;
}
