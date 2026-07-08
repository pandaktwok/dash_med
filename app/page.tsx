"use client";

import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardContent } from "@/components/dashboard/content";
import { WhatsContent } from "@/components/dashboard/whats-content";
import { CalendarioContent } from "@/components/dashboard/calendario-content";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useDashboardStore } from "@/store/dashboard-store";

export default function DashboardPage() {
  const activeTab = useDashboardStore((s) => s.activeTab);
  const titleMap: Record<string, string> = {
    painel: "Painel Geral",
    whats: "Whats",
    calendario: "Calendário",
    financeiro: "Financeiro",
    crm: "CRM",
    config: "Configuração",
  };
  const title = titleMap[activeTab] ?? "Painel Geral";

  return (
    <SidebarProvider className="bg-sidebar">
      <DashboardSidebar />
      <div className="h-svh overflow-hidden lg:p-2 w-full">
        <div className="lg:border lg:rounded-md overflow-hidden flex flex-col h-full w-full bg-background">
          <DashboardHeader title={title} />
          <main className="w-full flex-1 overflow-auto">
            {activeTab === "whats" ? (
              <WhatsContent />
            ) : activeTab === "calendario" ? (
              <CalendarioContent />
            ) : activeTab === "financeiro" || activeTab === "crm" ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 p-8">
                <span className="text-sm font-medium text-muted-foreground">
                  Em criação
                </span>
                <span className="text-xs text-muted-foreground/70">
                  Este módulo ainda não está disponível.
                </span>
              </div>
            ) : (
              <DashboardContent />
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
