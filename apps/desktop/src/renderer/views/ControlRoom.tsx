import { useEffect, useState } from 'react';
import type { ModerationEvent, ReviewItem } from '@ozenmod/shared';
import type { BotStatus, SystemInfo } from '../../ipc-contract';
import { getApi } from '../mock-api';
import { Icons } from '../icons';
import { Avatar, ActionChip, SourceChip, feedUserColor, formatTime } from '../components/bits';

function elapsed(startedAt: number | null): string {
  if (!startedAt) return '00:00:00';
  const s = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
}

export function ControlRoom() {
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [system, setSystem] = useState<SystemInfo | null>(null);
  const [feed, setFeed] = useState<ModerationEvent[]>([]);
  const [review, setReview] = useState<ReviewItem[]>([]);
  const [, forceTick] = useState(0);

  useEffect(() => {
    const api = getApi();
    void api.getStatus().then(setStatus);
    void api.getSystemInfo().then(setSystem);
    void api.getFeed().then(setFeed);
    void api.getReviewQueue().then(setReview);
    const off = api.onStatus(setStatus);
    const offFeed = api.onFeed((e) => setFeed((f) => [e, ...f].slice(0, 40)));
    const timer = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => {
      off();
      offFeed();
      clearInterval(timer);
    };
  }, []);

  if (!status) return <div className="view" />;
  const protecting = status.state === 'protecting';

  async function toggle() {
    const api = getApi();
    setStatus(protecting ? await api.stopBot() : await api.startBot());
  }

  return (
    <div className="view">
      <div className={`hero-status${protecting ? '' : ' idle'}`}>
        <div className="hero-grid">
          <span className={`status-dot-lg${protecting ? '' : ' idle'}`}>
            <Icons.shieldCheck className="ic" />
          </span>
          <div className="grow">
            <div className="row" style={{ gap: 10 }}>
              <b style={{ fontSize: 19 }}>
                {protecting ? `Protecting #${status.channel}` : `#${status.channel} — bot idle`}
              </b>
              {protecting ? (
                <span className="chip chip-danger">
                  <span className="dot pulse" /> LIVE
                </span>
              ) : (
                <span className="chip">Offline</span>
              )}
            </div>
            <div className="hero-chips">
              <span className={`chip ${status.health.twitch ? 'chip-good' : ''}`}>
                <Icons.twitch className="ic ic-sm ic-fill" fill="currentColor" strokeWidth={0} />{' '}
                Twitch {status.botAccount ? `· ${status.botAccount}` : ''}
              </span>
              <span className={`chip ${status.health.ai ? 'chip-good' : ''}`}>
                <Icons.sparkles className="ic ic-sm" /> AI · {status.health.aiProvider} ·{' '}
                {status.health.aiLatencyMs}ms
              </span>
              <span className={`chip ${status.health.eventSub ? 'chip-good' : ''}`}>
                <Icons.bolt className="ic ic-sm" /> EventSub
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right', marginRight: 6 }}>
            <div className="session-time">{elapsed(status.sessionStartedAt)}</div>
            <span className="card-sub">session time</span>
          </div>
          <button
            className={protecting ? 'btn btn-stop btn-lg' : 'btn btn-primary btn-lg'}
            onClick={() => void toggle()}
          >
            {protecting ? (
              <>
                <Icons.square className="ic" /> Stop bot
              </>
            ) : (
              <>
                <Icons.shieldCheck className="ic" /> Start bot
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mini-stats">
        <div className="card mini-stat">
          <b>{status.stats.messages.toLocaleString('en-US')}</b>
          <span>messages analyzed</span>
        </div>
        <div className="card mini-stat">
          <b>{status.stats.actions}</b>
          <span>actions taken</span>
        </div>
        <div className="card mini-stat">
          <b>{status.stats.aiCalls}</b>
          <span>AI calls · 1.7% of messages</span>
        </div>
        <div className="card mini-stat">
          <b style={{ color: 'var(--warn)' }}>{status.stats.reviewPending}</b>
          <span>waiting for your review</span>
        </div>
      </div>

      <div className="grid-main">
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-head" style={{ padding: '16px 18px 0', marginBottom: 4 }}>
            <div className="card-title">Live moderation feed</div>
            <span className="row" style={{ gap: 8 }}>
              <span className="chip chip-accent">Actions only</span>
              <span className="chip">All messages</span>
            </span>
          </div>
          <div className="feed">
            {feed.map((e) => (
              <div className={`feed-item${e.action === 'allow' ? ' calm' : ''}`} key={e.id}>
                <div className="feed-body">
                  <div className="feed-line">
                    <span className="feed-user" style={{ color: feedUserColor(e.userLogin) }}>
                      {e.userDisplay}
                    </span>
                    <span className="feed-time">{formatTime(e.at)}</span>
                  </div>
                  {e.reason ? (
                    <div className="feed-reason">
                      <ActionChip event={e} />
                      <SourceChip source={e.source} /> {e.reason}
                    </div>
                  ) : (
                    <div className="feed-reason">clean</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-stack">
          <div className="card card-pad" style={{ paddingBottom: 12 }}>
            <div className="card-head" style={{ marginBottom: 2 }}>
              <div className="card-title">
                <Icons.alert className="ic" style={{ color: 'var(--warn)' }} /> Human review
              </div>
              <span className="chip chip-warn">{review.length} pending</span>
            </div>
            {review.map((r) => (
              <div className="review-item" key={r.id}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="row" style={{ gap: 8 }}>
                    <Avatar login={r.userLogin} />
                    <b style={{ fontSize: 12.5 }}>{r.userLogin}</b>
                  </span>
                  <span className="card-sub">{formatTime(r.at)}</span>
                </div>
                <div className="review-quote">{r.snippet}</div>
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

          {system && (
            <div className="card card-pad" style={{ flex: 1 }}>
              <div className="card-head" style={{ marginBottom: 4 }}>
                <div className="card-title">System</div>
                <span className="chip chip-good">
                  <Icons.check className="ic ic-sm" /> Up to date
                </span>
              </div>
              <div className="sys-row">
                <span>App version</span>
                <b>{system.appVersion}</b>
              </div>
              <div className="sys-row">
                <span>CPU</span>
                <b>{system.cpuPercent}%</b>
              </div>
              <div className="sys-row">
                <span>Memory</span>
                <b>{system.memoryMb} MB</b>
              </div>
              <div className="sys-row">
                <span>Chat latency</span>
                <b>{system.chatLatencyMs} ms</b>
              </div>
              <div className="sys-row">
                <span>AI latency (p50)</span>
                <b>{(system.aiLatencyMs / 1000).toFixed(1)} s</b>
              </div>
              <div className="sys-row">
                <span>Cloud sync</span>
                <b style={{ color: 'var(--good)' }}>{system.lastSyncAt ? '12 s ago' : '—'}</b>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
