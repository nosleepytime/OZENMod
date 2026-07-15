import type { Metadata } from 'next';
import { Topbar } from '@/components/dashboard/Topbar';
import { Avatar, ActionChip, SourceChip } from '@/components/dashboard/bits';
import { Icons } from '@/components/dashboard/icons';
import {
  DEMO_STATS,
  DEMO_ACTIVITY,
  DEMO_BREAKDOWN,
  DEMO_EVENTS,
  DEMO_REVIEW,
  formatNumber,
  formatTime,
} from '@/lib/demo-data';

export const metadata: Metadata = { title: 'Overview' };

const ACTIVITY_MAX = 2000;
const breakdownMax = Math.max(...DEMO_BREAKDOWN.map((b) => b.value));

export default function OverviewPage() {
  return (
    <>
      <Topbar title="Overview" />
      <div className="content">
        {/* Stat tiles */}
        <div className="stats-row">
          <div className="card stat">
            <span className="stat-label">
              <Icons.message className="ic ic-sm" /> Messages analyzed
            </span>
            <div className="stat-value">{formatNumber(DEMO_STATS.messagesAnalyzed)}</div>
            <span className="stat-delta up">↑ 8% vs last stream</span>
          </div>
          <div className="card stat">
            <span className="stat-label">
              <Icons.home className="ic ic-sm" /> Actions taken
            </span>
            <div className="stat-value">{DEMO_STATS.actionsTaken}</div>
            <span className="stat-delta flat">0.8% of messages</span>
          </div>
          <div className="card stat">
            <span className="stat-label">
              <Icons.sparkles className="ic ic-sm" /> AI calls
            </span>
            <div className="stat-value">{DEMO_STATS.aiCalls}</div>
            <span className="stat-delta flat">
              {DEMO_STATS.aiSharePct}% of messages · Pollinations
            </span>
          </div>
          <div className="card stat">
            <span className="stat-label">
              <Icons.eye className="ic ic-sm" /> Human review
            </span>
            <div className="stat-value">{DEMO_STATS.reviewPending}</div>
            <span className="stat-delta" style={{ color: 'var(--warn)' }}>
              pending your decision
            </span>
          </div>
        </div>

        {/* Chart + side column */}
        <div className="grid-main">
          <div className="card card-pad">
            <div className="card-head">
              <div>
                <div className="card-title">Chat activity</div>
                <div className="card-sub">Messages analyzed per 30 minutes — current session</div>
              </div>
              <span className="seg">
                <span className="seg-item active">Session</span>
                <span className="seg-item">7 days</span>
                <span className="seg-item">30 days</span>
              </span>
            </div>
            <div className="colchart">
              <div className="ylabels">
                <span>2,000</span>
                <span>1,500</span>
                <span>1,000</span>
                <span>500</span>
                <span>0</span>
              </div>
              <div>
                <div className="plot">
                  <div className="gl" style={{ top: 0 }} />
                  <div className="gl" style={{ top: '25%' }} />
                  <div className="gl" style={{ top: '50%' }} />
                  <div className="gl" style={{ top: '75%' }} />
                  <div className="baseline" />
                  <div className="cols">
                    {DEMO_ACTIVITY.map((d) => {
                      const h = (d.value / ACTIVITY_MAX) * 100;
                      return (
                        <div className="col-slot" key={d.label}>
                          {'highlight' in d && d.highlight && (
                            <span className="collab" style={{ bottom: `calc(${h}% + 6px)` }}>
                              {formatNumber(d.value)}
                            </span>
                          )}
                          <i className="colbar" style={{ height: `${h}%` }} />
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="xlabels">
                  {DEMO_ACTIVITY.map((d) => (
                    <span key={d.label}>{d.label}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="col-stack">
            <div className="card card-pad">
              <div className="card-head" style={{ marginBottom: 8 }}>
                <div className="card-title">Resolved locally</div>
              </div>
              <div className="hero-pct">{DEMO_STATS.resolvedLocallyPct}%</div>
              <div className="card-sub" style={{ marginBottom: 12 }}>
                of messages decided without an AI call
              </div>
              <div className="meter">
                <i
                  style={{
                    width: `${DEMO_STATS.resolvedLocallyPct}%`,
                    background: 'var(--series-1)',
                  }}
                />
                <i
                  style={{
                    width: `${100 - DEMO_STATS.resolvedLocallyPct}%`,
                    background: 'var(--series-2)',
                  }}
                />
              </div>
              <div className="legend" style={{ marginTop: 12 }}>
                <span>
                  <i style={{ background: 'var(--series-1)' }} />
                  Local · {formatNumber(DEMO_STATS.localCount)}
                </span>
                <span>
                  <i style={{ background: 'var(--series-2)' }} />
                  AI-assisted · {DEMO_STATS.aiCalls}
                </span>
              </div>
            </div>

            <div className="card card-pad">
              <div className="card-head" style={{ marginBottom: 10 }}>
                <div className="card-title">Actions breakdown</div>
                <span className="chip">{DEMO_STATS.actionsTaken} total</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {DEMO_BREAKDOWN.map((b) => (
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
          </div>

          {/* Recent actions */}
          <div className="card">
            <div className="card-head" style={{ padding: '18px 18px 0', marginBottom: 6 }}>
              <div>
                <div className="card-title">Recent actions</div>
                <div className="card-sub">
                  Every decision is explained — open Moderation for full context
                </div>
              </div>
              <a className="btn btn-outline btn-sm" href="/dashboard/moderation">
                View all →
              </a>
            </div>
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
                  {DEMO_EVENTS.slice(0, 6).map((e) => (
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Review queue + status */}
          <div className="col-stack">
            <div className="card card-pad">
              <div className="card-head" style={{ marginBottom: 4 }}>
                <div className="card-title">
                  <Icons.alert className="ic" style={{ color: 'var(--warn)' }} /> Human review
                </div>
                <span className="chip chip-warn">{DEMO_REVIEW.length} pending</span>
              </div>
              {DEMO_REVIEW.map((r) => (
                <div className="review-item" key={r.id}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span className="cell-user">
                      <Avatar login={r.userLogin} />
                      {r.userLogin}
                    </span>
                    <span className="cell-time">{formatTime(r.at)}</span>
                  </div>
                  <div className="review-quote">{r.snippet}</div>
                  <span className="card-sub">
                    {r.note} · confidence {r.confidence}
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
              ))}
            </div>

            <div className="card syncbar">
              <span className="chip chip-good">
                <span className="dot" /> App v0.1.0
              </span>
              <span className="chip">
                <Icons.bolt className="ic ic-sm" /> EventSub listening
              </span>
              <span className="chip">
                <Icons.check className="ic ic-sm" /> Synced 12 s ago
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
