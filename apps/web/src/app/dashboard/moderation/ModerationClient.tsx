'use client';

import { useState } from 'react';
import { Topbar } from '@/components/dashboard/Topbar';
import { Avatar, ActionChip, SourceChip } from '@/components/dashboard/bits';
import { Icons } from '@/components/dashboard/icons';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useChannelData } from '@/lib/useChannelData';
import { recentToEvent } from '@/lib/event-map';
import { formatTime } from '@/lib/format';

export function ModerationClient() {
  const { recent } = useChannelData();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const events = recent.map((r) => ({ raw: r, event: recentToEvent(r) }));
  const selected = events.find((e) => e.event.id === selectedId) ?? events[0] ?? null;

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
          <span className="grow" />
          <button className="btn btn-outline btn-sm">
            <Icons.download className="ic ic-sm" /> Export
          </button>
        </div>

        {events.length === 0 ? (
          <div className="card">
            <EmptyState
              title="No moderation history yet"
              body="Once the desktop bot is running, every decision it makes — with the reason behind it — will be listed here in real time."
            />
          </div>
        ) : (
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
                    {events.map(({ event: e }) => (
                      <tr
                        key={e.id}
                        className={selected?.event.id === e.id ? 'selected' : undefined}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedId(e.id)}
                      >
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
                <span>
                  {events.length} action{events.length === 1 ? '' : 's'} this session
                </span>
                <span className="grow" />
                <button className="btn btn-outline btn-sm">← Previous</button>
                <button className="btn btn-outline btn-sm">Next →</button>
              </div>
            </div>

            {selected && (
              <div className="card card-pad">
                <div className="card-head" style={{ marginBottom: 10 }}>
                  <div className="card-title">Event detail</div>
                  <ActionChip event={selected.event} />
                </div>
                <div className="row" style={{ marginBottom: 10 }}>
                  <Avatar login={selected.event.userLogin} small={false} />
                  <div>
                    <b style={{ display: 'block' }}>{selected.event.userDisplay}</b>
                    <span className="card-sub">{selected.raw.category || 'Moderation event'}</span>
                  </div>
                </div>

                <div className="note note-accent" style={{ marginTop: 6 }}>
                  <Icons.sparkles className="ic" />
                  <span>{selected.event.reason || 'No reason recorded.'}</span>
                </div>

                <div className="nav-label" style={{ padding: '16px 0 6px' }}>
                  Details
                </div>
                <div className="pipeline">
                  <div className="pipe-step">
                    <Icons.clock className="ic" style={{ color: 'var(--text-3)' }} />
                    <span>{formatTime(selected.event.at)}</span>
                  </div>
                  <div className="pipe-step">
                    <SourceChip source={selected.event.source} />
                    <span>Decision source</span>
                  </div>
                  {selected.event.strike && (
                    <div className="pipe-step">
                      <Icons.eye className="ic" style={{ color: 'var(--warn)' }} />
                      <span>Warning ladder: strike {selected.event.strike}</span>
                    </div>
                  )}
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
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
