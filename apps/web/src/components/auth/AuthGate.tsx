'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TriangleAlert, ExternalLink } from 'lucide-react';
import { GITHUB_URL } from '@ozenmod/shared';
import { Brand } from '@/components/Brand';
import { useAuth } from './AuthProvider';

/** Gates dashboard content: setup notice, loading, redirect to login, or content. */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, configured } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (configured && !loading && !user) router.replace('/login');
  }, [configured, loading, user, router]);

  if (!configured) return <SetupNotice />;

  if (loading || !user) {
    return (
      <div className="error-bg">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <Brand size={18} />
          <div className="spinner-lg" />
          <p className="card-sub">{loading ? 'Signing you in…' : 'Redirecting to sign in…'}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function SetupNotice() {
  return (
    <div className="error-bg">
      <div
        className="card card-pad"
        style={{
          maxWidth: 560,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Brand size={18} />
          <span className="chip chip-warn" style={{ marginLeft: 'auto' }}>
            <TriangleAlert className="ic ic-sm" /> Not configured
          </span>
        </div>
        <h1 style={{ fontSize: 20 }}>Authentication isn&apos;t connected yet</h1>
        <p className="card-sub" style={{ fontSize: 13.5, lineHeight: 1.6 }}>
          Real sign-in needs a Twitch application and a Firebase project — external accounts only
          the owner can create. Once their public config is set as environment variables, sign-in
          with Twitch works end-to-end and this dashboard shows your live channel data.
        </p>
        <div className="tier-list" style={{ marginTop: 4 }}>
          <span className="card-sub">Required environment variables:</span>
          <code style={{ fontSize: 12, color: 'var(--text-2)' }}>
            TWITCH_CLIENT_ID · TWITCH_CLIENT_SECRET
          </code>
          <code style={{ fontSize: 12, color: 'var(--text-2)' }}>
            FIREBASE_SERVICE_ACCOUNT_JSON · NEXT_PUBLIC_FIREBASE_*
          </code>
        </div>
        <a
          className="btn btn-primary"
          style={{ alignSelf: 'flex-start', marginTop: 6 }}
          href={`${GITHUB_URL}/blob/main/SETUP.md`}
          target="_blank"
          rel="noreferrer"
        >
          Read the setup guide <ExternalLink className="ic ic-sm" />
        </a>
      </div>
    </div>
  );
}
