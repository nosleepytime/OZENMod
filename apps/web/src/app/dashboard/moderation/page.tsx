import type { Metadata } from 'next';
import { Topbar } from '@/components/dashboard/Topbar';
import { Avatar, ActionChip, SourceChip } from '@/components/dashboard/bits';
import { Icons } from '@/components/dashboard/icons';
import { DEMO_EVENTS, formatTime } from '@/lib/demo-data';

export const metadata: Metadata = { title: 'Moderation' };

export default function ModerationPage() {
  const selected = DEMO_EVENTS.find((e) => e.id === 'ev-09')!;

  return (
    <>
      <Topbar title="Moderation" />
      <div className="content">
        <div className="card filterbar">
          <span className="input input-search grow" style={{ maxWidth: 320 }}>
            <Icons.search className="ic ic-sm" /> Search user or reason…
          </span>
          <span className="select">Category · All</span>
          <span className="select">Action · All</span>
          <span className="select">Source · All</span>
          <span className="select">This session</span>
          <span className="grow" />
          <button className="btn btn-outline btn-sm">
            <Icons.download className="ic ic-sm" /> Export
          </button>
        </div>

        <div className="grid-mod">
          <div className="card">
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>User</th>
                    <th>Category</th>
                    <th>Action</th>
                    <th>Source</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO_EVENTS.map((e) => (
                    <tr key={e.id} className={e.id === selected.id ? 'selected' : undefined}>
                      <td className="cell-time">{formatTime(e.at)}</td>
                      <td>
                        <span className="cell-user">
                          <Avatar login={e.userLogin} />
                          {e.userDisplay}
                        </span>
                      </td>
                      <td>
                        <span className="chip">{e.categoryLabel}</span>
                      </td>
                      <td>
                        <ActionChip event={e} />
                      </td>
                      <td>
                        <SourceChip source={e.source} />
                      </td>
                      <td className="cell-reason">{e.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pager">
              <span>Showing 1–10 of 96 actions this session</span>
              <span className="grow" />
              <button className="btn btn-outline btn-sm">← Previous</button>
              <button className="btn btn-outline btn-sm">Next →</button>
            </div>
          </div>

          {/* Event detail */}
          <div className="card card-pad">
            <div className="card-head" style={{ marginBottom: 10 }}>
              <div className="card-title">Event detail</div>
              <span className="chip chip-warn">
                <Icons.eye className="ic ic-sm" /> Warning 2/3
              </span>
            </div>
            <div className="row" style={{ marginBottom: 10 }}>
              <Avatar login={selected.userLogin} small={false} />
              <div>
                <b style={{ display: 'block' }}>{selected.userDisplay}</b>
                <span className="card-sub">First seen 34 min ago · 12 messages this stream</span>
              </div>
            </div>
            <div className="quote" style={{ textDecoration: 'line-through' }}>
              you&apos;re trash mia go back to fortnite
            </div>

            <div className="nav-label" style={{ padding: '16px 0 6px' }}>
              Context
            </div>
            <div className="ctx-line">
              <b style={{ color: '#6BD3FB' }}>mia_kplays</b> that boss fight was insane, clip it!!
            </div>
            <div className="ctx-line">
              <b style={{ color: '#F9A8D4' }}>xX_rager_Xx</b> <s>mia you got carried as usual</s>{' '}
              <span className="chip chip-warn" style={{ height: 19, fontSize: 10 }}>
                1/3
              </span>
            </div>
            <div className="ctx-line">
              <b style={{ color: '#86EFAC' }}>new_viewer42</b> gg that was clean
            </div>

            <div className="nav-label" style={{ padding: '16px 0 6px' }}>
              Decision path
            </div>
            <div className="pipeline">
              <div className="pipe-step">
                <Icons.bolt className="ic" style={{ color: 'var(--text-3)' }} />
                <span>Local score 0.58 — inside ambiguity band (0.35–0.75)</span>
              </div>
              <div className="pipe-step">
                <Icons.sparkles className="ic" style={{ color: 'var(--accent-2)' }} />
                <span>
                  AI verdict: <b>warn</b> · harassment · severity 1 · confidence 0.83
                </span>
              </div>
              <div className="pipe-step">
                <Icons.eye className="ic" style={{ color: 'var(--warn)' }} />
                <span>Ladder: strike 2/3 applied — message deleted, user warned in chat</span>
              </div>
            </div>

            <div className="note note-accent" style={{ marginTop: 14 }}>
              <Icons.sparkles className="ic" />
              <span>
                “Second targeted insult at the same chatter this stream, after a prior warning. Not
                banter: the target did not engage and the tone is demeaning.”
              </span>
            </div>

            <div className="row" style={{ marginTop: 16, flexWrap: 'wrap' }}>
              <button className="btn btn-outline btn-sm">
                <Icons.undo className="ic ic-sm" /> Undo
              </button>
              <button className="btn btn-danger btn-sm">
                <Icons.ban className="ic ic-sm" /> Ban user
              </button>
              <button className="btn btn-outline btn-sm">
                <Icons.flag className="ic ic-sm" /> False positive
              </button>
            </div>
            <p className="card-sub" style={{ marginTop: 12 }}>
              Processed in 1.24 s · Provider: Pollinations · Marking as false positive tunes this
              channel&apos;s thresholds.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
