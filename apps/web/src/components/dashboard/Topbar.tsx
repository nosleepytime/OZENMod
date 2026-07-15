'use client';

import { DEMO_CHANNEL } from '@/lib/demo-data';
import { useAssistant } from './AssistantContext';
import { Icons } from './icons';

export function Topbar({ title, showLive = true }: { title: string; showLive?: boolean }) {
  const { toggle } = useAssistant();
  return (
    <div className="topbar">
      <span className="topbar-title">{title}</span>
      <span className="divider-v" />
      {showLive && (
        <span className="chip chip-danger">
          <span className="dot pulse" /> LIVE
        </span>
      )}
      <span className="chip">#{DEMO_CHANNEL.login}</span>
      {showLive && (
        <span className="chip">
          <Icons.clock className="ic ic-sm" /> Session {DEMO_CHANNEL.sessionTime}
        </span>
      )}
      <span
        className="chip chip-warn"
        title="This dashboard shows demo data until Firebase is connected (milestone M4)."
      >
        <Icons.info className="ic ic-sm" /> Demo data
      </span>
      <span className="grow" />
      <span className="chip chip-good">
        <span className="dot" /> Bot online · desktop app
      </span>
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
      <span className="avatar avatar-sm">P</span>
    </div>
  );
}
