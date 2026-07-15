import type { Metadata } from 'next';
import Link from 'next/link';
import { Download, Check, ShieldAlert, FileCheck2, Apple, Monitor } from 'lucide-react';
import { MarketingNav } from '@/components/MarketingNav';
import { MarketingFooter } from '@/components/MarketingFooter';
import { RELEASES_URL } from '@ozenmod/shared';

export const metadata: Metadata = {
  title: 'Download',
  description: 'Download the OZENMod desktop app for Windows and macOS — free, open source.',
};

export default function DownloadPage() {
  return (
    <>
      <MarketingNav />
      <main className="m-container" style={{ padding: '64px 32px 90px' }}>
        <div className="section-head" style={{ maxWidth: 700, marginBottom: 32 }}>
          <span className="section-kicker">Download</span>
          <h1 className="h-display" style={{ fontSize: 40 }}>
            Get OZENMod
          </h1>
          <p className="lead">
            The desktop app runs the whole bot on your computer while you stream. Free, no account
            required to install, open source.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 760 }}>
          <div
            className="card card-pad"
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <span className="feature-ic">
              <Monitor className="ic" />
            </span>
            <b style={{ fontSize: 17 }}>Windows</b>
            <p className="card-sub">Windows 10 or 11 · 64-bit · ~90 MB installer (NSIS)</p>
            <a className="btn btn-primary" href={RELEASES_URL} target="_blank" rel="noreferrer">
              <Download className="ic" /> Download for Windows
            </a>
            <span className="card-sub">Auto-updates from GitHub Releases.</span>
          </div>
          <div
            className="card card-pad"
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <span className="feature-ic">
              <Apple className="ic" />
            </span>
            <b style={{ fontSize: 17 }}>macOS</b>
            <p className="card-sub">macOS 12+ · Apple Silicon &amp; Intel · ~95 MB (DMG)</p>
            <a className="btn btn-primary" href={RELEASES_URL} target="_blank" rel="noreferrer">
              <Download className="ic" /> Download for macOS
            </a>
            <span className="card-sub">First launch: right-click → Open (see note below).</span>
          </div>
        </div>

        <div
          style={{
            maxWidth: 760,
            marginTop: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div className="note note-warn">
            <ShieldAlert className="ic" />
            <span>
              Free-tier builds are <b>unsigned</b> (code-signing certificates are paid). On Windows,
              SmartScreen may warn “unknown publisher” — choose <b>More info → Run anyway</b>. On
              macOS, right-click the app and choose <b>Open</b> the first time. The full build
              pipeline is public on GitHub, so anyone can audit exactly what produced each binary.
            </span>
          </div>
          <div className="note">
            <FileCheck2 className="ic" />
            <span>
              Every release publishes <span className="kbd">SHA256SUMS.txt</span> — verify your
              download matches before installing.{' '}
              <a href={RELEASES_URL} style={{ color: 'var(--accent-2)' }}>
                View checksums →
              </a>
            </span>
          </div>
          <div className="card card-pad">
            <div className="card-title" style={{ marginBottom: 10 }}>
              After installing
            </div>
            <div className="tier-list">
              {[
                'Open OZENMod and connect Twitch with a device code (your account or a bot account)',
                'Pick your defaults — balanced sensitivity and a 3-strike ladder are pre-set',
                'Press Start before you go live, or enable auto-start on stream online',
              ].map((line) => (
                <span className="row" key={line}>
                  <Check className="ic" />
                  {line}
                </span>
              ))}
            </div>
            <Link
              className="btn btn-outline btn-sm"
              href="/docs"
              style={{ marginTop: 14, alignSelf: 'flex-start' }}
            >
              Read the setup guide →
            </Link>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </>
  );
}
