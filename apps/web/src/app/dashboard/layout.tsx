import { AssistantProvider } from '@/components/dashboard/AssistantContext';
import { AssistantPanel } from '@/components/dashboard/AssistantPanel';
import { Sidebar } from '@/components/dashboard/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AssistantProvider>
      <div className="shell">
        <Sidebar />
        <div className="main">{children}</div>
      </div>
      <AssistantPanel />
    </AssistantProvider>
  );
}
