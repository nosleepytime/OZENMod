'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DOCS_URL } from '@ozenmod/shared';
import { Brand } from '@/components/Brand';
import { useAuth } from '@/components/auth/AuthProvider';
import { useMobileNav } from './MobileNavContext';
import { avatarGradient } from '@/lib/format';
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
  const { user, signOut } = useAuth();
  const { open, close } = useMobileNav();
  const display = user?.displayName ?? user?.login ?? '—';
  const initial = display.charAt(0).toUpperCase() || '?';
  return (
    <>
      {open && <div className="nav-overlay" onClick={close} aria-hidden="true" />}
      <aside className={`sidebar${open ? ' open' : ''}`}>
        <Link href="/" onClick={close}>
          <Brand />
        </Link>
        <div className="nav-label">Channel</div>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              className={`nav-item${active ? ' active' : ''}`}
              href={href}
              key={href}
              onClick={close}
            >
              <Icon className="ic" /> {label}
            </Link>
          );
        })}
        <div className="nav-label">Resources</div>
        <Link className="nav-item" href="/download" onClick={close}>
          <Icons.download className="ic" /> Desktop app
        </Link>
        <a className="nav-item" href={DOCS_URL} target="_blank" rel="noreferrer">
          <Icons.code className="ic" /> Documentation
        </a>
        <div className="nav-spacer" />
        <div className="nav-user">
          {user?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt=""
              width={30}
              height={30}
              style={{ borderRadius: '50%', flex: 'none' }}
            />
          ) : (
            <span className="avatar" style={{ background: avatarGradient(display) }}>
              {initial}
            </span>
          )}
          <div style={{ minWidth: 0 }}>
            <b
              style={{
                fontSize: 13,
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {display}
            </b>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Free plan</span>
          </div>
          <button
            onClick={() => void signOut()}
            title="Sign out"
            aria-label="Sign out"
            style={{
              marginLeft: 'auto',
              background: 'transparent',
              border: 0,
              color: 'var(--text-3)',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Icons.logout className="ic" />
          </button>
        </div>
      </aside>
    </>
  );
}
