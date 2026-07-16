"use client";

import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardContent } from "@/components/dashboard/content";
import { WhatsContent } from "@/components/dashboard/whats-content";
import { CalendarioContent } from "@/components/dashboard/calendario-content";
import { PacientesContent } from "@/components/dashboard/pacientes-content";
import { ConfigContent } from "@/components/dashboard/config-content";
import { ProntuarioModal } from "@/components/dashboard/prontuario-modal";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useDashboardStore } from "@/store/dashboard-store";

export default function DashboardPage() {
  const activeTab = useDashboardStore((s) => s.activeTab);
  const titleMap: Record<string, string> = {
    painel: "Visão Geral",
    whats: "Mensagens",
    calendario: "Agenda",
    pacientes: "Pacientes",
    financeiro: "Financeiro",
    crm: "Marketing",
    config: "Configurações",
  };
  const title = titleMap[activeTab] ?? "Visão Geral";

  return (
    <SidebarProvider className="bg-sidebar">
      <DashboardSidebar />
      <div className="h-svh overflow-hidden lg:p-4 w-full">
        <div className="lg:border lg:rounded-xl overflow-hidden flex flex-col h-full w-full bg-background shadow-sm">
          <DashboardHeader title={title} />
          <main className="w-full flex-1 overflow-auto">
            {activeTab === "whats" ? (
              <WhatsContent />
            ) : activeTab === "calendario" ? (
              <CalendarioContent />
            ) : activeTab === "pacientes" ? (
              <PacientesContent />
            ) : activeTab === "config" ? (
              <ConfigContent />
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
      {/* Modal global de prontuário — disponível em todas as abas */}
      <ProntuarioModal />
    </SidebarProvider>
  );
}
