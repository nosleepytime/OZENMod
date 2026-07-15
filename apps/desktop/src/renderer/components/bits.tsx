import type { ModerationEvent } from '@ozenmod/shared';
import { Icons } from '../icons';

const GRADIENTS = [
  'linear-gradient(135deg,#FCD34D,#F59E0B)',
  'linear-gradient(135deg,#F9A8D4,#EC4899)',
  'linear-gradient(135deg,#93C5FD,#3B82F6)',
  'linear-gradient(135deg,#FCA5A5,#EF4444)',
  'linear-gradient(135deg,#86EFAC,#22C55E)',
  'linear-gradient(135deg,#C4B5FD,#8B5CF6)',
  'linear-gradient(135deg,#6BD3FB,#0EA5E9)',
  'linear-gradient(135deg,#94A3B8,#64748B)',
];

export function gradientFor(login: string): string {
  let h = 0;
  for (const ch of login) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length]!;
}

export function Avatar({ login, small = true }: { login: string; small?: boolean }) {
  return (
    <span
      className={small ? 'avatar avatar-sm' : 'avatar'}
      style={{ background: gradientFor(login) }}
      aria-hidden
    >
      {login.charAt(0).toUpperCase()}
    </span>
  );
}

export function feedUserColor(login: string): string {
  const colors = ['#6BD3FB', '#F9A8D4', '#86EFAC', '#FCD34D', '#93C5FD', '#94A3B8', '#FDA4AF'];
  let h = 0;
  for (const ch of login) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return colors[h % colors.length]!;
}

export function ActionChip({ event }: { event: ModerationEvent }) {
  const { action, actionLabel } = event;
  if (action === 'allow' || action === 'ignore')
    return (
      <span className="chip chip-good">
        <Icons.check className="ic ic-sm" /> {actionLabel}
      </span>
    );
  if (action === 'warn')
    return (
      <span className="chip chip-warn">
        <Icons.eye className="ic ic-sm" /> {actionLabel}
      </span>
    );
  if (action === 'timeout')
    return (
      <span className="chip chip-warn">
        <Icons.clock className="ic ic-sm" /> {actionLabel}
      </span>
    );
  if (action === 'ban')
    return (
      <span className="chip chip-danger">
        <Icons.ban className="ic ic-sm" /> {actionLabel}
      </span>
    );
  if (action === 'review')
    return (
      <span className="chip chip-info">
        <Icons.eye className="ic ic-sm" /> {actionLabel}
      </span>
    );
  return (
    <span className="chip chip-danger">
      <Icons.x className="ic ic-sm" /> {actionLabel}
    </span>
  );
}

export function SourceChip({ source }: { source: ModerationEvent['source'] }) {
  if (source === 'ai')
    return (
      <span className="chip chip-accent">
        <Icons.sparkles className="ic ic-sm" /> AI
      </span>
    );
  if (source === 'manual')
    return (
      <span className="chip chip-accent">
        <Icons.sparkles className="ic ic-sm" /> Assistant
      </span>
    );
  return <span className="chip">Local</span>;
}

export function formatTime(at: number): string {
  const d = new Date(at);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export function formatDuration(seconds: number): string {
  if (seconds % 86400 === 0) return `${seconds / 86400} day${seconds === 86400 ? '' : 's'}`;
  if (seconds % 3600 === 0) return `${seconds / 3600} hour${seconds === 3600 ? '' : 's'}`;
  if (seconds % 60 === 0) return `${seconds / 60} minutes`;
  return `${seconds} seconds`;
}
