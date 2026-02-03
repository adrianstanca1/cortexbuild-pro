import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { _DashboardHeader } from "@/components/dashboard/header";
import { AIAssistant } from "@/components/ai-assistant";
import { RealtimeProvider } from "@/components/realtime-provider";
import { RealtimeStatusIndicator } from "@/components/realtime-status-indicator";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { SidebarProvider } from "@/hooks/use-sidebar";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { ErrorBoundary } from "@/components/error-boundary";

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <ErrorBoundary fallbackTitle="Dashboard Error" fallbackMessage="An error occurred in the dashboard. Please try refreshing the page.">
      <RealtimeProvider showToasts={true}>
        <SidebarProvider>
          <div className="min-h-screen bg-background">
            <DashboardSidebar userRole={(session.user as { role: string }).role} />
            <DashboardContent user={session.user} userRole={(session.user as { role: string }).role}>
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </DashboardContent>
            <RealtimeStatusIndicator />
            <AIAssistant />
            <FloatingActionButton />
          </div>
        </SidebarProvider>
      </RealtimeProvider>
    </ErrorBoundary>
  );
}
