"use client";

import { dashboardStats } from "@/mock-data/dashboard";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ClinicIcon,
  Calendar03Icon,
  WhatsappIcon,
  CalendarCheckIn01Icon,
} from "@hugeicons/core-free-icons";

const stats = [
  {
    title: "Consultas Hoje",
    value: dashboardStats.consultasHoje.value,
    change: dashboardStats.consultasHoje.change,
    icon: ClinicIcon,
  },
  {
    title: "Consultas/Mês",
    value: dashboardStats.consultasMes.value,
    change: dashboardStats.consultasMes.change,
    icon: Calendar03Icon,
  },
  {
    title: "Atendimento Whats",
    value: dashboardStats.atendimentoWhats.value,
    change: dashboardStats.atendimentoWhats.change,
    icon: WhatsappIcon,
  },
  {
    title: "Próximo Mês",
    value: dashboardStats.proximoMes.value,
    change: dashboardStats.proximoMes.change,
    icon: CalendarCheckIn01Icon,
  },
];

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{stat.title}</p>
              <p className="text-2xl font-medium text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">
                +{stat.change} vs mês passado
              </p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted shrink-0">
              <HugeiconsIcon icon={stat.icon} className="size-5 text-muted-foreground" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
