'use client';

import { Topbar } from '@/components/dashboard/Topbar';
import { Avatar, ActionChip, SourceChip } from '@/components/dashboard/bits';
import { Icons } from '@/components/dashboard/icons';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useChannelData } from '@/lib/useChannelData';
import { formatNumber, formatTime } from '@/lib/format';
import { recentToEvent as toEvent } from '@/lib/event-map';

export function OverviewClient() {
  const data = useChannelData();
  const { lifetime, counters, recent, review, online } = data;

  const messages = counters?.messages ?? lifetime?.messagesAnalyzed ?? 0;
  const actions =
    (counters
      ? counters.deleted + counters.timeouts + counters.bans + counters.warningsIssued
      : lifetime?.actionsTaken) ?? 0;
  const aiCalls = counters?.aiCalls ?? lifetime?.aiCalls ?? 0;
  const hasAnyData =
    messages > 0 || actions > 0 || recent.length > 0 || (lifetime?.sessions ?? 0) > 0;

  const localShare =
    messages > 0 ? Math.max(0, Math.round(((messages - aiCalls) / messages) * 1000) / 10) : 0;

  const breakdown = [
    { label: 'Deleted', value: counters?.deleted ?? 0 },
    { label: 'Warnings', value: counters?.warningsIssued ?? 0 },
    { label: 'Timeouts', value: counters?.timeouts ?? 0 },
    { label: 'Reviewed', value: counters?.reviewed ?? 0 },
    { label: 'Bans', value: counters?.bans ?? 0 },
  ];
  const breakdownMax = Math.max(1, ...breakdown.map((b) => b.value));

  return (
    <>
      <Topbar title="Overview" />
      <div className="content">
        <div className="stats-row">
          <div className="card stat">
            <span className="stat-label">
              <Icons.message className="ic ic-sm" /> Messages analyzed
            </span>
            <div className="stat-value">{formatNumber(messages)}</div>
            <span className="stat-delta flat">{online ? 'this session' : 'lifetime'}</span>
          </div>
          <div className="card stat">
            <span className="stat-label">
              <Icons.home className="ic ic-sm" /> Actions taken
            </span>
            <div className="stat-value">{formatNumber(actions)}</div>
            <span className="stat-delta flat">
              {messages > 0 ? `${((actions / messages) * 100).toFixed(1)}% of messages` : '—'}
            </span>
          </div>
          <div className="card stat">
            <span className="stat-label">
              <Icons.sparkles className="ic ic-sm" /> AI calls
            </span>
            <div className="stat-value">{formatNumber(aiCalls)}</div>
            <span className="stat-delta flat">
              {messages > 0 ? `${((aiCalls / messages) * 100).toFixed(1)}% of messages` : '—'}
            </span>
          </div>
          <div className="card stat">
            <span className="stat-label">
              <Icons.eye className="ic ic-sm" /> Human review
            </span>
            <div className="stat-value">{review.length}</div>
            <span
              className="stat-delta"
              style={{ color: review.length ? 'var(--warn)' : undefined }}
            >
              {review.length ? 'pending your decision' : 'nothing pending'}
            </span>
          </div>
        </div>

        {!hasAnyData ? (
          <div className="card">
            <EmptyState
              title="No activity yet"
              body="Open the OZENMod desktop app, connect Twitch and start the bot before your stream. Your live moderation, stats and history will appear here in real time."
            />
          </div>
        ) : (
          <div className="grid-main">
            <div className="card card-pad">
              <div className="card-head" style={{ marginBottom: 10 }}>
                <div className="card-title">Resolved locally</div>
              </div>
              <div className="hero-pct">{localShare}%</div>
              <div className="card-sub" style={{ marginBottom: 12 }}>
                of messages decided without an AI call
              </div>
              <div className="meter">
                <i style={{ width: `${localShare}%`, background: 'var(--series-1)' }} />
                <i style={{ width: `${100 - localShare}%`, background: 'var(--series-2)' }} />
              </div>
              <div className="legend" style={{ marginTop: 12 }}>
                <span>
                  <i style={{ background: 'var(--series-1)' }} />
                  Local · {formatNumber(Math.max(0, messages - aiCalls))}
                </span>
                <span>
                  <i style={{ background: 'var(--series-2)' }} />
                  AI-assisted · {formatNumber(aiCalls)}
                </span>
              </div>
            </div>

            <div className="card card-pad">
              <div className="card-head" style={{ marginBottom: 10 }}>
                <div className="card-title">Actions breakdown</div>
                <span className="chip">{actions} total</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {breakdown.map((b) => (
                  <div className="hbar-row" key={b.label}>
                    <span className="lbl">{b.label}</span>
                    <div>
                      <div
                        className="hbar"
                        style={{ width: `${(b.value / breakdownMax) * 100}%` }}
                      />
                    </div>
                    <span className="val">{b.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-head" style={{ padding: '18px 18px 0', marginBottom: 6 }}>
                <div>
                  <div className="card-title">Recent actions</div>
                  <div className="card-sub">
                    Live from your session — every decision is explained
                  </div>
                </div>
                <a className="btn btn-outline btn-sm" href="/dashboard/moderation">
                  View all →
                </a>
              </div>
              {recent.length === 0 ? (
                <EmptyState
                  compact
                  title="No actions yet"
                  body="Moderation events will stream in here as they happen."
                />
              ) : (
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
                      {recent.slice(0, 6).map((r) => {
                        const e = toEvent(r);
                        return (
                          <tr key={e.id}>
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
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card card-pad">
              <div className="card-head" style={{ marginBottom: 4 }}>
                <div className="card-title">
                  <Icons.alert className="ic" style={{ color: 'var(--warn)' }} /> Human review
                </div>
                <span className="chip chip-warn">{review.length} pending</span>
              </div>
              {review.length === 0 ? (
                <EmptyState
                  compact
                  title="Queue is clear"
                  body="Messages the AI is unsure about will appear here for your call."
                />
              ) : (
                review.map((r) => (
                  <div className="review-item" key={r.id}>
                    <div className="row" style={{ justifyContent: 'space-between' }}>
                      <span className="cell-user">
                        <Avatar login={r.user} />
                        {r.user}
                      </span>
                      <span className="cell-time">{formatTime(r.t)}</span>
                    </div>
                    {r.snippet && <div className="review-quote">{r.snippet}</div>}
                    <span className="card-sub">
                      {r.category} · confidence {r.confidence}
                    </span>
                    <div className="row">
                      <button className="btn btn-good btn-sm">
                        <Icons.check className="ic ic-sm" /> Approve
                      </button>
                      <button className="btn btn-danger btn-sm">
                        <Icons.x className="ic ic-sm" /> Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
