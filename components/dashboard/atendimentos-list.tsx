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
import { Search01Icon, FilterIcon } from "@hugeicons/core-free-icons";
import { atendimentosPorDia } from "@/mock-data/dashboard";
import { useDashboardStore } from "@/store/dashboard-store";
import { useProntuarioStore } from "@/store/prontuario-store";
import { cn } from "@/lib/utils";
import { statusMeta, statusOptions } from "@/lib/status";

export function AtendimentosList() {
  const {
    projectsSearchQuery,
    setProjectsSearchQuery,
    projectStatusFilter,
    setProjectStatusFilter,
  } = useDashboardStore();
  const openByConsulta = useProntuarioStore((s) => s.openByConsulta);

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
              aria-label="Buscar atendimentos"
              value={projectsSearchQuery}
              onChange={(e) => setProjectsSearchQuery(e.target.value)}
              className="pl-8 h-11 sm:h-9 min-h-[44px] sm:min-h-0 w-full sm:w-[200px] text-sm bg-muted/50"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" className="h-11 sm:h-9 min-h-[44px] sm:min-h-0 gap-1.5">
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
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <HugeiconsIcon icon={Search01Icon} className="size-6 text-muted-foreground" />
            </div>
            <p className="text-base font-medium text-foreground">Nenhum atendimento encontrado</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-[250px]">
              Tente alterar os filtros ou o termo de busca para encontrar o que precisa.
            </p>
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
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => openByConsulta(a.paciente)}
                          className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer w-full text-left"
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
                        </button>
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
