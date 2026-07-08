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
import { Search01Icon, FilterIcon, ClinicIcon, Calendar01Icon } from "@hugeicons/core-free-icons";
import { todayTasks } from "@/mock-data/dashboard";
import { useDashboardStore } from "@/store/dashboard-store";
import { cn } from "@/lib/utils";

const typeMeta: Record<
  string,
  { label: string; icon: typeof ClinicIcon; color: string }
> = {
  consulta: { label: "Consulta", icon: ClinicIcon, color: "text-emerald-500" },
  calendario: { label: "Calendário", icon: Calendar01Icon, color: "text-slate-500" },
};

export function TodaysTasks() {
  const {
    tasksSearchQuery,
    setTasksSearchQuery,
    tasksProjectFilter,
    toggleTasksProjectFilter,
    setTasksProjectFilter,
  } = useDashboardStore();

  const filteredTasks = useMemo(() => {
    let result = todayTasks;
    if (tasksSearchQuery.trim()) {
      const q = tasksSearchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.patient?.toLowerCase().includes(q) ?? false)
      );
    }
    if (tasksProjectFilter.length > 0) {
      result = result.filter((t) => tasksProjectFilter.includes(t.type));
    }
    return result;
  }, [tasksSearchQuery, tasksProjectFilter]);

  const hasTaskFilters = tasksProjectFilter.length > 0;
  const uniqueTypes = Array.from(new Set(todayTasks.map((t) => t.type)));

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-b">
        <h3 className="font-medium text-base">Hoje</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <HugeiconsIcon icon={Search01Icon} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={tasksSearchQuery}
              onChange={(e) => setTasksSearchQuery(e.target.value)}
              className="pl-8 h-9 w-full sm:w-[200px] text-sm bg-muted/50"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" className="h-9 gap-1.5">
                  <HugeiconsIcon icon={FilterIcon} className="size-4" />
                  Filtrar
                  {hasTaskFilters && (
                    <span className="size-1.5 rounded-full bg-primary" />
                  )}
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuCheckboxItem
                checked={tasksProjectFilter.length === 0}
                onCheckedChange={() => setTasksProjectFilter([])}
              >
                Todos
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              {uniqueTypes.map((type) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={tasksProjectFilter.includes(type)}
                  onCheckedChange={() => toggleTasksProjectFilter(type)}
                >
                  {typeMeta[type]?.label ?? type}
                </DropdownMenuCheckboxItem>
              ))}
              {hasTaskFilters && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setTasksProjectFilter([])}>
                    Limpar filtro
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="divide-y">
        {filteredTasks.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhum item corresponde à sua busca.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const meta = typeMeta[task.type] ?? typeMeta.consulta;
            return (
              <div
                key={task.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <HugeiconsIcon icon={meta.icon} className={cn("size-4 shrink-0", meta.color)} />
                <span className="font-medium text-sm">{task.name}</span>
                {task.patient && (
                  <span className="rounded-lg border border-border bg-muted/50 px-2 py-1 text-xs font-medium text-foreground">
                    {task.patient}
                  </span>
                )}
                <span className="text-xs text-muted-foreground ml-auto tabular-nums">
                  {task.time}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
