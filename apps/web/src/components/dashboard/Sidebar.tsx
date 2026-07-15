'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DOCS_URL } from '@ozenmod/shared';
import { Brand } from '@/components/Brand';
import { Icons } from './icons';

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: Icons.home },
  { href: '/dashboard/moderation', label: 'Moderation', icon: Icons.moderation },
  { href: '/dashboard/ai', label: 'AI & Providers', icon: Icons.sparkles },
  { href: '/dashboard/filters', label: 'Filters', icon: Icons.filters },
  { href: '/dashboard/settings', label: 'Settings', icon: Icons.settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sidebar">
      <Link href="/">
        <Brand />
      </Link>
      <div className="nav-label">Channel</div>
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href);
        return (
          <Link className={`nav-item${active ? ' active' : ''}`} href={href} key={href}>
            <Icon className="ic" /> {label}
          </Link>
        );
      })}
      <div className="nav-label">Resources</div>
      <Link className="nav-item" href="/download">
        <Icons.download className="ic" /> Desktop app
      </Link>
      <a className="nav-item" href={DOCS_URL} target="_blank" rel="noreferrer">
        <Icons.code className="ic" /> Documentation
      </a>
      <div className="nav-spacer" />
      <div className="nav-user">
        <span className="avatar">P</span>
        <div style={{ minWidth: 0 }}>
          <b style={{ fontSize: 13, display: 'block' }}>pixelforge</b>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Free plan</span>
        </div>
        <Icons.chevron className="ic" style={{ marginLeft: 'auto', color: 'var(--text-3)' }} />
      </div>
    </aside>
  );
}
