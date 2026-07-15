import { Shield } from 'lucide-react';

export function Brand({ size = 16 }: { size?: number }) {
  return (
    <span className="logo">
      <span className="logo-mark">
        <Shield className="ic ic-fill" strokeWidth={0} fill="currentColor" />
      </span>
      <span className="logo-name" style={{ fontSize: size }}>
        OZEN<b style={{ color: 'var(--accent-2)', fontWeight: 800 }}>Mod</b>
      </span>
    </span>
  );
}
