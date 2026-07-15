import type { Metadata } from 'next';
import { Topbar } from '@/components/dashboard/Topbar';
import { Icons } from '@/components/dashboard/icons';
import { PROVIDERS, CATEGORY_SETTINGS, type ProviderId } from '@ozenmod/shared';

export const metadata: Metadata = { title: 'AI & Providers' };

function ProviderGlyph({ id }: { id: ProviderId }) {
  if (id === 'pollinations')
    return (
      <span
        className="provider-logo"
        style={{
          background: 'var(--accent-soft)',
          color: 'var(--accent-2)',
          borderColor: 'rgba(124,92,255,.35)',
        }}
      >
        <Icons.sparkles className="ic" />
      </span>
    );
  if (id === 'ollama')
    return (
      <span className="provider-logo">
        <Icons.cpu className="ic" />
      </span>
    );
  if (id === 'custom')
    return (
      <span className="provider-logo">
        <Icons.globe className="ic" />
      </span>
    );
  const letter = { openai: 'AI', anthropic: 'A', gemini: 'G' }[id] ?? '?';
  return <span className="provider-logo">{letter}</span>;
}

export default function AiProvidersPage() {
  return (
    <>
      <Topbar title="AI & Providers" />
      <div className="content">
        <div className="card-head" style={{ marginBottom: 0 }}>
          <div>
            <div className="card-title" style={{ fontSize: 15 }}>
              Providers
            </div>
            <div className="card-sub">
              The engine escalates only ambiguous messages to the active provider. Keys are entered
              in the desktop app and stored in your OS keychain — never uploaded.
            </div>
          </div>
        </div>

        <div className="providers-grid">
          {PROVIDERS.map((p) => (
            <div className={`card provider-card${p.isDefault ? ' active' : ''}`} key={p.id}>
              <div className="provider-head">
                <ProviderGlyph id={p.id} />
                <div>
                  <b>{p.label}</b>
                  <div className="card-sub">{p.subtitle}</div>
                </div>
                {p.isDefault && (
                  <span className="chip chip-good" style={{ marginLeft: 'auto' }}>
                    <span className="dot" /> Active
                  </span>
                )}
              </div>
              <p>{p.description}</p>
              {p.isDefault && (
                <div className="row">
                  <span className="field-label" style={{ width: 52 }}>
                    Model
                  </span>
                  <span className="select grow">{p.defaultModel}</span>
                </div>
              )}
              <div className="provider-foot">
                {p.isDefault ? (
                  <>
                    <span className="chip chip-good">
                      <Icons.check className="ic ic-sm" /> Connected · 142 ms
                    </span>
                    <button className="btn btn-outline btn-sm" style={{ marginLeft: 'auto' }}>
                      <Icons.refresh className="ic ic-sm" /> Test
                    </button>
                  </>
                ) : (
                  <>
                    <span className="chip">
                      {p.requiresApiKey ? (
                        <Icons.key className="ic ic-sm" />
                      ) : (
                        <Icons.check className="ic ic-sm" />
                      )}{' '}
                      {p.keyHint}
                    </span>
                    <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }}>
                      {p.id === 'ollama' ? 'Detect models' : 'Configure'}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="grid-esc">
          {/* Escalation */}
          <div className="card card-pad">
            <div className="card-head">
              <div>
                <div className="card-title">Escalation &amp; sensitivity</div>
                <div className="card-sub">
                  Local analysis decides most messages — the AI is called only inside the ambiguity
                  band
                </div>
              </div>
            </div>

            <div className="set-row" style={{ borderBottom: 0, paddingTop: 0 }}>
              <div className="set-info">
                <b>Sensitivity preset</b>
                <span>How strict the local scoring is before escalation</span>
              </div>
              <span className="seg">
                <span className="seg-item">Lenient</span>
                <span className="seg-item active">Balanced</span>
                <span className="seg-item">Strict</span>
              </span>
            </div>

            <div style={{ padding: '6px 0 18px' }}>
              <div className="band">
                <i
                  style={{
                    flex: '0 0 35%',
                    background: 'linear-gradient(90deg,rgba(52,211,153,.5),rgba(52,211,153,.25))',
                  }}
                />
                <i
                  style={{
                    flex: '0 0 40%',
                    background: 'linear-gradient(90deg,rgba(124,92,255,.45),rgba(124,92,255,.3))',
                  }}
                />
                <i
                  style={{
                    flex: 1,
                    background: 'linear-gradient(90deg,rgba(248,113,113,.35),rgba(248,113,113,.5))',
                  }}
                />
                <span className="band-marker" style={{ left: '35%' }} />
                <span className="band-marker" style={{ left: '75%' }} />
              </div>
              <div className="band-labels">
                <span className="band-zone" style={{ flex: '0 0 35%' }}>
                  Allow locally · score &lt; 0.35
                </span>
                <span className="band-zone" style={{ flex: '0 0 40%' }}>
                  Ask the AI · 0.35 – 0.75
                </span>
                <span className="band-zone">Act locally · score &gt; 0.75</span>
              </div>
            </div>

            <div className="set-row">
              <div className="set-info">
                <b>AI budget</b>
                <span>Maximum AI calls per minute — above it, the fallback applies</span>
              </div>
              <span className="stepper">
                <button>−</button>
                <span>20</span>
                <button>+</button>
              </span>
            </div>
            <div className="set-row">
              <div className="set-info">
                <b>When the AI is unavailable</b>
                <span>Applies on outage, timeout or exhausted budget</span>
              </div>
              <span className="select">Conservative local mode</span>
            </div>
            <div className="set-row">
              <div className="set-info">
                <b>Cache identical messages</b>
                <span>Reuse verdicts for repeated text (5 minutes) — cuts copypasta cost</span>
              </div>
              <span className="toggle on" />
            </div>
            <div className="set-row">
              <div className="set-info">
                <b>Send context window</b>
                <span>Include the last 10 messages so the AI can judge irony and targets</span>
              </div>
              <span className="toggle on" />
            </div>
          </div>

          {/* Categories */}
          <div className="card">
            <div className="card-head" style={{ padding: '18px 18px 0', marginBottom: 4 }}>
              <div>
                <div className="card-title">Categories</div>
                <div className="card-sub">
                  Which categories are enforced, and when the AI assists
                </div>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="table cat-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Detect</th>
                    <th>AI assist</th>
                    <th>Threshold</th>
                  </tr>
                </thead>
                <tbody>
                  {CATEGORY_SETTINGS.map((c) => (
                    <tr key={c.id}>
                      <td>{c.label}</td>
                      <td>
                        <span className="toggle on" />
                      </td>
                      <td>
                        <span className={`toggle${c.aiAssist ? ' on' : ''}`} />
                      </td>
                      <td>
                        <span className="chip" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {c.threshold.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="note" style={{ margin: '14px 18px 18px' }}>
              <Icons.info className="ic" />
              <span>
                Severe content (explicit threats, slurs, credential phishing) always triggers
                instant action, regardless of thresholds.
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
