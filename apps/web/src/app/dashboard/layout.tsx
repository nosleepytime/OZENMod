import { AuthProvider } from '@/components/auth/AuthProvider';
import { AuthGate } from '@/components/auth/AuthGate';
import { AssistantProvider } from '@/components/dashboard/AssistantContext';
import { AssistantPanel } from '@/components/dashboard/AssistantPanel';
import { MobileNavProvider } from '@/components/dashboard/MobileNavContext';
import { Sidebar } from '@/components/dashboard/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGate>
        <AssistantProvider>
          <MobileNavProvider>
            <div className="shell">
              <Sidebar />
              <div className="main">{children}</div>
            </div>
            <AssistantPanel />
          </MobileNavProvider>
        </AssistantProvider>
      </AuthGate>
    </AuthProvider>
  );
}
