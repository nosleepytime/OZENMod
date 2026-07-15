import Link from 'next/link';
import { Code2, Download } from 'lucide-react';
import { GITHUB_URL } from '@ozenmod/shared';
import { Brand } from './Brand';

export function MarketingNav() {
  return (
    <nav className="m-nav">
      <Link href="/">
        <Brand />
      </Link>
      <div className="m-links grow">
        <Link href="/#features">Features</Link>
        <Link href="/#how">How it works</Link>
        <Link href="/#providers">Providers</Link>
        <Link href="/#faq">FAQ</Link>
        <Link href="/docs">Docs</Link>
      </div>
      <div className="row">
        <a className="btn btn-outline btn-sm" href={GITHUB_URL} target="_blank" rel="noreferrer">
          <Code2 className="ic ic-sm" /> GitHub
        </a>
        <Link className="btn btn-ghost" href="/login">
          Sign in
        </Link>
        <Link className="btn btn-primary" href="/download">
          <Download className="ic" /> Download free
        </Link>
      </div>
    </nav>
  );
}
