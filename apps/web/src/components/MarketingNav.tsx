'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Code2, Download, Menu, X } from 'lucide-react';
import { GITHUB_URL } from '@ozenmod/shared';
import { Brand } from './Brand';

const LINKS = [
  { href: '/#features', label: 'Features' },
  { href: '/#how', label: 'How it works' },
  { href: '/#providers', label: 'Providers' },
  { href: '/#faq', label: 'FAQ' },
  { href: '/docs', label: 'Docs' },
];

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <nav className="m-nav">
      <Link href="/" onClick={close}>
        <Brand />
      </Link>
      <div className="m-links grow">
        {LINKS.map((l) => (
          <Link href={l.href} key={l.href}>
            {l.label}
          </Link>
        ))}
      </div>
      <div className="row m-cta">
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

      <button
        className="m-burger"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
      >
        {open ? <X className="ic" /> : <Menu className="ic" />}
      </button>

      {open && (
        <>
          <div className="m-menu-overlay" onClick={close} aria-hidden="true" />
          <div className="m-menu">
            {LINKS.map((l) => (
              <Link href={l.href} key={l.href} onClick={close}>
                {l.label}
              </Link>
            ))}
            <div className="m-menu-sep" />
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" onClick={close}>
              GitHub
            </a>
            <Link href="/login" onClick={close}>
              Sign in
            </Link>
            <Link className="btn btn-primary" href="/download" onClick={close}>
              <Download className="ic" /> Download free
            </Link>
          </div>
        </>
      )}
    </nav>
  );
}
