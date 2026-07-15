'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RotateCcw, Home } from 'lucide-react';
import { Brand } from '@/components/Brand';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production this would report to an error tracker.
    console.error(error);
  }, [error]);

  return (
    <main className="error-bg">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        <Brand size={18} />
        <div className="error-code">500</div>
        <h1 style={{ fontSize: 24 }}>Something went wrong</h1>
        <p className="lead" style={{ maxWidth: 420 }}>
          An unexpected error occurred on our side. Try again — if it keeps happening, let us know
          on GitHub.
        </p>
        <div className="cta-row" style={{ justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={reset}>
            <RotateCcw className="ic" /> Try again
          </button>
          <Link className="btn btn-ghost" href="/">
            <Home className="ic" /> Back home
          </Link>
        </div>
      </div>
    </main>
  );
}
