import Link from 'next/link';
import { DISCUSSIONS_URL, GITHUB_URL, ISSUES_URL } from '@ozenmod/shared';
import { Brand } from './Brand';

export function MarketingFooter() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <Brand />
          <p style={{ color: 'var(--text-3)', fontSize: 12.5, marginTop: 12, maxWidth: 280 }}>
            Open-source, context-aware AI moderation for Twitch. Built for streamers, free to run.
          </p>
          <p style={{ color: 'var(--text-3)', fontSize: 12, marginTop: 16 }}>
            © 2026 OZENMod contributors · MIT License
          </p>
        </div>
        <div>
          <h5>Product</h5>
          <Link href="/download">Download</Link>
          <Link href="/dashboard">Dashboard</Link>
          <a href={`${GITHUB_URL}/blob/main/CHANGELOG.md`}>Changelog</a>
          <a href={`${GITHUB_URL}/blob/main/docs/ROADMAP.md`}>Roadmap</a>
        </div>
        <div>
          <h5>Resources</h5>
          <Link href="/docs">Documentation</Link>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href={ISSUES_URL} target="_blank" rel="noreferrer">
            Report an issue
          </a>
          <a href={DISCUSSIONS_URL} target="_blank" rel="noreferrer">
            Discussions
          </a>
        </div>
        <div>
          <h5>Legal</h5>
          <Link href="/privacy">Privacy policy</Link>
          <Link href="/terms">Terms of use</Link>
          <a href={`${GITHUB_URL}/blob/main/LICENSE`}>License</a>
        </div>
      </div>
    </footer>
  );
}
