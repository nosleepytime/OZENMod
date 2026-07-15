import { Icons } from '../icons';

export type ViewId = 'control' | 'logs' | 'settings';

export function Rail({
  view,
  onView,
  onAssistant,
  reviewCount,
}: {
  view: ViewId;
  onView: (v: ViewId) => void;
  onAssistant: () => void;
  reviewCount: number;
}) {
  return (
    <aside className="rail">
      <button
        className={`rail-item${view === 'control' ? ' active' : ''}`}
        onClick={() => onView('control')}
        aria-label="Control room"
        title="Control room"
      >
        <Icons.home className="ic" />
      </button>
      <button
        className="rail-item"
        onClick={onAssistant}
        aria-label="AI Assistant"
        title="AI Assistant"
      >
        <Icons.sparkles className="ic" />
      </button>
      <button
        className={`rail-item${view === 'logs' ? ' active' : ''}`}
        onClick={() => onView('logs')}
        aria-label="Logs"
        title="Logs"
      >
        <Icons.terminal className="ic" />
        {reviewCount > 0 && <span className="rail-badge">{reviewCount}</span>}
      </button>
      <button
        className={`rail-item${view === 'settings' ? ' active' : ''}`}
        onClick={() => onView('settings')}
        aria-label="Settings"
        title="Settings"
      >
        <Icons.settings className="ic" />
      </button>
      <div style={{ flex: 1 }} />
      <span
        className="avatar avatar-sm"
        style={{ marginBottom: 6, background: 'linear-gradient(135deg,#F59E0B,#EF4444)' }}
      >
        P
      </span>
    </aside>
  );
}
