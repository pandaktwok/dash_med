"use client";

import { useEffect, useMemo, useState } from "react";
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
import {
  Search01Icon,
  FilterIcon,
  ClinicIcon,
  Calendar01Icon,
  Cancel01Icon,
  Tick01Icon,
  Clock01Icon,
  Alert02Icon,
  PlayCircleIcon,
} from "@hugeicons/core-free-icons";
import { todayTasks, type TodayItem } from "@/mock-data/dashboard";
import { useDashboardStore } from "@/store/dashboard-store";
import { useProntuarioStore } from "@/store/prontuario-store";
import { useAtendimentoStore } from "@/store/atendimento-store";
import { useAgora, minutosDoDia, horarioParaMin } from "@/hooks/use-agora";
import { cn } from "@/lib/utils";

const typeMeta: Record<
  string,
  { label: string; icon: typeof ClinicIcon; color: string }
> = {
  consulta: { label: "Consulta", icon: ClinicIcon, color: "text-emerald-500" },
  calendario: { label: "Calendário", icon: Calendar01Icon, color: "text-slate-500" },
};

type Tarja = "none" | "amarela" | "vermelha" | "verde";

function calcTarja(
  item: TodayItem,
  consultas: TodayItem[],
  nowMin: number,
  atendendoId: string | null,
  finalizados: Record<string, true>,
): Tarja {
  if (finalizados[item.id]) return "verde";
  if (atendendoId !== item.id) return "none";

  // Médico está atendendo este paciente: avalia a próxima consulta.
  const proximas = consultas
    .filter((c) => c.type === "consulta" && c.id !== item.id && !finalizados[c.id])
    .map((c) => ({ c, min: horarioParaMin(c.time) }))
    .filter((x) => x.min > nowMin)
    .sort((a, b) => a.min - b.min);

  if (proximas.length === 0) return "verde";
  const restante = proximas[0].min - nowMin;
  if (restante <= 0) return "vermelha";
  if (restante <= 10) return "amarela";
  return "none";
}

const tarjaVisual: Record<Tarja, { bg: string; text: string; label: string; icon: typeof Alert02Icon }> = {
  none: { bg: "", text: "", label: "", icon: Clock01Icon },
  amarela: {
    bg: "bg-amber-500/15 border-amber-500/40",
    text: "text-amber-700 dark:text-amber-400",
    label: "Faltam 10 minutos para o próximo paciente",
    icon: Alert02Icon,
  },
  vermelha: {
    bg: "bg-rose-500/15 border-rose-500/40",
    text: "text-rose-700 dark:text-rose-400",
    label: "Atraso iminente — próximo paciente aguardando",
    icon: Alert02Icon,
  },
  verde: {
    bg: "bg-emerald-500/15 border-emerald-500/40",
    text: "text-emerald-700 dark:text-emerald-400",
    label: "Atendimento finalizado",
    icon: Tick01Icon,
  },
};

