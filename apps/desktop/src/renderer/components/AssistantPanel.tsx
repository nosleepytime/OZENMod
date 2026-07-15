import { useEffect, useRef, useState } from 'react';
import { actionMeta, type ActionIcon, type ActionTone } from '@ozenmod/ai';
import type { CommandIntent } from '@ozenmod/shared';
import { getApi } from '../mock-api';
import { Icons } from '../icons';
import { formatDuration } from './bits';

interface Turn {
  id: number;
  command: string;
  intent: CommandIntent;
  status: 'pending' | 'done' | 'cancelled';
}

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

const TONE: Record<ActionTone, string> = {
  good: 'var(--good)',
  warn: 'var(--warn)',
  danger: 'var(--danger)',
  info: 'var(--accent-2)',
};

let nextId = 1;

export function AssistantPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
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

  async function submit(raw: string) {
    const command = raw.trim();
    if (!command) return;
    setInput('');
    const result = await getApi().runCommand(command);
    const status: Turn['status'] = result.status === 'needs-confirmation' ? 'pending' : 'done';
    setTurns((t) => [...t, { id: nextId++, command, intent: result.intent, status }]);
  }

  async function confirm(id: number, intent: CommandIntent) {
    await getApi().confirmCommand(intent);
    setTurns((t) => t.map((x) => (x.id === id ? { ...x, status: 'done' } : x)));
  }

  return (
    <aside className="assistant" data-open={open} aria-hidden={!open}>
      <div className="as-head">
        <span
          style={{
            width: 30,
            height: 30,
            borderRadius: 9,
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
          <b style={{ fontSize: 13, display: 'block' }}>AI Assistant</b>
          <span className="card-sub">Moderate in plain English</span>
        </div>
        <span className="kbd">Ctrl K</span>
        <button
          className="btn btn-ghost btn-sm"
          style={{ width: 28, padding: 0 }}
          onClick={onClose}
          aria-label="Close"
        >
          <Icons.x className="ic ic-sm" />
        </button>
      </div>

      <div className="as-thread" ref={threadRef}>
        {turns.length === 0 && (
          <div style={{ color: 'var(--text-3)', fontSize: 12, lineHeight: 1.7 }}>
            <p style={{ marginBottom: 8 }}>Tell me what to do — for example:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span>“timeout spamlord2000 for 10 min”</span>
              <span>“remove xX_rager_Xx&apos;s warning”</span>
              <span>“ban grifter_joe”</span>
            </div>
            <p style={{ marginTop: 8 }}>
              Reversible actions run instantly with an Undo. Bans ask first.
            </p>
          </div>
        )}
        {turns.map((turn) => (
          <TurnView
            key={turn.id}
            turn={turn}
            onConfirm={confirm}
            onCancel={(id) =>
              setTurns((t) => t.map((x) => (x.id === id ? { ...x, status: 'cancelled' } : x)))
            }
          />
        ))}
      </div>

      <form
        className="as-composer"
        onSubmit={(e) => {
          e.preventDefault();
          void submit(input);
        }}
      >
        <input
          ref={inputRef}
          className="as-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything — ban, timeout, warn, unwarn…"
          aria-label="Assistant command"
        />
        <button className="btn btn-primary" style={{ width: 36, padding: 0 }} aria-label="Send">
          <Icons.send className="ic" />
        </button>
      </form>
      <div className="as-foot">
        Commands execute through the local bot and are logged. Type <span className="kbd">/</span>{' '}
        for exact syntax — works even when the AI is offline.
      </div>
    </aside>
  );
}

function TurnView({
  turn,
  onConfirm,
  onCancel,
}: {
  turn: Turn;
  onConfirm: (id: number, intent: CommandIntent) => void;
  onCancel: (id: number) => void;
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
              <IconEl className="ic" style={{ color: TONE[meta.tone] }} />
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
                    onClick={() => onConfirm(turn.id, turn.intent)}
                  >
                    {turn.intent.action === 'ban' && <Icons.ban className="ic ic-sm" />} Confirm
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => onCancel(turn.id)}>
                    Cancel
                  </button>
                </div>
                <span className="as-meta">Bans always ask for confirmation.</span>
              </>
            ) : turn.status === 'done' ? (
              <div className="row">
                <button className="btn btn-outline btn-sm">
                  <Icons.undo className="ic ic-sm" /> Undo
                </button>
                <span className="as-meta" style={{ marginLeft: 'auto' }}>
                  logged
                </span>
              </div>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
