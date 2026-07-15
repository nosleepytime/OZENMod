import { useEffect, useState } from 'react';
import type { DeviceCodeState } from '../../ipc-contract';
import { getApi } from '../mock-api';
import { Icons } from '../icons';

/** First-run wizard. Step 2 shows the Twitch device code (docs/PRODUCT.md §6.1). */
export function Onboarding({ onDone }: { onDone: () => void }) {
  const [device, setDevice] = useState<DeviceCodeState | null>(null);

  useEffect(() => {
    void getApi().beginTwitchAuth().then(setDevice);
  }, []);

  const mins = device ? Math.floor(device.expiresInSeconds / 60) : 0;
  const secs = device ? device.expiresInSeconds % 60 : 0;

  return (
    <div className="ob">
      <div className="ob-brand">
        <span
          className="logo"
          style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 14 }}
        >
          <span className="logo-mark" style={{ width: 44, height: 44, borderRadius: 13 }}>
            <Icons.shield
              className="ic ic-fill"
              strokeWidth={0}
              fill="currentColor"
              style={{ width: 22, height: 22 }}
            />
          </span>
          <span className="logo-name" style={{ fontSize: 20 }}>
            OZEN<b style={{ color: 'var(--accent-2)', fontWeight: 800 }}>Mod</b>
          </span>
        </span>
        <p style={{ color: 'var(--text-2)', fontSize: 13, lineHeight: 1.6 }}>
          AI moderation that runs on your computer and understands your chat.
        </p>
        <div className="ob-points">
          <span className="row">
            <Icons.check className="ic" /> Free forever — no subscription, no server
          </span>
          <span className="row">
            <Icons.check className="ic" /> Context-aware decisions, always explained
          </span>
          <span className="row">
            <Icons.check className="ic" /> Your chat never leaves your machine
          </span>
        </div>
      </div>

      <div className="ob-main">
        <div className="steps">
          <span className="step done">
            <span className="step-dot">
              <Icons.check className="ic ic-sm" />
            </span>{' '}
            Welcome
          </span>
          <span className="step-line" />
          <span className="step current">
            <span className="step-dot">2</span> Connect Twitch
          </span>
          <span className="step-line" />
          <span className="step">
            <span className="step-dot">3</span> Ready
          </span>
        </div>

        <h1 style={{ fontSize: 24 }}>Connect your Twitch account</h1>
        <p style={{ color: 'var(--text-2)', marginTop: 8, fontSize: 13.5 }}>
          OZENMod uses Twitch&apos;s device flow — no password ever touches this app. You can
          connect your own account or a dedicated bot account.
        </p>

        <div className="code-box">{device?.userCode ?? '········'}</div>
        <p style={{ color: 'var(--text-3)', fontSize: 12.5, textAlign: 'center' }}>
          Enter this code at <b style={{ color: 'var(--text-2)' }}>twitch.tv/activate</b>
        </p>

        <div className="row" style={{ marginTop: 20, gap: 12 }}>
          <button className="btn btn-twitch btn-lg" style={{ flex: 1 }}>
            <Icons.twitch className="ic ic-fill" fill="currentColor" strokeWidth={0} /> Open
            twitch.tv/activate <Icons.external className="ic ic-sm" />
          </button>
        </div>

        <div className="waiting" style={{ marginTop: 16, justifyContent: 'center' }}>
          <span className="spinner" /> Waiting for authorization… the code expires in{' '}
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', paddingTop: 20 }}>
          <button className="btn btn-outline btn-sm" onClick={onDone}>
            Skip for now (demo)
          </button>
          <span className="grow" />
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            style={{ fontSize: 12.5, color: 'var(--text-3)', textDecoration: 'underline' }}
          >
            Use a dedicated bot account instead
          </a>
        </div>
      </div>
    </div>
  );
}
