import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, Twitch } from 'lucide-react';
import { Brand } from '@/components/Brand';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to OZENMod with Twitch to manage your channel moderation.',
};

export default function LoginPage() {
  return (
    <main className="login-bg">
      <div className="login-wrap">
        <div className="card login-card">
          <Link
            href="/"
            style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}
          >
            <Brand size={18} />
          </Link>
          <div>
            <h1 className="login-title">Welcome back</h1>
            <p className="login-sub" style={{ marginTop: 6 }}>
              Sign in to manage your channel&apos;s moderation, statistics and AI settings.
            </p>
          </div>
          {/* In M4 this links to /api/auth/login (Twitch OAuth). For now it lands on the demo dashboard. */}
          <Link className="btn btn-twitch btn-lg" style={{ width: '100%' }} href="/dashboard">
            <Twitch className="ic ic-fill" fill="currentColor" strokeWidth={0} /> Continue with
            Twitch
          </Link>
          <div className="scopes">
            <span className="row">
              <Check className="ic" /> We only request moderation scopes — nothing more
            </span>
            <span className="row">
              <Check className="ic" /> Your chat is never stored on our servers
            </span>
            <span className="row">
              <Check className="ic" /> Disconnect and delete your data anytime
            </span>
          </div>
          <p className="login-sub" style={{ fontSize: 12 }}>
            By continuing you agree to the{' '}
            <Link href="/terms" style={{ color: 'var(--text-2)', textDecoration: 'underline' }}>
              Terms of use
            </Link>{' '}
            and{' '}
            <Link href="/privacy" style={{ color: 'var(--text-2)', textDecoration: 'underline' }}>
              Privacy policy
            </Link>
            .
          </p>
        </div>
        <div className="login-foot">
          <Link href="/">← Back to ozenmod.app</Link>
          <span>·</span>
          <Link href="/download">Need the desktop app?</Link>
        </div>
      </div>
    </main>
  );
}
