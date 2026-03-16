import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { isTestMode, getSessionBypass } from "@/lib/test-auth-bypass";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { AIAssistant } from "@/components/ai-assistant";
import { RealtimeProvider } from "@/components/realtime-provider";
import { RealtimeStatusIndicator } from "@/components/realtime-status-indicator";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { SidebarProvider } from "@/hooks/use-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session;

  if (isTestMode()) {
    session = getSessionBypass();
  } else {
    session = await getServerSession(authOptions);
  }

  if (!session) {
    redirect("/login");
  }

  return (
    <RealtimeProvider showToasts={true}>
      <SidebarProvider>
        <div className="min-h-screen bg-background">
          <DashboardSidebar
            userRole={(session.user as { role: string }).role}
          />
          <div className="lg:pl-64">
            <DashboardHeader
              user={session.user}
              userRole={(session.user as { role: string }).role}
            />
            <main className="p-6">{children}</main>
          </div>
          <RealtimeStatusIndicator />
          <AIAssistant />
          <FloatingActionButton />
        </div>
      </SidebarProvider>
    </RealtimeProvider>
  );
}
