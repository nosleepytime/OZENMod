'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { useChannelData } from '@/lib/useChannelData';
import { useAssistant } from './AssistantContext';
import { useMobileNav } from './MobileNavContext';
import { Icons } from './icons';

function elapsed(startedAt: number | null | undefined): string {
  if (!startedAt) return '00:00:00';
  const s = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
}

export function Topbar({ title }: { title: string }) {
  const { toggle } = useAssistant();
  const { toggle: toggleNav } = useMobileNav();
  const { user } = useAuth();
  const { online, status } = useChannelData();
  const channel = user?.login ?? '—';

  return (
    <div className="topbar">
      <button className="nav-burger" onClick={toggleNav} aria-label="Open menu">
        <Icons.menu className="ic" />
      </button>
      <span className="topbar-title">{title}</span>
      <span className="divider-v" />
      {online ? (
        <>
          <span className="chip chip-danger">
            <span className="dot pulse" /> LIVE
          </span>
          <span className="chip">
            <Icons.clock className="ic ic-sm" /> {elapsed(status?.startedAt)}
          </span>
        </>
      ) : (
        <span className="chip">Offline</span>
      )}
      <span className="chip">#{channel}</span>
      <span className="grow" />
      {online ? (
        <span className="chip chip-good">
          <span className="dot" /> Bot online
        </span>
      ) : (
        <span className="chip" title="Open the desktop app and start the bot to go live.">
          <span className="dot" /> Bot offline
        </span>
      )}
      <button className="btn btn-primary btn-sm" onClick={toggle}>
        <Icons.sparkles className="ic ic-sm" /> Ask AI
      </button>
      <button
        className="btn btn-ghost btn-sm"
        style={{ width: 34, padding: 0 }}
        aria-label="Notifications"
      >
        <Icons.bell className="ic" />
      </button>
    </div>
  );
}
