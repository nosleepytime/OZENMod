'use client';

import { ref, remove } from 'firebase/database';
import { Topbar } from '@/components/dashboard/Topbar';
import { Icons } from '@/components/dashboard/icons';
import { Toggle, Segmented, Stepper } from '@/components/dashboard/Controls';
import { useConfig } from '@/lib/useConfig';
import { useAuth } from '@/components/auth/AuthProvider';
import { getFirebaseDb } from '@/lib/firebase-client';
import { avatarGradient } from '@/lib/format';
import { paths, type WarningMode } from '@ozenmod/database';

function finalLabel(action: 'timeout' | 'ban', seconds: number): string {
  if (action === 'ban') return 'Ban';
  const m = Math.round(seconds / 60);
  return `Timeout · ${m} minute${m === 1 ? '' : 's'}`;
}

export function SettingsClient() {
  const { user, signOut } = useAuth();
  const { config, patch } = useConfig();
  const warnings = config.warnings;
  const finalSeconds = warnings.finalAction.seconds ?? 1800;
  const finalMinutes = Math.round(finalSeconds / 60);
  const strikeCount = Math.max(1, warnings.maxStrikes);
  const login = user?.login ?? '—';
  const initial = (login[0] ?? 'O').toUpperCase();

  async function disconnect() {
    if (
      !window.confirm('Disconnect Twitch and sign out? The bot will stop moderating your channel.')
    )
      return;
    await signOut();
  }

  async function deleteData() {
    if (!user) return;
    if (
      !window.confirm(
        'Delete all your OZENMod data? This removes your settings and history and cannot be undone.',
      )
    )
      return;
    const db = getFirebaseDb();
    if (db) {
      await remove(ref(db, paths.channel(user.uid)));
      await remove(ref(db, paths.session(user.uid)));
    }
    await signOut();
  }

  return (
    <>
      <Topbar title="Settings" />
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
              </div>
              <div className="set-row" style={{ paddingTop: 4 }}>
                <div className="row">
                  {user?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt=""
                      className="avatar"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <span className="avatar" style={{ background: avatarGradient(login) }}>
                      {initial}
                    </span>
                  )}
                  <div className="set-info">
                    <b>{login}</b>
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
                    <b>{config.general.botAccount ?? 'Your account'}</b>
                    <span>Bot account · acts as moderator</span>
                  </div>
                </div>
                <span className="chip">
                  {config.general.botAccount ? 'Dedicated bot' : 'Moderating as you'}
                </span>
              </div>
              <div className="set-row">
                <div className="set-info">
                  <b>Auto-start when stream goes live</b>
                  <span>Uses Twitch EventSub — the bot starts and stops with your stream</span>
                </div>
                <Toggle
                  checked={config.general.autoStartOnLive}
                  onChange={(v) => void patch({ 'general/autoStartOnLive': v })}
                />
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
                <Segmented<WarningMode>
                  value={warnings.mode}
                  onChange={(v) => void patch({ 'warnings/mode': v })}
                  options={[
                    { value: 'warn-then-sanction', label: 'Warn then sanction' },
                    { value: 'escalating-timeouts', label: 'Escalating timeouts' },
                  ]}
                />
              </div>
              <div className="ladder">
                {Array.from({ length: strikeCount }, (_, i) => {
                  const n = i + 1;
                  const isFinal = n === strikeCount;
                  return (
                    <div className={`ladder-row${isFinal ? ' final' : ''}`} key={n}>
                      <span className="strike-tag">
                        <span className="strike-num">{n}</span> {isFinal ? 'Final' : `Strike ${n}`}
                      </span>
                      <span className="card-sub">
                        {isFinal
                          ? 'Final action when the last strike is reached'
                          : 'Delete the message and warn the user in chat'}
                      </span>
                      <span className="select">
                        {isFinal
                          ? finalLabel(warnings.finalAction.action, finalSeconds)
                          : 'Warn in chat'}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="set-row" style={{ marginTop: 6 }}>
                <div className="set-info">
                  <b>Maximum strikes</b>
                  <span>1 to 5 — severe content skips the ladder entirely</span>
                </div>
                <Stepper
                  value={warnings.maxStrikes}
                  min={1}
                  max={5}
                  onChange={(v) => void patch({ 'warnings/maxStrikes': v })}
                />
              </div>
              <div className="set-row">
                <div className="set-info">
                  <b>Final action</b>
                  <span>What happens when the last strike is reached</span>
                </div>
                <Segmented<'timeout' | 'ban'>
                  value={warnings.finalAction.action}
                  onChange={(v) =>
                    void patch({
                      'warnings/finalAction':
                        v === 'ban'
                          ? { action: 'ban' }
                          : { action: 'timeout', seconds: finalSeconds },
                    })
                  }
                  options={[
                    { value: 'timeout', label: 'Timeout' },
                    { value: 'ban', label: 'Ban' },
                  ]}
                />
              </div>
              {warnings.finalAction.action === 'timeout' && (
                <div className="set-row">
                  <div className="set-info">
                    <b>Timeout length</b>
                    <span>Duration of the final timeout, in minutes</span>
                  </div>
                  <Stepper
                    value={finalMinutes}
                    min={1}
                    max={120}
                    onChange={(v) =>
                      void patch({ 'warnings/finalAction': { action: 'timeout', seconds: v * 60 } })
                    }
                  />
                </div>
              )}
              <div className="set-row">
                <div className="set-info">
                  <b>Counter reset</b>
                  <span>When strike counters go back to zero</span>
                </div>
                <Segmented<'per-stream' | 'per-day'>
                  value={warnings.reset}
                  onChange={(v) => void patch({ 'warnings/reset': v })}
                  options={[
                    { value: 'per-stream', label: 'Per stream' },
                    { value: 'per-day', label: 'Per day' },
                  ]}
                />
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
                <Toggle
                  checked={config.privacy.storeSnippets}
                  onChange={(v) => void patch({ 'privacy/storeSnippets': v })}
                />
              </div>
              <p className="card-sub" style={{ padding: '10px 0 4px' }}>
                Chat is analyzed in memory on your computer and never stored. Temporary session data
                (warnings, counters, queues) is deleted automatically when your stream ends.
              </p>
              <button
                className="btn btn-outline btn-sm"
                style={{ alignSelf: 'flex-start', marginTop: 8 }}
                onClick={() => void deleteData()}
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
                Disconnecting signs you out and stops the bot from moderating your channel. Your
                settings stay saved unless you also delete your data.
              </p>
              <button
                className="btn btn-danger"
                style={{ alignSelf: 'flex-start', marginTop: 12 }}
                onClick={() => void disconnect()}
              >
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
