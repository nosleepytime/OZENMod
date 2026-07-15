import Link from 'next/link';
import { Home, Download } from 'lucide-react';
import { Brand } from '@/components/Brand';

export default function NotFound() {
  return (
    <main className="error-bg">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        <Brand size={18} />
        <div className="error-code">404</div>
        <h1 style={{ fontSize: 24 }}>This page wandered off</h1>
        <p className="lead" style={{ maxWidth: 420 }}>
          The page you&apos;re looking for doesn&apos;t exist. It may have moved, or the link was
          mistyped.
        </p>
        <div className="cta-row" style={{ justifyContent: 'center' }}>
          <Link className="btn btn-primary" href="/">
            <Home className="ic" /> Back home
          </Link>
          <Link className="btn btn-ghost" href="/download">
            <Download className="ic" /> Download OZENMod
          </Link>
        </div>
      </div>
    </main>
  );
}
