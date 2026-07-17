'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

interface MobileNavValue {
  open: boolean;
  toggle: () => void;
  close: () => void;
}

const MobileNavCtx = createContext<MobileNavValue | null>(null);

/** Controls the off-canvas dashboard sidebar on small screens. */
export function MobileNavProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((o) => !o), []);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const value = useMemo(() => ({ open, toggle, close }), [open, toggle, close]);
  return <MobileNavCtx.Provider value={value}>{children}</MobileNavCtx.Provider>;
}

export function useMobileNav(): MobileNavValue {
  const ctx = useContext(MobileNavCtx);
  if (!ctx) throw new Error('useMobileNav must be used within MobileNavProvider');
  return ctx;
}