export function TodaysTasks() {
  const {
    tasksSearchQuery,
    setTasksSearchQuery,
    tasksProjectFilter,
    toggleTasksProjectFilter,
    setTasksProjectFilter,
  } = useDashboardStore();

  const openByConsulta = useProntuarioStore((s) => s.openByConsulta);
  const iniciarAtendimento = useAtendimentoStore((s) => s.iniciarAtendimento);
  const finalizarAtendimento = useAtendimentoStore((s) => s.finalizarAtendimento);
  const atendendoId = useAtendimentoStore((s) => s.atendendoId);
  const finalizados = useAtendimentoStore((s) => s.finalizados);
  const dismissAlerta = useAtendimentoStore((s) => s.dismissAlertaHorario);
  const alertaDismiss = useAtendimentoStore((s) => s.alertaHorarioDismiss);

  const now = useAgora();
  const nowMin = minutosDoDia(now);

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

  const consultasHoje = useMemo(
    () =>
      todayTasks
        .filter((t) => t.type === "consulta" && t.patient)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [],
  );

  // ===== Alerta de início de consulta =====
  const [alertaInicio, setAlertaInicio] = useState<TodayItem | null>(null);

  useEffect(() => {
    const alvo = consultasHoje.find((c) => {
      if (finalizados[c.id]) return false;
      if (atendendoId === c.id) return false;
      if (alertaDismiss === c.id) return false;
      const cMin = horarioParaMin(c.time);
      // Janela: horário chegou e ainda não passou 5 minutos além.
      return nowMin >= cMin && nowMin <= cMin + 5;
    });
    if (alvo) {
      setAlertaInicio((prev) => (prev?.id === alvo.id ? prev : alvo));
    }
  }, [nowMin, consultasHoje, finalizados, atendendoId, alertaDismiss]);

  const hasTaskFilters = tasksProjectFilter.length > 0;
  const uniqueTypes = Array.from(new Set(todayTasks.map((t) => t.type)));

  // Tarja do item em atendimento (banner topo)
  const itemAtendendo = consultasHoje.find((c) => c.id === atendendoId) ?? null;
  const tarjaAtendendo: Tarja = itemAtendendo
    ? calcTarja(itemAtendendo, consultasHoje, nowMin, atendendoId, finalizados)
    : "none";

  function handleAtender(item: TodayItem) {
    if (!item.patient) return;
    iniciarAtendimento(item.id);
    openByConsulta(item.patient);
  }

  function handleAbrirProntuario(item: TodayItem) {
    if (!item.patient) return;
    openByConsulta(item.patient);
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-b">
        <h3 className="font-medium text-base">Hoje</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <HugeiconsIcon icon={Search01Icon} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              aria-label="Buscar tarefas"
              value={tasksSearchQuery}
              onChange={(e) => setTasksSearchQuery(e.target.value)}
              className="pl-8 h-11 sm:h-9 min-h-[44px] sm:min-h-0 w-full sm:w-[200px] text-sm bg-muted/50"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" className="h-11 sm:h-9 min-h-[44px] sm:min-h-0 gap-1.5">
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

      {/* Tarja de tempo do atendimento ativo */}
      {itemAtendendo && tarjaAtendendo !== "none" && (
        <div
          className={cn(
            "flex items-center gap-2 px-4 py-2 border-b text-xs font-medium",
            tarjaVisual[tarjaAtendendo].bg,
            tarjaVisual[tarjaAtendendo].text,
          )}
        >
          <HugeiconsIcon icon={tarjaVisual[tarjaAtendendo].icon} className="size-4" />
          <span>{tarjaVisual[tarjaAtendendo].label}</span>
          <span className="ml-auto text-muted-foreground">
            Atendendo: {itemAtendendo.patient}
          </span>
          {tarjaAtendendo !== "verde" && (
            <Button
              size="xs"
              variant="outline"
              className="h-6 bg-emerald-600 text-white border-transparent hover:bg-emerald-600/90"
              onClick={() => finalizarAtendimento(itemAtendendo.id)}
            >
              Finalizar
            </Button>
          )}
        </div>
      )}

      <div className="divide-y">
        {filteredTasks.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <HugeiconsIcon icon={Search01Icon} className="size-6 text-muted-foreground" />
            </div>
            <p className="text-base font-medium text-foreground">Nenhuma tarefa encontrada</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-[250px]">
              Altere os filtros ou refine sua busca.
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const meta = typeMeta[task.type] ?? typeMeta.consulta;
            const isConsulta = task.type === "consulta" && !!task.patient;
            const atendido = !!finalizados[task.id];
            const atendendo = atendendoId === task.id;
            const tarja = calcTarja(task, consultasHoje, nowMin, atendendoId, finalizados);

            return (
              <div
                key={task.id}
                className={cn(
                  "flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors",
                  atendendo && "bg-amber-500/5",
                )}
              >
                <HugeiconsIcon icon={meta.icon} className={cn("size-4 shrink-0", meta.color)} />
                <button
                  onClick={() => isConsulta && handleAbrirProntuario(task)}
                  className="font-medium text-sm text-left hover:underline truncate"
                  disabled={!isConsulta}
                >
                  {task.name}
                </button>
                {task.patient && (
                  <span className="rounded-lg border border-border bg-muted/50 px-2 py-1 text-xs font-medium text-foreground">
                    {task.patient}
                  </span>
                )}

                {/* Indicador de status por cor (linha) */}
                {isConsulta && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-[11px] px-1.5",
                      atendido
                        ? "text-emerald-600 dark:text-emerald-400"
                        : atendendo
                          ? tarja === "vermelha"
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-amber-600 dark:text-amber-400"
                          : "text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        atendido
                          ? "bg-emerald-500"
                          : atendendo
                            ? tarja === "vermelha"
                              ? "bg-rose-500"
                              : "bg-amber-500"
                            : "bg-blue-500",
                      )}
                    />
                    {atendido ? "Atendido" : atendendo ? "Em Atendimento" : "Aguardando"}
                  </span>
                )}

                <span className="text-xs text-muted-foreground ml-auto tabular-nums">
                  {task.time}
                </span>

                {/* Botão Atendendo */}
                {isConsulta && !atendido && !atendendo && (
                  <Button
                    size="xs"
                    variant="outline"
                    className="h-6 gap-1 text-[11px] text-primary border-primary/40 hover:bg-primary/10"
                    onClick={() => handleAtender(task)}
                  >
                    <HugeiconsIcon icon={PlayCircleIcon} className="size-3" />
                    Atendendo
                  </Button>
                )}
                {isConsulta && atendido && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                    <HugeiconsIcon icon={Tick01Icon} className="size-3.5" />
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Popup: alerta de início de consulta */}
      {alertaInicio && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="alertdialog"
          aria-label="Alerta de início de consulta"
        >
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => {
              dismissAlerta(alertaInicio.id);
              setAlertaInicio(null);
            }}
            aria-hidden
          />
          <div className="relative z-10 w-full max-w-sm rounded-xl border bg-card shadow-xl p-4 flex flex-col gap-3">
            <div className="flex items-start gap-2">
              <HugeiconsIcon icon={Alert02Icon} className="size-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <h4 className="text-sm font-semibold">Está na hora do atendimento</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Paciente: <strong className="text-foreground">{alertaInicio.patient}</strong> · {alertaInicio.time}
                </p>
              </div>
              <button
                onClick={() => {
                  dismissAlerta(alertaInicio.id);
                  setAlertaInicio(null);
                }}
                className="text-muted-foreground hover:text-foreground p-1 shrink-0"
                aria-label="Fechar"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => {
                  dismissAlerta(alertaInicio.id);
                  setAlertaInicio(null);
                }}
              >
                Lembrar depois
              </Button>
              <Button
                size="sm"
                className="h-8 bg-primary hover:bg-primary/90"
                onClick={() => {
                  if (alertaInicio.patient) handleAtender(alertaInicio);
                  setAlertaInicio(null);
                }}
              >
                <HugeiconsIcon icon={Clock01Icon} className="size-4" />
                Atender agora
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
