import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, Twitch, TriangleAlert } from 'lucide-react';
import { Brand } from '@/components/Brand';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to OZENMod with Twitch to manage your channel moderation.',
};

const ERRORS: Record<string, string> = {
  invalid_state: 'Your sign-in session expired or was invalid. Please try again.',
  twitch_not_configured: 'Twitch sign-in isn’t configured on this deployment yet.',
  firebase_not_configured: 'The Firebase backend isn’t configured on this deployment yet.',
  exchange_failed: 'Twitch declined the sign-in. Please try again.',
  access_denied: 'You declined the authorization. Sign-in was cancelled.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message = error ? (ERRORS[error] ?? 'Something went wrong during sign-in.') : null;

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
            <h1 className="login-title">Sign in or create your account</h1>
            <p className="login-sub" style={{ marginTop: 6 }}>
              OZENMod uses your Twitch account as its identity — signing in the first time creates
              your account automatically.
            </p>
          </div>

          {message && (
            <div className="note note-warn" style={{ width: '100%' }}>
              <TriangleAlert className="ic" />
              <span>{message}</span>
            </div>
          )}

          {/* Real Twitch OAuth — the server route redirects to Twitch. */}
          <a className="btn btn-twitch btn-lg" style={{ width: '100%' }} href="/api/auth/login">
            <Twitch className="ic ic-fill" fill="currentColor" strokeWidth={0} /> Continue with
            Twitch
          </a>
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
