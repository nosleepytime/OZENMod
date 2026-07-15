'use client';

import { useState } from 'react';
import { Topbar } from '@/components/dashboard/Topbar';
import { Icons } from '@/components/dashboard/icons';
import { Toggle, Segmented, Stepper } from '@/components/dashboard/Controls';
import { useConfig } from '@/lib/useConfig';
import type { LinkPolicy } from '@ozenmod/database';

export function FiltersClient() {
  const { config, patch } = useConfig();
  const filters = config.filters;
  const [term, setTerm] = useState('');
  const [severity, setSeverity] = useState<'low' | 'high'>('low');
  const [domain, setDomain] = useState('');

  const addTerm = () => {
    const t = term.trim().toLowerCase();
    if (!t || filters.bannedTerms.some((x) => x.term === t)) return;
    void patch({ 'filters/bannedTerms': [...filters.bannedTerms, { term: t, severity }] });
    setTerm('');
  };
  const removeTerm = (t: string) =>
    void patch({ 'filters/bannedTerms': filters.bannedTerms.filter((x) => x.term !== t) });

  const addDomain = () => {
    const d = domain.trim().toLowerCase();
    if (!d || filters.trustedDomains.includes(d)) return;
    void patch({ 'filters/trustedDomains': [...filters.trustedDomains, d] });
    setDomain('');
  };
  const removeDomain = (d: string) =>
    void patch({ 'filters/trustedDomains': filters.trustedDomains.filter((x) => x !== d) });

  return (
    <>
      <Topbar title="Filters" />
      <div className="content">
        <div className="grid-two">
          <div className="col-stack">
            <div className="card card-pad">
              <div className="card-head">
                <div>
                  <div className="card-title">Banned terms &amp; patterns</div>
                  <div className="card-sub">
                    Matched after normalization — leetspeak and homoglyphs are folded first
                  </div>
                </div>
              </div>
              <form
                className="row"
                style={{ marginBottom: 14 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  addTerm();
                }}
              >
                <span className="input grow">
                  <input
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder="Add a term or /regex/…"
                    aria-label="Banned term"
                  />
                </span>
                <button
                  type="button"
                  className="select"
                  style={{ minWidth: 110 }}
                  onClick={() => setSeverity((s) => (s === 'low' ? 'high' : 'low'))}
                >
                  Severity · {severity === 'low' ? 'Low' : 'High'}
                </button>
                <button className="btn btn-primary btn-sm" type="submit">
                  Add
                </button>
              </form>
              {filters.bannedTerms.length === 0 ? (
                <p className="card-sub">
                  No banned terms yet — the AI still catches most abuse contextually.
                </p>
              ) : (
                <div className="term-list">
                  {filters.bannedTerms.map((t) => (
                    <span className="term-chip" key={t.term}>
                      <span
                        className="sev"
                        style={{ color: t.severity === 'high' ? 'var(--danger)' : 'var(--warn)' }}
                      >
                        {t.severity}
                      </span>
                      {t.term}
                      <button aria-label={`Remove ${t.term}`} onClick={() => removeTerm(t.term)}>
                        <Icons.x className="ic ic-sm" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="card card-pad">
              <div className="card-head" style={{ marginBottom: 4 }}>
                <div className="card-title">Links &amp; domains</div>
              </div>
              <div className="set-row" style={{ paddingTop: 2 }}>
                <div className="set-info">
                  <b>Link policy</b>
                  <span>How links from non-exempt chatters are handled</span>
                </div>
                <Segmented<LinkPolicy>
                  value={filters.linkPolicy}
                  onChange={(v) => void patch({ 'filters/linkPolicy': v })}
                  options={[
                    { value: 'block-all', label: 'Block all' },
                    { value: 'trusted', label: 'Trusted only' },
                    { value: 'allow', label: 'Allow' },
                  ]}
                />
              </div>
              <div style={{ padding: '12px 0 4px' }}>
                <div className="field-label" style={{ marginBottom: 8 }}>
                  Trusted domains
                </div>
                <div className="term-list">
                  {filters.trustedDomains.map((d) => (
                    <span className="term-chip" key={d}>
                      {d}
                      <button aria-label={`Remove ${d}`} onClick={() => removeDomain(d)}>
                        <Icons.x className="ic ic-sm" />
                      </button>
                    </span>
                  ))}
                  <form
                    className="input"
                    style={{ height: 32 }}
                    onSubmit={(e) => {
                      e.preventDefault();
                      addDomain();
                    }}
                  >
                    <input
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      placeholder="Add domain…"
                      aria-label="Trusted domain"
                      style={{ width: 120 }}
                    />
                  </form>
                </div>
              </div>
            </div>
          </div>

          <div className="col-stack">
            <div className="card card-pad">
              <div className="card-head" style={{ marginBottom: 4 }}>
                <div className="card-title">Spam &amp; flood thresholds</div>
              </div>
              <div className="set-row">
                <div className="set-info">
                  <b>Message rate</b>
                  <span>Messages allowed per user per window</span>
                </div>
                <Stepper
                  value={filters.spam.ratePerWindow}
                  min={1}
                  max={30}
                  onChange={(v) => void patch({ 'filters/spam/ratePerWindow': v })}
                />
              </div>
              <div className="set-row">
                <div className="set-info">
                  <b>Capitals ratio</b>
                  <span>Delete messages above this share of capitals (%)</span>
                </div>
                <Stepper
                  value={filters.spam.capsPct}
                  min={40}
                  max={100}
                  onChange={(v) => void patch({ 'filters/spam/capsPct': v })}
                />
              </div>
              <div className="set-row">
                <div className="set-info">
                  <b>Emote limit</b>
                  <span>Maximum emotes per message</span>
                </div>
                <Stepper
                  value={filters.spam.emoteMax}
                  min={1}
                  max={50}
                  onChange={(v) => void patch({ 'filters/spam/emoteMax': v })}
                />
              </div>
            </div>

            <div className="card card-pad">
              <div className="card-head" style={{ marginBottom: 4 }}>
                <div className="card-title">Exemptions</div>
                <span className="card-sub">Who skips moderation</span>
              </div>
              {(['moderators', 'vips', 'subscribers', 'regulars'] as const).map((key) => (
                <div className="set-row" key={key}>
                  <div className="set-info">
                    <b style={{ textTransform: 'capitalize' }}>{key}</b>
                  </div>
                  <Toggle
                    checked={config.moderation.exemptions[key]}
                    onChange={(v) => void patch({ [`moderation/exemptions/${key}`]: v })}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
