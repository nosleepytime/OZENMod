import { useState } from 'react';
import { Icons } from '../icons';

type Tab = 'general' | 'moderation' | 'ai' | 'advanced' | 'about';

export function SettingsView() {
  const [tab, setTab] = useState<Tab>('general');

  return (
    <div className="body" style={{ flex: 1 }}>
      <nav className="set-nav">
        <div className="nav-label">Settings</div>
        <button
          className={`nav-item${tab === 'general' ? ' active' : ''}`}
          onClick={() => setTab('general')}
        >
          <Icons.settings className="ic" /> General
        </button>
        <button
          className={`nav-item${tab === 'moderation' ? ' active' : ''}`}
          onClick={() => setTab('moderation')}
        >
          <Icons.sliders className="ic" /> Moderation
        </button>
        <button className={`nav-item${tab === 'ai' ? ' active' : ''}`} onClick={() => setTab('ai')}>
          <Icons.sparkles className="ic" /> AI provider
        </button>
        <button
          className={`nav-item${tab === 'advanced' ? ' active' : ''}`}
          onClick={() => setTab('advanced')}
        >
          <Icons.wrench className="ic" /> Advanced
        </button>
        <button
          className={`nav-item${tab === 'about' ? ' active' : ''}`}
          onClick={() => setTab('about')}
        >
          <Icons.info className="ic" /> About
        </button>
      </nav>

      <div className="set-body">
        {tab === 'general' && <GeneralTab />}
        {tab === 'ai' && <AiTab />}
        {tab === 'moderation' && (
          <Placeholder
            title="Moderation"
            note="The rule editor mirrors the web dashboard and syncs live. Wired with the engine in milestone M5."
          />
        )}
        {tab === 'advanced' && (
          <Placeholder
            title="Advanced"
            note="Log retention, local data folder and diagnostics land in milestone M7."
          />
        )}
        {tab === 'about' && <AboutTab />}
      </div>
    </div>
  );
}

function GeneralTab() {
  return (
    <>
      <div>
        <b style={{ fontSize: 17 }}>General</b>
        <p className="card-sub">How the app behaves on your computer</p>
      </div>
      <div className="note note-accent">
        <Icons.refresh className="ic" />
        <span>
          Moderation and AI settings sync with your web dashboard — change them anywhere, the bot
          picks them up live.
        </span>
      </div>
      <div className="card card-pad">
        <Row title="Launch at login" sub="Start OZENMod when your computer starts" on />
        <Row
          title="Auto-start bot when stream goes live"
          sub="Uses Twitch EventSub — never forget to protect a stream"
          on
        />
        <Row
          title="Minimize to tray"
          sub="Closing the window keeps the bot running in the tray"
          on
        />
        <Row
          title="Desktop notifications"
          sub="Review-queue items, severe actions and connection issues"
          on
        />
      </div>
      <div className="card card-pad">
        <div className="set-row" style={{ paddingTop: 2 }}>
          <div className="set-info">
            <b>Update channel</b>
            <span>Stable is recommended for streaming machines</span>
          </div>
          <span className="select">Stable</span>
        </div>
        <div className="row" style={{ padding: '14px 0 2px' }}>
          <span className="status-dot-lg" style={{ width: 38, height: 38, borderRadius: 11 }}>
            <Icons.check className="ic" />
          </span>
          <div className="grow">
            <b style={{ fontSize: 13.5 }}>OZENMod 0.1.0 — up to date</b>
            <div className="card-sub">
              Updates are downloaded from GitHub Releases and verified by checksum
            </div>
          </div>
          <button className="btn btn-outline btn-sm">
            <Icons.refresh className="ic ic-sm" /> Check for updates
          </button>
        </div>
      </div>
    </>
  );
}

function AiTab() {
  return (
    <>
      <div>
        <b style={{ fontSize: 17 }}>AI provider</b>
        <p className="card-sub">Keys are stored in your OS keychain — never uploaded</p>
      </div>
      <div className="card card-pad">
        <div className="set-row" style={{ paddingTop: 2 }}>
          <div className="set-info">
            <b>Active provider</b>
            <span>Pollinations is free and needs no key</span>
          </div>
          <span className="select">Pollinations (free)</span>
        </div>
        <div className="set-row">
          <div className="set-info">
            <b>API key</b>
            <span>Only required for OpenAI, Anthropic or Gemini</span>
          </div>
          <span className="chip chip-good">
            <Icons.check className="ic ic-sm" /> Not required
          </span>
        </div>
        <div className="row" style={{ paddingTop: 12 }}>
          <span className="chip chip-good">
            <Icons.check className="ic ic-sm" /> Connected · 142 ms
          </span>
          <button className="btn btn-outline btn-sm" style={{ marginLeft: 'auto' }}>
            <Icons.refresh className="ic ic-sm" /> Test connection
          </button>
        </div>
      </div>
    </>
  );
}

function AboutTab() {
  return (
    <>
      <div>
        <b style={{ fontSize: 17 }}>About</b>
      </div>
      <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span className="logo">
          <span className="logo-mark">
            <Icons.shield className="ic ic-fill" strokeWidth={0} fill="currentColor" />
          </span>
          <span className="logo-name" style={{ fontSize: 15 }}>
            OZEN<b style={{ color: 'var(--accent-2)', fontWeight: 800 }}>Mod</b>
          </span>
        </span>
        <p className="card-sub">Version 0.1.0 · MIT License · Open source</p>
        <p className="card-sub">
          Context-aware AI moderation for Twitch, running on your computer. Free to use, free to
          run.
        </p>
      </div>
    </>
  );
}

function Placeholder({ title, note }: { title: string; note: string }) {
  return (
    <>
      <div>
        <b style={{ fontSize: 17 }}>{title}</b>
      </div>
      <div className="note">
        <Icons.info className="ic" />
        <span>{note}</span>
      </div>
    </>
  );
}

function Row({ title, sub, on = false }: { title: string; sub: string; on?: boolean }) {
  const [value, setValue] = useState(on);
  return (
    <div className="set-row">
      <div className="set-info">
        <b>{title}</b>
        <span>{sub}</span>
      </div>
      <button
        className={`toggle${value ? ' on' : ''}`}
        onClick={() => setValue((v) => !v)}
        aria-label={title}
        aria-pressed={value}
      />
    </div>
  );
}
