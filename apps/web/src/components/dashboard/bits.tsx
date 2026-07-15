import type { ModerationEvent } from '@ozenmod/shared';
import { avatarGradient } from '@/lib/format';
import { Icons } from './icons';

export function Avatar({ login, small = true }: { login: string; small?: boolean }) {
  return (
    <span
      className={small ? 'avatar avatar-sm' : 'avatar'}
      style={{ background: avatarGradient(login) }}
      aria-hidden
    >
      {login.charAt(0).toUpperCase()}
    </span>
  );
}

/** Colored action chip matching the event's action. */
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
