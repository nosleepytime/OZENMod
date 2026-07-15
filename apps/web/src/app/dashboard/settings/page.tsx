import type { Metadata } from 'next';
import { Topbar } from '@/components/dashboard/Topbar';
import { Icons } from '@/components/dashboard/icons';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsPage() {
  return (
    <>
      <Topbar title="Settings" showLive={false} />
      <div className="content">
        <div className="grid-two">
          <div className="col-stack">
            {/* Channel & bot */}
            <div className="card card-pad">
              <div className="card-head">
                <div>
                  <div className="card-title">Channel &amp; bot</div>
                  <div className="card-sub">Who moderates, and where</div>
                </div>
                <button className="btn btn-outline btn-sm">
                  <Icons.refresh className="ic ic-sm" /> Re-check permissions
                </button>
              </div>
              <div className="set-row" style={{ paddingTop: 4 }}>
                <div className="row">
                  <span className="avatar">P</span>
                  <div className="set-info">
                    <b>pixelforge</b>
                    <span>Connected channel · Twitch</span>
                  </div>
                </div>
                <span className="chip chip-good">
                  <Icons.check className="ic ic-sm" /> Connected
                </span>
              </div>
              <div className="set-row">
                <div className="row">
                  <span
                    className="avatar"
                    style={{ background: 'linear-gradient(135deg,#7C5CFF,#5B3DF5)' }}
                  >
                    O
                  </span>
                  <div className="set-info">
                    <b>ozenmod_bot</b>
                    <span>Bot account · acts as moderator</span>
                  </div>
                </div>
                <span className="chip chip-good">
                  <Icons.check className="ic ic-sm" /> Moderator role verified
                </span>
              </div>
              <div className="set-row">
                <div className="set-info">
                  <b>Auto-start when stream goes live</b>
                  <span>Uses Twitch EventSub — the bot starts and stops with your stream</span>
                </div>
                <span className="toggle on" />
              </div>
            </div>

            {/* Warning ladder */}
            <div className="card card-pad">
              <div className="card-head">
                <div>
                  <div className="card-title">Warning ladder</div>
                  <div className="card-sub">
                    How repeat offenders escalate — counters reset every stream
                  </div>
                </div>
                <span className="seg">
                  <span className="seg-item active">Warn then sanction</span>
                  <span className="seg-item">Escalating timeouts</span>
                </span>
              </div>
              <div className="ladder">
                <div className="ladder-row">
                  <span className="strike-tag">
                    <span className="strike-num">1</span> Strike 1
                  </span>
                  <span className="card-sub">Delete the message and warn the user in chat</span>
                  <span className="select">Warn in chat</span>
                </div>
                <div className="ladder-row">
                  <span className="strike-tag">
                    <span className="strike-num">2</span> Strike 2
                  </span>
                  <span className="card-sub">Delete the message and warn again</span>
                  <span className="select">Warn in chat</span>
                </div>
                <div className="ladder-row final">
                  <span className="strike-tag">
                    <span className="strike-num">3</span> Final
                  </span>
                  <span className="card-sub">Final action when the last strike is reached</span>
                  <span className="select">Timeout · 30 minutes</span>
                </div>
              </div>
              <div className="set-row" style={{ marginTop: 6 }}>
                <div className="set-info">
                  <b>Maximum strikes</b>
                  <span>1 to 5 — severe content skips the ladder entirely</span>
                </div>
                <span className="select" style={{ minWidth: 90 }}>
                  3
                </span>
              </div>
              <div className="set-row">
                <div className="set-info">
                  <b>Counter reset</b>
                  <span>When strike counters go back to zero</span>
                </div>
                <span className="select">Per stream (recommended)</span>
              </div>
              <div className="note" style={{ marginTop: 12 }}>
                <Icons.info className="ic" />
                <span>
                  Warnings are temporary session data: they are deleted automatically when the final
                  action fires and when your stream ends. Nothing accumulates in the database.
                </span>
              </div>
            </div>
          </div>

          <div className="col-stack">
            {/* Notifications */}
            <div className="card card-pad">
              <div className="card-head" style={{ marginBottom: 4 }}>
                <div className="card-title">Notifications</div>
              </div>
              <div className="set-row">
                <div className="set-info">
                  <b>Desktop notifications</b>
                  <span>From the OZENMod app while the bot runs</span>
                </div>
                <span className="toggle on" />
              </div>
              <div className="set-row">
                <div className="set-info">
                  <b>Human review items</b>
                  <span>Notify when a message needs your decision</span>
                </div>
                <span className="toggle on" />
              </div>
              <div className="set-row">
                <div className="set-info">
                  <b>Bans &amp; severe actions</b>
                  <span>Notify on severity-3 instant actions</span>
                </div>
                <span className="toggle on" />
              </div>
            </div>

            {/* Data & privacy */}
            <div className="card card-pad">
              <div className="card-head" style={{ marginBottom: 4 }}>
                <div className="card-title">Data &amp; privacy</div>
              </div>
              <div className="set-row">
                <div className="set-info">
                  <b>Store message snippets</b>
                  <span>Keep the first 80 characters with moderation events (session only)</span>
                </div>
                <span className="toggle" />
              </div>
              <div className="set-row">
                <div className="set-info">
                  <b>Lifetime statistics</b>
                  <span>Keep anonymous counters across streams</span>
                </div>
                <span className="toggle on" />
              </div>
              <p className="card-sub" style={{ padding: '10px 0 4px' }}>
                Chat is analyzed in memory on your computer and never stored. Temporary session data
                (warnings, counters, queues) is deleted automatically when your stream ends.
              </p>
              <button
                className="btn btn-outline btn-sm"
                style={{ alignSelf: 'flex-start', marginTop: 8 }}
              >
                <Icons.trash className="ic ic-sm" /> Delete all my data
              </button>
            </div>

            {/* Danger zone */}
            <div className="card card-pad danger-zone">
              <div className="card-head" style={{ marginBottom: 4 }}>
                <div className="card-title" style={{ color: 'var(--danger)' }}>
                  <Icons.alert className="ic" style={{ color: 'var(--danger)' }} /> Danger zone
                </div>
              </div>
              <p className="card-sub">
                Disconnecting revokes the bot&apos;s tokens, clears local secrets and deletes your
                channel data from OZENMod. This cannot be undone.
              </p>
              <button className="btn btn-danger" style={{ alignSelf: 'flex-start', marginTop: 12 }}>
                <Icons.twitch className="ic ic-fill ic-sm" fill="currentColor" strokeWidth={0} />{' '}
                Disconnect Twitch
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
