import { Icons } from './icons';

/** Shown when a channel has no live/historical data yet (bot never ran). */
export function EmptyState({
  title,
  body,
  compact = false,
}: {
  title: string;
  body: string;
  compact?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        textAlign: 'center',
        padding: compact ? '20px 16px' : '40px 24px',
        color: 'var(--text-3)',
      }}
    >
      <span
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          display: 'grid',
          placeItems: 'center',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          color: 'var(--text-3)',
        }}
      >
        <Icons.download className="ic" />
      </span>
      <b style={{ fontSize: 14, color: 'var(--text-2)' }}>{title}</b>
      <p style={{ fontSize: 12.5, maxWidth: 320, lineHeight: 1.6 }}>{body}</p>
    </div>
  );
}
