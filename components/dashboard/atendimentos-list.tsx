"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, FilterIcon, CircleIcon, Tick01Icon, Clock01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { atendimentosPorDia, type AtendimentoStatus } from "@/mock-data/dashboard";
import { useDashboardStore } from "@/store/dashboard-store";
import { cn } from "@/lib/utils";

const statusMeta: Record<
  AtendimentoStatus,
  { label: string; icon: typeof CircleIcon; className: string }
> = {
  confirmado: { label: "Confirmado", icon: CircleIcon, className: "text-cyan-600 dark:text-cyan-400" },
  realizado: { label: "Realizado", icon: Tick01Icon, className: "text-emerald-600 dark:text-emerald-400" },
  pendente: { label: "Pendente", icon: Clock01Icon, className: "text-amber-600 dark:text-amber-400" },
  cancelado: { label: "Cancelado", icon: Cancel01Icon, className: "text-rose-600 dark:text-rose-400" },
};

const statusOptions = Object.keys(statusMeta) as AtendimentoStatus[];

export function AtendimentosList() {
  const {
    projectsSearchQuery,
    setProjectsSearchQuery,
    projectStatusFilter,
    setProjectStatusFilter,
  } = useDashboardStore();

  const filteredDias = useMemo(() => {
    const q = projectsSearchQuery.trim().toLowerCase();
    return atendimentosPorDia.map((dia) => {
      const itens = dia.itens.filter((a) => {
        const matchesQuery =
          !q ||
          a.paciente.toLowerCase().includes(q) ||
          a.tipo.toLowerCase().includes(q);
        const matchesStatus =
          projectStatusFilter === "all" || a.status === projectStatusFilter;
        return matchesQuery && matchesStatus;
      });
      return { ...dia, itens };
    });
  }, [projectsSearchQuery, projectStatusFilter]);

  const hasActiveFilters = projectStatusFilter !== "all";
  const totalItens = filteredDias.reduce((acc, d) => acc + d.itens.length, 0);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-b">
        <h3 className="font-medium text-base">Lista de Atendimentos</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <HugeiconsIcon icon={Search01Icon} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={projectsSearchQuery}
              onChange={(e) => setProjectsSearchQuery(e.target.value)}
              className="pl-8 h-9 w-full sm:w-[200px] text-sm bg-muted/50"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" className="h-9 gap-1.5">
                  <HugeiconsIcon icon={FilterIcon} className="size-4" />
                  Filtrar
                  {hasActiveFilters && (
                    <span className="size-1.5 rounded-full bg-primary" />
                  )}
                </Button>
              }
            />
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuCheckboxItem
                checked={projectStatusFilter === "all"}
                onCheckedChange={() => setProjectStatusFilter("all")}
              >
                Todos os status
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              {statusOptions.map((s) => (
                <DropdownMenuCheckboxItem
                  key={s}
                  checked={projectStatusFilter === s}
                  onCheckedChange={() => setProjectStatusFilter(s)}
                >
                  {statusMeta[s].label}
                </DropdownMenuCheckboxItem>
              ))}
              {hasActiveFilters && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setProjectStatusFilter("all")}>
                    Limpar filtro
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="p-4">
        {totalItens === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Nenhum atendimento encontrado.
          </div>
        ) : (
          <div className="space-y-2">
            {filteredDias.map((dia, diaIndex) =>
              dia.itens.length === 0 ? null : (
                <div key={dia.dia}>
                  {diaIndex > 0 && (
                    <div className="flex items-center py-3" aria-hidden>
                      <span className="h-px flex-1 bg-border border-dashed" />
                    </div>
                  )}
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">
                    {dia.dia}
                  </p>
                  <div className="divide-y rounded-lg border border-border overflow-hidden">
                    {dia.itens.map((a) => {
                      const meta = statusMeta[a.status];
                      return (
                        <div
                          key={a.id}
                          className="flex flex-wrap items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors"
                        >
                          <span className="text-sm font-medium tabular-nums w-12">
                            {a.horario}
                          </span>
                          <span className="text-sm text-foreground">{a.paciente}</span>
                          <span className="text-xs text-muted-foreground">
                            {a.tipo}
                          </span>
                          <div className={cn("flex items-center gap-1.5 ml-auto", meta.className)}>
                            <HugeiconsIcon icon={meta.icon} className="size-3.5" />
                            <span className="text-xs">{meta.label}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
