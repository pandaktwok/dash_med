"use client";

import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardContent } from "@/components/dashboard/content";
import { WhatsContent } from "@/components/dashboard/whats-content";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useDashboardStore } from "@/store/dashboard-store";

export default function DashboardPage() {
  const activeTab = useDashboardStore((s) => s.activeTab);
  const title = activeTab === "whats" ? "Whats" : "Painel Geral";

  return (
    <SidebarProvider className="bg-sidebar">
      <DashboardSidebar />
      <div className="h-svh overflow-hidden lg:p-2 w-full">
        <div className="lg:border lg:rounded-md overflow-hidden flex flex-col h-full w-full bg-background">
          <DashboardHeader title={title} />
          <main className="w-full flex-1 overflow-auto">
            {activeTab === "whats" ? <WhatsContent /> : <DashboardContent />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
