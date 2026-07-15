import type { Metadata } from 'next';
import { Topbar } from '@/components/dashboard/Topbar';
import { Icons } from '@/components/dashboard/icons';
import { DEMO_BANNED_TERMS, DEMO_TRUSTED_DOMAINS } from '@/lib/demo-data';

export const metadata: Metadata = { title: 'Filters' };

export default function FiltersPage() {
  return (
    <>
      <Topbar title="Filters" />
      <div className="content">
        <div className="grid-two">
          <div className="col-stack">
            {/* Banned terms */}
            <div className="card card-pad">
              <div className="card-head">
                <div>
                  <div className="card-title">Banned terms &amp; patterns</div>
                  <div className="card-sub">
                    Matched after normalization — leetspeak and homoglyphs are folded first
                  </div>
                </div>
              </div>
              <div className="row" style={{ marginBottom: 14 }}>
                <span className="input grow">
                  <Icons.search className="ic ic-sm" style={{ color: 'var(--text-3)' }} /> Add a
                  term or /regex/…
                </span>
                <span className="select" style={{ minWidth: 110 }}>
                  Severity · Low
                </span>
                <button className="btn btn-primary btn-sm">Add</button>
              </div>
              <div className="term-list">
                {DEMO_BANNED_TERMS.map((t) => (
                  <span className="term-chip" key={t.term}>
                    <span
                      className="sev"
                      style={{ color: t.severity === 'high' ? 'var(--danger)' : 'var(--warn)' }}
                    >
                      {t.severity}
                    </span>
                    {t.term}
                    <button aria-label={`Remove ${t.term}`}>
                      <Icons.x className="ic ic-sm" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="note" style={{ marginTop: 16 }}>
                <Icons.info className="ic" />
                <span>
                  High-severity terms trigger instant action; low-severity terms add a strike
                  through the warning ladder.
                </span>
              </div>
            </div>

            {/* Links */}
            <div className="card card-pad">
              <div className="card-head" style={{ marginBottom: 4 }}>
                <div className="card-title">Links &amp; domains</div>
              </div>
              <div className="set-row" style={{ paddingTop: 2 }}>
                <div className="set-info">
                  <b>Link policy</b>
                  <span>How links from non-exempt chatters are handled</span>
                </div>
                <span className="seg">
                  <span className="seg-item">Block all</span>
                  <span className="seg-item active">Trusted only</span>
                  <span className="seg-item">Allow</span>
                </span>
              </div>
              <div style={{ padding: '12px 0 4px' }}>
                <div className="field-label" style={{ marginBottom: 8 }}>
                  Trusted domains
                </div>
                <div className="term-list">
                  {DEMO_TRUSTED_DOMAINS.map((d) => (
                    <span className="term-chip" key={d}>
                      {d}
                      <button aria-label={`Remove ${d}`}>
                        <Icons.x className="ic ic-sm" />
                      </button>
                    </span>
                  ))}
                  <span className="input" style={{ height: 32 }}>
                    <Icons.search className="ic ic-sm" style={{ color: 'var(--text-3)' }} /> Add
                    domain…
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="col-stack">
            {/* Spam & flood */}
            <div className="card card-pad">
              <div className="card-head" style={{ marginBottom: 4 }}>
                <div className="card-title">Spam &amp; flood thresholds</div>
              </div>
              <div className="set-row">
                <div className="set-info">
                  <b>Message rate</b>
                  <span>Messages allowed per user in a sliding window</span>
                </div>
                <span className="select" style={{ minWidth: 120 }}>
                  5 per 10 s
                </span>
              </div>
              <div className="set-row">
                <div className="set-info">
                  <b>Capitals ratio</b>
                  <span>Delete messages above this share of capitals</span>
                </div>
                <span className="select" style={{ minWidth: 90 }}>
                  70%
                </span>
              </div>
              <div className="set-row">
                <div className="set-info">
                  <b>Emote limit</b>
                  <span>Maximum emotes per message</span>
                </div>
                <span className="stepper">
                  <button>−</button>
                  <span>12</span>
                  <button>+</button>
                </span>
              </div>
              <div className="set-row">
                <div className="set-info">
                  <b>Repeated messages</b>
                  <span>Near-duplicate messages before action</span>
                </div>
                <span className="stepper">
                  <button>−</button>
                  <span>3</span>
                  <button>+</button>
                </span>
              </div>
            </div>

            {/* Exemptions */}
            <div className="card card-pad">
              <div className="card-head" style={{ marginBottom: 4 }}>
                <div className="card-title">Exemptions</div>
                <span className="card-sub">Who skips moderation</span>
              </div>
              <div className="set-row">
                <div className="set-info">
                  <b>Moderators</b>
                  <span>Always exempt</span>
                </div>
                <span className="toggle on" />
              </div>
              <div className="set-row">
                <div className="set-info">
                  <b>VIPs</b>
                </div>
                <span className="toggle on" />
              </div>
              <div className="set-row">
                <div className="set-info">
                  <b>Subscribers</b>
                  <span>Links allowed, still checked for severe content</span>
                </div>
                <span className="toggle" />
              </div>
              <div className="set-row">
                <div className="set-info">
                  <b>Regulars</b>
                  <span>Chatters seen across many streams</span>
                </div>
                <span className="toggle" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
