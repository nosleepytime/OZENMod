'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

interface AssistantContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

const AssistantCtx = createContext<AssistantContextValue | null>(null);

export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen((o) => !o), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const value = useMemo(() => ({ open, setOpen, toggle }), [open, toggle]);
  return <AssistantCtx.Provider value={value}>{children}</AssistantCtx.Provider>;
}

export function useAssistant(): AssistantContextValue {
  const ctx = useContext(AssistantCtx);
  if (!ctx) throw new Error('useAssistant must be used within AssistantProvider');
  return ctx;
}
