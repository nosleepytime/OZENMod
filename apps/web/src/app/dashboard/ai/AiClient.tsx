'use client';

import { Topbar } from '@/components/dashboard/Topbar';
import { Icons } from '@/components/dashboard/icons';
import { Toggle, Segmented, Stepper } from '@/components/dashboard/Controls';
import { useConfig } from '@/lib/useConfig';
import { PROVIDERS, type ProviderId, type Sensitivity } from '@ozenmod/shared';

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

const CATEGORY_LABELS: Record<string, string> = {
  harassment: 'Harassment & insults',
  hate: 'Hate & discrimination',
  threat: 'Threats & violence',
  sexual: 'Sexual content',
  spam: 'Spam & flood',
  scam: 'Scam & phishing',
  advertising: 'Advertising',
  toxicity: 'General toxicity',
};

export function AiClient() {
  const { config, patch } = useConfig();
  const activeProvider = config.ai.provider;

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
          {PROVIDERS.map((p) => {
            const active = p.id === activeProvider;
            return (
              <div className={`card provider-card${active ? ' active' : ''}`} key={p.id}>
                <div className="provider-head">
                  <ProviderGlyph id={p.id} />
                  <div>
                    <b>{p.label}</b>
                    <div className="card-sub">{p.subtitle}</div>
                  </div>
                  {active && (
                    <span className="chip chip-good" style={{ marginLeft: 'auto' }}>
                      <span className="dot" /> Active
                    </span>
                  )}
                </div>
                <p>{p.description}</p>
                <div className="provider-foot">
                  <span className="chip">
                    {p.requiresApiKey ? (
                      <Icons.key className="ic ic-sm" />
                    ) : (
                      <Icons.check className="ic ic-sm" />
                    )}{' '}
                    {p.keyHint}
                  </span>
                  {active ? (
                    <span className="chip chip-good" style={{ marginLeft: 'auto' }}>
                      <Icons.check className="ic ic-sm" /> Selected
                    </span>
                  ) : (
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ marginLeft: 'auto' }}
                      onClick={() => void patch({ 'ai/provider': p.id })}
                    >
                      Use this
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid-esc">
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

            <div className="set-row">
              <div className="set-info">
                <b>Sensitivity preset</b>
                <span>How strict the local scoring is before escalation</span>
              </div>
              <Segmented<Sensitivity>
                value={config.moderation.sensitivity}
                onChange={(v) => void patch({ 'moderation/sensitivity': v })}
                options={[
                  { value: 'lenient', label: 'Lenient' },
                  { value: 'balanced', label: 'Balanced' },
                  { value: 'strict', label: 'Strict' },
                ]}
              />
            </div>
            <div className="set-row">
              <div className="set-info">
                <b>AI budget</b>
                <span>Maximum AI calls per minute — above it, the fallback applies</span>
              </div>
              <Stepper
                value={config.ai.maxCallsPerMinute}
                min={1}
                max={120}
                onChange={(v) => void patch({ 'ai/maxCallsPerMinute': v })}
              />
            </div>
            <div className="set-row">
              <div className="set-info">
                <b>When the AI is unavailable</b>
                <span>Applies on outage, timeout or exhausted budget</span>
              </div>
              <Segmented
                value={config.ai.fallback}
                onChange={(v) => void patch({ 'ai/fallback': v })}
                options={[
                  { value: 'conservative-local', label: 'Conservative' },
                  { value: 'strict-local', label: 'Strict' },
                ]}
              />
            </div>
            <div className="set-row">
              <div className="set-info">
                <b>First-time chatter boost</b>
                <span>Scrutinize brand-new chatters a little more closely</span>
              </div>
              <Toggle
                checked={config.moderation.firstTimeChatterBoost}
                onChange={(v) => void patch({ 'moderation/firstTimeChatterBoost': v })}
              />
            </div>
          </div>

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
                  {Object.entries(config.moderation.categories).map(([id, c]) => (
                    <tr key={id}>
                      <td>{CATEGORY_LABELS[id] ?? id}</td>
                      <td>
                        <Toggle
                          checked={c.detect}
                          onChange={(v) =>
                            void patch({ [`moderation/categories/${id}/detect`]: v })
                          }
                        />
                      </td>
                      <td>
                        <Toggle
                          checked={c.aiAssist}
                          onChange={(v) =>
                            void patch({ [`moderation/categories/${id}/aiAssist`]: v })
                          }
                        />
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
