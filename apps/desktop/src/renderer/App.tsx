import { useEffect, useState } from 'react';
import { TitleBar } from './components/TitleBar';
import { Rail, type ViewId } from './components/Rail';
import { AssistantPanel } from './components/AssistantPanel';
import { Onboarding } from './views/Onboarding';
import { ControlRoom } from './views/ControlRoom';
import { Logs } from './views/Logs';
import { SettingsView } from './views/SettingsView';

/**
 * A URL flag lets the design-preview build open straight into onboarding or with
 * the assistant panel open, so screenshots don't require driving the UI. In the
 * packaged app onboarding is shown on first run instead.
 */
function initialFlags() {
  if (typeof window === 'undefined') return { onboarding: false, assistant: false };
  const p = new URLSearchParams(window.location.search);
  return { onboarding: p.has('onboarding'), assistant: p.has('assistant') };
}

export function App() {
  const flags = initialFlags();
  const [onboarding, setOnboarding] = useState(flags.onboarding);
  const [view, setView] = useState<ViewId>('control');
  const [assistantOpen, setAssistantOpen] = useState(flags.assistant);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setAssistantOpen((o) => !o);
      }
      if (e.key === 'Escape') setAssistantOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="app">
      <TitleBar />
      {onboarding ? (
        <Onboarding onDone={() => setOnboarding(false)} />
      ) : (
        <div className="body" style={{ position: 'relative' }}>
          <Rail
            view={view}
            onView={setView}
            onAssistant={() => setAssistantOpen((o) => !o)}
            reviewCount={2}
          />
          {view === 'control' && <ControlRoom />}
          {view === 'logs' && <Logs />}
          {view === 'settings' && <SettingsView />}
          <AssistantPanel open={assistantOpen} onClose={() => setAssistantOpen(false)} />
        </div>
      )}
    </div>
  );
}
