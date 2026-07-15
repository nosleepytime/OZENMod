import { Icons } from '../icons';

export function TitleBar() {
  return (
    <div className="titlebar">
      <span className="logo">
        <span className="logo-mark">
          <Icons.shield className="ic ic-fill" strokeWidth={0} fill="currentColor" />
        </span>
        <span className="logo-name">
          OZEN<b style={{ color: 'var(--accent-2)', fontWeight: 800 }}>Mod</b>
        </span>
      </span>
      <span className="chip" style={{ height: 20, fontSize: 10.5 }}>
        v0.1.0
      </span>
      <div className="tb-controls">
        <button className="tb-btn" aria-label="Minimize">
          <Icons.minus className="ic ic-sm" />
        </button>
        <button className="tb-btn" aria-label="Maximize">
          <Icons.square className="ic ic-sm" style={{ width: 11, height: 11 }} />
        </button>
        <button className="tb-btn tb-close" aria-label="Close">
          <Icons.x className="ic ic-sm" />
        </button>
      </div>
    </div>
  );
}
