"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Add01Icon,
  Alert02Icon,
  Calendar03Icon,
  Delete01Icon,
  Tick01Icon,
  Cancel01Icon,
  Clock01Icon,
  ClipboardIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import {
  statusMeta,
  statusOptions,
  legendaCores,
  compromissoColor,
  horarioFim,
} from "@/lib/status";
import { useCalendarioStore } from "@/store/calendario-store";
import { useProntuarioStore } from "@/store/prontuario-store";
import {
  feriados,
  clientesCatalogo,
  slotsHorario,
  WEEKDAYS_SHORT,
  MONTHS,
  toDateKey,
  parseDateKey,
  addDays,
  addMonths,
  PERIODO_ATENDIMENTO,
  type Compromisso,
  type CalendarViewMode,
} from "@/mock-data/calendario";
import type { AtendimentoStatus } from "@/mock-data/dashboard";

const duracaoOptions = [
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1h" },
  { value: 90, label: "1h30" },
];

// ---------- Helpers ----------
const todayKey = toDateKey(new Date());

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function startOfWeekMonday(d: Date) {
  const day = d.getDay(); // 0=dom
  const diff = day === 0 ? -6 : 1 - day;
  const r = new Date(d);
  r.setDate(d.getDate() + diff);
  r.setHours(0, 0, 0, 0);
  return r;
}
function fmtDateForInput(key: string) {
  return key; // YYYY-MM-DD
}
function prettifyDate(dataKey: string) {
  const d = parseDateKey(dataKey);
  return `${d.getDate().toString().padStart(2, "0")} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}
function weekdayNameShort(idx: number) {
  return WEEKDAYS_SHORT[idx];
}
function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ============================================================
// Toolbar
// ============================================================
function ViewToggle() {
  const view = useCalendarioStore((s) => s.view);
  const setView = useCalendarioStore((s) => s.setView);
  const options: { v: CalendarViewMode; label: string }[] = [
    { v: "ano", label: "Ano" },
    { v: "mes", label: "Mês" },
    { v: "semana", label: "Semana" },
  ];
  return (
    <div className="inline-flex items-center rounded-md border bg-muted/40 p-0.5">
      {options.map((o) => (
        <button
          key={o.v}
          onClick={() => setView(o.v)}
          className={cn(
            "px-3 h-8 rounded-[5px] text-xs font-medium transition-colors",
            view === o.v
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Toolbar() {
  const cursor = useCalendarioStore((s) => s.cursor);
  const view = useCalendarioStore((s) => s.view);
  const navigate = useCalendarioStore((s) => s.navigate);
  const goToday = useCalendarioStore((s) => s.goToday);
  const openCompromissoSheet = useCalendarioStore((s) => s.openCompromissoSheet);

  const label = useMemo(() => {
    if (view === "ano") return `${cursor.getFullYear()}`;
    if (view === "semana") {
      const start = startOfWeekMonday(cursor);
      const end = addDays(start, 6);
      const s = `${start.getDate()} ${MONTHS[start.getMonth()].slice(0, 3)}`;
      const e = `${end.getDate()} ${MONTHS[end.getMonth()].slice(0, 3)}`;
      return `${s} – ${e}, ${end.getFullYear()}`;
    }
    return `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;
  }, [cursor, view]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" onClick={() => navigate(-1)} aria-label="Anterior">
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
          </Button>
          <Button variant="outline" size="icon-sm" onClick={() => navigate(1)} aria-label="Próximo">
            <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={goToday} className="h-8">
          Hoje
        </Button>
        <h2 className="text-base sm:text-lg font-semibold tracking-tight ml-1">
          {label}
        </h2>
      </div>
      <div className="flex items-center gap-2">
        <ViewToggle />
        <Button
          size="sm"
          className="h-8 gap-1.5 bg-primary hover:bg-primary/90"
          onClick={() => openCompromissoSheet(todayKey)}
        >
          <HugeiconsIcon icon={Add01Icon} className="size-4" />
          <span className="hidden sm:inline">Novo compromisso</span>
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// Comprimisso block (mês view)
// ============================================================
function BlocoCompromisso({
  c,
  compact,
  nameOnly,
  week,
}: {
  c: Compromisso;
  compact?: boolean;
  nameOnly?: boolean;
  week?: boolean;
}) {
  const openCompromissoPopup = useCalendarioStore(
    (s) => s.openCompromissoPopup,
  );
  const openByConsulta = useProntuarioStore((s) => s.openByConsulta);

  function handleOpen(e: MouseEvent) {
    e.stopPropagation();
    // Consultas abrem diretamente o Prontuário Médico (modal expandido).
    if (c.tipo === "consulta" && c.paciente) {
      openByConsulta(c.paciente, c.id);
      return;
    }
    openCompromissoPopup(c.id);
  }

  const title = c.tipo === "pessoal" ? c.titulo : c.paciente;
  const subtitle =
    c.tipo === "pessoal" ? "Pessoal" : c.especialidade;

  // View "semana": nome do cliente (linha 1) e "HH:mm - HH:mm - Especialidade"
  // (linha 2), com cores conforme o novo padrão (verde/amarelo/vermelho/cinza).
  if (week) {
    const fim = horarioFim(c.horario, c.duracaoMin);
    return (
      <button
        onClick={handleOpen}
        className={cn(
          "w-full text-left rounded-md border px-1.5 py-1 text-xs flex flex-col gap-0.5 hover:brightness-110 transition",
          compromissoColor(c),
        )}
        title={title}
      >
        <span className="font-medium truncate leading-tight">{title}</span>
        <span className="tabular-nums truncate leading-tight opacity-90">
          {c.horario} - {fim}
          {c.especialidade ? ` - ${c.especialidade}` : c.tipo === "pessoal" ? " - Externo" : ""}
        </span>
      </button>
    );
  }

  if (nameOnly) {
    return (
      <button
        onClick={handleOpen}
        className={cn(
          "w-full text-left rounded-md border px-1.5 py-0.5 text-xs truncate hover:brightness-110 transition",
          compromissoColor(c),
        )}
        title={title}
      >
        <span className="truncate block">{title}</span>
      </button>
    );
  }
  return (
    <button
      onClick={handleOpen}
      className={cn(
        "w-full text-left rounded-md border px-1.5 py-1 text-xs flex items-center gap-1.5 hover:brightness-110 transition",
        compromissoColor(c),
        compact ? "truncate" : "",
      )}
    >
      <HugeiconsIcon
        icon={c.tipo === "pessoal" ? Calendar03Icon : Clock01Icon}
        className="size-3 shrink-0"
      />
      <span className="font-medium tabular-nums shrink-0">{c.horario}</span>
      <span className={cn("truncate", compact && "sr-only sm:not-sr-only")}>{title}</span>
      {!compact && subtitle && (
        <span className="text-[10px] opacity-70 truncate hidden md:inline">· {subtitle}</span>
      )}
    </button>
  );
}

// ============================================================
// Month grid
// ============================================================
function MonthGrid() {
  const cursor = useCalendarioStore((s) => s.cursor);
  const compromissos = useCalendarioStore((s) => s.compromissos);
  const feriadosConfigs = useCalendarioStore((s) => s.feriadosConfigs);
  const openCompromissoSheet = useCalendarioStore(
    (s) => s.openCompromissoSheet,
  );
  const [feriadoPopup, setFeriadoPopup] = useState<
    { key: string; rect: DOMRect } | null
  >(null);

  // Mapa dataKey -> lista de compromissos do dia
  const byDate = useMemo(() => {
    const map = new Map<string, Compromisso[]>();
    for (const c of compromissos) {
      if (!map.has(c.data)) map.set(c.data, []);
      map.get(c.data)!.push(c);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => a.horario.localeCompare(b.horario));
    }
    return map;
  }, [compromissos]);

  // Lista de feriados por data para destaque visual no grid
  const feriadoMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const f of feriados) m.set(f.data, f.nome);
    return m;
  }, []);

  const start = startOfMonth(cursor);
  // Grade começa no domingo da semana do dia 1
  const gridStart = addDays(start, -start.getDay());
  const rows = 6;
  const cells = Array.from({ length: rows * 7 }, (_, i) => addDays(gridStart, i));

  return (
    <div className="rounded-xl border bg-card overflow-hidden flex-1 min-h-0 flex flex-col">
      {/* Header dias da semana */}
      <div className="grid grid-cols-7 border-b bg-muted/40">
        {WEEKDAYS_SHORT.map((w) => (
          <div
            key={w}
            className="py-2 px-3 text-xs font-medium text-muted-foreground border-r last:border-r-0"
          >
            {w}
          </div>
        ))}
      </div>

      {/* Grid dias */}
      <div className="grid grid-cols-7 grid-rows-6 flex-1 min-h-0">
        {cells.map((d) => {
          const key = toDateKey(d);
          const inMonth = d.getMonth() === cursor.getMonth();
          const isToday = key === todayKey;
          const itens = byDate.get(key) ?? [];
          const feriadoNome = feriadoMap.get(key);
          const cfg = feriadosConfigs[key];
          const decidido = !!cfg && cfg.atendeDia !== null;
          const atende = cfg?.atendeDia === true;
          return (
            <div
              key={key}
              onClick={() => openCompromissoSheet(key)}
              className={cn(
                "relative border-r border-b last:border-r-0 p-1.5 flex flex-col gap-1 cursor-pointer group hover:bg-muted/30 transition-colors min-h-[88px]",
                !inMonth && "bg-muted/20 text-muted-foreground",
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "text-xs font-medium size-6 flex items-center justify-center rounded-full",
                    isToday
                      ? "bg-primary text-primary-foreground"
                      : inMonth
                      ? "text-foreground"
                      : "text-muted-foreground/60",
                  )}
                >
                  {d.getDate()}
                </span>
              </div>
              {feriadoNome && (
                <button
                  type="button"
                  aria-label={`Feriado: ${feriadoNome}. Decidir atendimento.`}
                  title={feriadoNome}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFeriadoPopup({
                      key,
                      rect: (e.currentTarget as HTMLElement).getBoundingClientRect(),
                    });
                  }}
                  className={cn(
                    "absolute top-1 right-1 size-2 rounded-full transition-transform hover:scale-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    !decidido
                      ? "bg-amber-500 ring-2 ring-amber-500/30"
                      : atende
                      ? "bg-emerald-500"
                      : "bg-rose-500",
                  )}
                />
              )}
              <div className="flex flex-col gap-1 overflow-hidden">
                {itens.slice(0, 3).map((c) => (
                  <BlocoCompromisso key={c.id} c={c} compact />
                ))}
                {itens.length > 3 && (
                  <span className="text-[10px] text-muted-foreground pl-1">
                    +{itens.length - 3} mais
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {feriadoPopup && (
        <FeriadoPopover
          dataKey={feriadoPopup.key}
          anchorRect={feriadoPopup.rect}
          onClose={() => setFeriadoPopup(null)}
        />
      )}
    </div>
  );
}

// ============================================================
// Week grid
// ============================================================
function WeekGrid() {
  const cursor = useCalendarioStore((s) => s.cursor);
  const compromissos = useCalendarioStore((s) => s.compromissos);
  const openCompromissoSheet = useCalendarioStore(
    (s) => s.openCompromissoSheet,
  );

  const byDate = useMemo(() => {
    const map = new Map<string, Compromisso[]>();
    for (const c of compromissos) {
      if (!map.has(c.data)) map.set(c.data, []);
      map.get(c.data)!.push(c);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.horario.localeCompare(b.horario));
    return map;
  }, [compromissos]);

  const weekStart = startOfWeekMonday(cursor);
  // Ordem Seg..Dom
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  // Ordem de colunas: Seg Sex Sáb Dom -> 1,2,3,4,5,6,0
  const order = [1, 2, 3, 4, 5, 6, 0];
  const cols = order.map((o) => days.find((d) => d.getDay() === o)!);

  return (
    <div className="rounded-xl border bg-card overflow-hidden flex-1 min-h-0 flex flex-col">
      {/* Header dias */}
      <div className="grid grid-cols-8 border-b bg-muted/40">
        <div className="py-2 px-2 text-xs text-muted-foreground border-r w-16">Hora</div>
        {cols.map((d) => {
          const key = toDateKey(d);
          const isToday = key === todayKey;
          return (
            <div
              key={key}
              className="py-2 px-2 text-xs text-center border-r last:border-r-0"
            >
              <div className="font-medium">{weekdayNameShort(d.getDay())}</div>
              <div
                className={cn(
                  "mt-1 inline-flex size-6 items-center justify-center rounded-full",
                  isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                {d.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Slots de hora */}
      <div className="flex-1 overflow-auto">
        {slotsHorario.map((slot) => {
          const [h, m] = slot.split(":").map(Number);
          return (
            <div
              key={slot}
              className="grid grid-cols-8 border-b last:border-b-0 min-h-[56px]"
            >
              <div className="py-1 px-2 text-xs text-muted-foreground border-r w-16 tabular-nums bg-muted/20">
                {slot}
              </div>
              {cols.map((d) => {
                const key = toDateKey(d);
                const itens = (byDate.get(key) ?? []).filter((c) => c.horario === slot);
                const inPeriod =
                  h >= PERIODO_ATENDIMENTO.horaInicio &&
                  (h < PERIODO_ATENDIMENTO.horaFim ||
                    (h === PERIODO_ATENDIMENTO.horaFim - 1 && m === 30));
                return (
                  <div
                    key={key + slot}
                    onClick={() => inPeriod && openCompromissoSheet(key)}
                    className={cn(
                      "border-r last:border-r-0 p-1 flex flex-col gap-1",
                      inPeriod
                        ? "cursor-pointer hover:bg-muted/30"
                        : "bg-muted/10 cursor-not-allowed",
                    )}
                  >
                    {itens.map((c) => (
                      <BlocoCompromisso key={c.id} c={c} week />
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Year grid
// ============================================================
function YearGrid() {
  const cursor = useCalendarioStore((s) => s.cursor);
  const compromissos = useCalendarioStore((s) => s.compromissos);
  const setCursorMonth = useCalendarioStore((s) => s.setCursorMonth);
  const setView = useCalendarioStore((s) => s.setView);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of compromissos) {
      map.set(c.data, (map.get(c.data) ?? 0) + 1);
    }
    return map;
  }, [compromissos]);

  const months = useMemo(
    () => Array.from({ length: 12 }, (_, i) => i),
    [],
  );

  return (
    <div className="rounded-xl border bg-card overflow-hidden flex-1 min-h-0 overflow-y-auto p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {months.map((m) => {
          const ref = new Date(cursor.getFullYear(), m, 1);
          const gridStart = addDays(ref, -ref.getDay());
          const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
          return (
            <button
              key={m}
              onClick={() => {
                setCursorMonth(cursor.getFullYear(), m);
                setView("mes");
              }}
              className="rounded-lg border p-2 text-left hover:bg-muted/30 transition-colors"
            >
              <div className="text-xs font-medium mb-1 px-1">
                {MONTHS[m]}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {cells.map((d) => {
                  const key = toDateKey(d);
                  const inMonth = d.getMonth() === m;
                  const cnt = counts.get(key) ?? 0;
                  return (
                    <div
                      key={key}
                      className={cn(
                        "h-5 text-[9px] flex items-center justify-center rounded",
                        !inMonth && "opacity-30",
                        cnt > 0 && "bg-primary/20 text-primary font-medium",
                      )}
                      title={inMonth && cnt > 0 ? `${cnt} compromisso(s)` : undefined}
                    >
                      {d.getDate()}
                    </div>
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Painel de feriados (lateral direita)
// ============================================================
function FeriadosPanel() {
  const cursor = useCalendarioStore((s) => s.cursor);
  const feriadosConfigs = useCalendarioStore((s) => s.feriadosConfigs);
  const openFeriadoSheet = useCalendarioStore((s) => s.openFeriadoSheet);

  // Feriados relevantes: mês atual + próximos 2 meses (antecedência).
  const lista = useMemo(() => {
    const inicio = startOfMonth(cursor);
    const fim = addMonths(inicio, 3); // exclusive
    return feriados
      .filter((f) => {
        const d = parseDateKey(f.data);
        return d >= inicio && d < fim;
      })
      .sort((a, b) => a.data.localeCompare(b.data));
  }, [cursor]);

  const pendentes = lista.filter((f) => {
    const cfg = feriadosConfigs[f.data];
    return !cfg || cfg.atendeDia === null;
  });

  return (
    <aside className="rounded-xl border bg-card p-4 w-full lg:w-72 shrink-0 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <HugeiconsIcon icon={Alert02Icon} className="size-4 text-amber-500" />
        <h3 className="text-sm font-semibold">Feriados</h3>
        {pendentes.length > 0 && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2 py-0.5 text-[11px] font-medium">
            <span className="size-1.5 rounded-full bg-amber-500" />
            {pendentes.length} pendente(s)
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground -mt-1">
        Indicador de feriados do mês atual e dos 2 meses seguintes (janela de
        antecedência). Clique no alerta para decidir se haverá atendimento.
      </p>

      {lista.length === 0 ? (
        <div className="text-xs text-muted-foreground py-6 text-center border border-dashed rounded-lg">
          Sem feriados no período.
        </div>
      ) : (
        <div className="flex flex-col gap-2 overflow-y-auto max-h-[460px] pr-0.5">
          {lista.map((f) => {
            const cfg = feriadosConfigs[f.data];
            const decidido = !!cfg && cfg.atendeDia !== null;
            const atende = cfg?.atendeDia === true;
            return (
              <button
                key={f.data}
                onClick={() => openFeriadoSheet(f.data)}
                className={cn(
                  "w-full text-left rounded-lg border p-2.5 hover:bg-muted/40 transition-colors group",
                  !decidido && "border-amber-500/40",
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-center justify-center size-9 rounded-md bg-muted/60 shrink-0">
                    <span className="text-[10px] leading-none text-muted-foreground">
                      {MONTHS[parseDateKey(f.data).getMonth()].slice(0, 3)}
                    </span>
                    <span className="text-sm font-semibold leading-none">
                      {parseDateKey(f.data).getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{f.nome}</div>
                    <div className="text-[11px] text-muted-foreground capitalize">
                      {weekdayNameShort(parseDateKey(f.data).getDay())} · {f.tipo}
                    </div>
                  </div>
                  {decidido ? (
                    atende ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[11px]">
                        <HugeiconsIcon icon={Tick01Icon} className="size-3" />
                        Atende
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 px-2 py-0.5 text-[11px]">
                        <HugeiconsIcon icon={Cancel01Icon} className="size-3" />
                        Não atende
                      </span>
                    )
                  ) : (
                    <span
                      role="alert"
                      aria-label="Decidir atendimento do feriado"
                      className="inline-flex items-center justify-center size-7 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition"
                    >
                      <HugeiconsIcon icon={Alert02Icon} className="size-4" />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
}

// ============================================================
// Sheet: Novo/Editar compromisso
// ============================================================
function CompromissoSheet() {
  const open = useCalendarioStore((s) => s.sheetOpen);
  const preset = useCalendarioStore((s) => s.sheetPresetData);
  const close = useCalendarioStore((s) => s.closeCompromissoSheet);
  const compromissos = useCalendarioStore((s) => s.compromissos);
  const addCompromisso = useCalendarioStore((s) => s.addCompromisso);
  const removeCompromisso = useCalendarioStore((s) => s.removeCompromisso);
  const updateStatus = useCalendarioStore((s) => s.updateStatus);

  const [tipo, setTipo] = useState<"consulta" | "pessoal">("consulta");
  const [data, setData] = useState(preset ?? todayKey);
  const [horario, setHorario] = useState("09:00");
  const [duracao, setDuracao] = useState(30);
  const [clienteIdx, setClienteIdx] = useState(0);
  const [status, setStatus] = useState<AtendimentoStatus>("confirmado");
  const [titulo, setTitulo] = useState("");

  // Resync quando abrir com preset diferente
  useEffect(() => {
    if (open && preset) {
      setData(preset);
    }
  }, [open, preset]);

  const diaKey = data;
  const itens = useMemo(() => {
    return compromissos
      .filter((c) => c.data === diaKey)
      .sort((a, b) => a.horario.localeCompare(b.horario));
  }, [compromissos, diaKey]);

  function salvar() {
    if (tipo === "consulta") {
      const cli = clientesCatalogo[clienteIdx];
      addCompromisso({
        data,
        horario,
        duracaoMin: duracao,
        tipo: "consulta",
        paciente: cli.nome,
        especialidade: cli.especialidade,
        status,
        telefone: cli.telefone,
      });
    } else {
      if (!titulo.trim()) return;
      addCompromisso({
        data,
        horario,
        duracaoMin: duracao,
        tipo: "pessoal",
        titulo: titulo.trim(),
      });
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && close()}>
      <SheetContent side="right" className="w-[420px] max-w-full sm:max-w-[440px] flex flex-col gap-0">
        <SheetHeader className="border-b">
          <SheetTitle className="text-base">
            Compromissos — {prettifyDate(diaKey)}
          </SheetTitle>
          <SheetDescription className="text-xs">
            Cadastre um agendamento de cliente ou um compromisso pessoal. Horários
            pessoais reservam o slot.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {/* Lista de compromissos do dia */}
          {itens.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Agendados neste dia
              </span>
              {itens.map((c) => (
                <div
                  key={c.id}
                  className="rounded-md border p-2 flex items-center gap-2 text-xs"
                >
                  <span className="font-medium tabular-nums w-12">{c.horario}</span>
                  {c.tipo === "pessoal" ? (
                    <>
                      <HugeiconsIcon icon={Calendar03Icon} className="size-3.5 text-slate-500 dark:text-slate-400" />
                      <span className="truncate">{c.titulo}</span>
                      <span className="text-muted-foreground">· Externo</span>
                    </>
                  ) : (
                    <>
                      <HugeiconsIcon icon={Clock01Icon} className={cn("size-3.5", statusMeta[c.status!].className)} />
                      <span className="truncate">{c.paciente}</span>
                      <span className="text-muted-foreground truncate hidden md:inline">
                        · {c.especialidade}
                      </span>
                    </>
                  )}
                  {c.tipo === "consulta" && (
                    <div className="ml-auto flex items-center gap-1">
                      {statusOptions.map((s) => (
                        <button
                          key={s}
                          title={statusMeta[s].label}
                          onClick={() => updateStatus(c.id, s)}
                          className={cn(
                            "size-3 rounded-full transition",
                            statusMeta[s].dot,
                            c.status === s
                              ? "ring-2 ring-offset-1 ring-offset-background ring-foreground/40 scale-110"
                              : "opacity-50 hover:opacity-100",
                          )}
                        />
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => removeCompromisso(c.id)}
                    className="text-muted-foreground hover:text-rose-500 transition-colors p-1"
                    aria-label="Excluir compromisso"
                  >
                    <HugeiconsIcon icon={Delete01Icon} className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Tipo */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Tipo</span>
            <div className="grid grid-cols-2 gap-2">
              {(["consulta", "pessoal"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTipo(t)}
                  className={cn(
                    "h-9 rounded-md border text-sm font-medium transition",
                    tipo === t
                      ? "bg-primary text-primary-foreground border-transparent"
                      : "bg-background hover:bg-muted",
                  )}
                >
                  {t === "consulta" ? "Cliente (consulta)" : "Pessoal"}
                </button>
              ))}
            </div>
          </div>

          {/* Data + horário */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Data</span>
              <Input
                type="date"
                value={fmtDateForInput(data)}
                onChange={(e) => e.target.value && setData(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Horário</span>
              <Input type="time" value={horario} onChange={(e) => setHorario(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Duração</span>
            <select
              value={duracao}
              onChange={(e) => setDuracao(Number(e.target.value))}
              className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 outline-none dark:bg-input/30"
            >
              {duracaoOptions.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {tipo === "consulta" ? (
            <>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Cliente</span>
                <select
                  value={clienteIdx}
                  onChange={(e) => setClienteIdx(Number(e.target.value))}
                  className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 outline-none dark:bg-input/30"
                >
                  {clientesCatalogo.map((c, i) => (
                    <option key={c.nome + i} value={i}>
                      {c.nome} — {c.especialidade} · {c.telefone}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Status</span>
                <div className="flex flex-wrap gap-1.5">
                  {statusOptions.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={cn(
                        "h-8 px-2.5 rounded-md border text-xs font-medium inline-flex items-center gap-1.5 transition",
                        status === s
                          ? "border-transparent bg-primary text-primary-foreground"
                          : "hover:bg-muted",
                      )}
                    >
                      <span className={cn("size-2 rounded-full", statusMeta[s].dot)} />
                      {statusMeta[s].label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Título</span>
              <Input
                placeholder="Ex.: Reunião, Almoço, Curso..."
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
            </div>
          )}
        </div>

        <SheetFooter className="border-t">
          <Button variant="outline" onClick={close}>
            Cancelar
          </Button>
          <Button
            onClick={salvar}
            className="bg-primary hover:bg-primary/90"
            disabled={tipo === "pessoal" && !titulo.trim()}
          >
            <HugeiconsIcon icon={Add01Icon} className="size-4" />
            Salvar compromisso
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ============================================================
// Popover: Decisão de feriado (ancorado ao indicador discreto)
// ============================================================
function FeriadoPopover({
  dataKey,
  anchorRect,
  onClose,
}: {
  dataKey: string;
  anchorRect: DOMRect;
  onClose: () => void;
}) {
  const configs = useCalendarioStore((s) => s.feriadosConfigs);
  const setConfig = useCalendarioStore((s) => s.setFeriadoConfig);

  const f = feriados.find((x) => x.data === dataKey);
  if (!f) return null;
  const cfg = configs[dataKey] ?? { dataFeriado: dataKey, atendeDia: null };
  const dia = parseDateKey(dataKey);
  const diaSemana = weekdayNameShort(dia.getDay());
  const inPeriod = PERIODO_ATENDIMENTO.diasSemana.includes(dia.getDay());

  const adjKey = cfg.diaAdjacente;
  const adj = adjKey ? parseDateKey(adjKey) : null;
  const adjSemana = adj ? weekdayNameShort(adj.getDay()) : null;
  const adjPretify = adj ? prettifyDate(adjKey!) : null;

  // Antecedência: faltar >= 2 meses a partir de hoje
  const hoje = new Date();
  const diffMeses =
    (dia.getFullYear() - hoje.getFullYear()) * 12 +
    (dia.getMonth() - hoje.getMonth());
  const dentroJanela = diffMeses >= 2;

  // Posicionamento do popup: abaixo do indicador, alinhado a direita
  const top = anchorRect.bottom + 6;
  const right = window.innerWidth - anchorRect.right;

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-label={`Decidir atendimento do feriado ${f.nome}`}
        className="fixed z-50 w-72 rounded-lg border bg-popover text-popover-foreground shadow-lg p-3 flex flex-col gap-3"
        style={{ top, right: Math.max(8, right) }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-2">
          <HugeiconsIcon icon={Alert02Icon} className="size-4 text-amber-500 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-medium leading-tight">{f.nome}</div>
            <div className="text-[11px] text-muted-foreground">
              {prettifyDate(dataKey)} · {diaSemana} · {f.tipo}
            </div>
          </div>
        </div>

        {!inPeriod && (
          <p className="text-[11px] text-muted-foreground rounded-md border bg-muted/30 p-2">
            Feriado em fim de semana — fora do período seg-sex. Nenhuma decisão
            adicional necessária.
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Haverá atendimento neste dia?
          </span>
          <div className="grid grid-cols-2 gap-2">
            <FeriadoButton
              active={cfg.atendeDia === true}
              onClick={() => setConfig(dataKey, { atendeDia: true })}
              tone="emerald"
              icon={Tick01Icon}
              label="Sim, atender"
            />
            <FeriadoButton
              active={cfg.atendeDia === false}
              onClick={() => setConfig(dataKey, { atendeDia: false })}
              tone="rose"
              icon={Cancel01Icon}
              label="Não atender"
            />
          </div>
        </div>

        {inPeriod && adj && (
          <div className="rounded-lg border p-2.5 flex flex-col gap-2 bg-muted/30">
            <div className="flex items-center gap-1.5 text-xs">
              <HugeiconsIcon icon={Alert02Icon} className="size-3.5 text-amber-500" />
              <span className="font-medium">Dia adjacente</span>
              <span className="text-muted-foreground truncate">
                · {adjSemana}, {adjPretify}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Feriado numa {diaSemana} (seg-sex). Atender na {adjSemana} seguinte
              ({adjPretify})?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <FeriadoButton
                active={cfg.atendeAdjacente === true}
                onClick={() => setConfig(dataKey, { atendeAdjacente: true })}
                tone="emerald"
                icon={Tick01Icon}
                label="Sim, atender"
              />
              <FeriadoButton
                active={cfg.atendeAdjacente === false}
                onClick={() => setConfig(dataKey, { atendeAdjacente: false })}
                tone="rose"
                icon={Cancel01Icon}
                label="Não atender"
              />
            </div>
          </div>
        )}

        {!dentroJanela && (
          <p className="text-[10px] text-muted-foreground">
            Recomendado responder com 2 meses de antecedência.
          </p>
        )}

        <div className="flex justify-end">
          <Button size="sm" variant="outline" className="h-8" onClick={onClose}>
            Concluir
          </Button>
        </div>
      </div>
    </>
  );
}

function FeriadoButton({
  active,
  onClick,
  tone,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  tone: "emerald" | "rose";
  icon: typeof Tick01Icon;
  label: string;
}) {
  const toneClass =
    tone === "emerald"
      ? "border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
      : "border-transparent bg-rose-500/15 text-rose-600 dark:text-rose-400";
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-10 rounded-md border text-sm font-medium inline-flex items-center justify-center gap-1.5 transition",
        active ? toneClass : "bg-background hover:bg-muted",
      )}
    >
      <HugeiconsIcon icon={icon} className="size-4" />
      {label}
    </button>
  );
}

// ============================================================
// Legenda / Toolbar (acima do calendário)
// ============================================================
function LegendaCores() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1">
      {legendaCores.map((item) => (
        <div
          key={item.key}
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
        >
          <span className={cn("size-2.5 rounded-sm", item.className)} />
          <span className={item.textClass}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Popup: Detalhes / edição de compromisso (modal central)
// ============================================================
function CompromissoPopup() {
  const popupId = useCalendarioStore((s) => s.popupCompromissoId);
  const close = useCalendarioStore((s) => s.closeCompromissoPopup);
  const compromissos = useCalendarioStore((s) => s.compromissos);
  const updateCompromisso = useCalendarioStore((s) => s.updateCompromisso);
  const removeCompromisso = useCalendarioStore((s) => s.removeCompromisso);
  const openByConsulta = useProntuarioStore((s) => s.openByConsulta);

  const c = useMemo(
    () => compromissos.find((x) => x.id === popupId) ?? null,
    [compromissos, popupId],
  );

  // Histórico de títulos de compromissos pessoais (para autocomplete)
  const historicoExternos = useMemo(() => {
    const set = new Map<string, number>();
    for (const x of compromissos) {
      if (x.tipo === "pessoal" && x.titulo) {
        set.set(x.titulo, (set.get(x.titulo) ?? 0) + 1);
      }
    }
    return Array.from(set.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([t]) => t);
  }, [compromissos]);

  const [tipo, setTipo] = useState<"consulta" | "pessoal">("consulta");
  const [data, setData] = useState(todayKey);
  const [horario, setHorario] = useState("09:00");
  const [duracao, setDuracao] = useState(30);
  const [clienteIdx, setClienteIdx] = useState(0);
  const [status, setStatus] = useState<AtendimentoStatus>("confirmado");
  const [titulo, setTitulo] = useState("");
  const [fone, setFone] = useState<string | undefined>();
  const [esp, setEsp] = useState<string | undefined>();

  useEffect(() => {
    if (!c) return;
    setTipo(c.tipo);
    setData(c.data);
    setHorario(c.horario);
    setDuracao(c.duracaoMin);
    if (c.tipo === "consulta") {
      const idx = clientesCatalogo.findIndex((cl) => cl.nome === c.paciente);
      setClienteIdx(Math.max(0, idx));
      setFone(c.telefone ??clientesCatalogo[Math.max(0, idx)]?.telefone);
      setEsp(c.especialidade ?? clientesCatalogo[Math.max(0, idx)]?.especialidade);
      setStatus(c.status ?? "confirmado");
    } else {
      setTitulo(c.titulo ?? "");
    }
  }, [c?.id]);

  if (!popupId || !c) return null;

  function selecionarCliente(idx: number) {
    setClienteIdx(idx);
    const cli = clientesCatalogo[idx];
    setFone(cli.telefone);
    setEsp(cli.especialidade);
  }

  function escolherTipo(t: "consulta" | "pessoal") {
    setTipo(t);
    if (t === "pessoal") {
      setTitulo(titulo || historicoExternos[0] || "");
    } else {
      const cli = clientesCatalogo[clienteIdx];
      setFone(cli.telefone);
      setEsp(cli.especialidade);
    }
  }

  function salvar() {
    if (tipo === "consulta") {
      const cli = clientesCatalogo[clienteIdx];
      updateCompromisso(c!.id, {
        tipo: "consulta",
        data,
        horario,
        duracaoMin: duracao,
        paciente: cli.nome,
        especialidade: cli.especialidade,
        status,
        telefone: cli.telefone,
        titulo: undefined,
      });
    } else {
      if (!titulo.trim()) return;
      updateCompromisso(c!.id, {
        tipo: "pessoal",
        data,
        horario,
        duracaoMin: duracao,
        titulo: titulo.trim(),
        paciente: undefined,
        especialidade: undefined,
        status: undefined,
        telefone: undefined,
      });
    }
    close();
  }

  function excluir() {
    removeCompromisso(c!.id);
    close();
  }

  const statusAtual = tipo === "consulta" ? status : (c.status ?? undefined);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-label="Detalhes do compromisso"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
        onClick={close}
        aria-hidden
      />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-md rounded-xl border bg-card shadow-xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 p-4 border-b">
          <div className="min-w-0 flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center justify-center size-8 rounded-lg border shrink-0",
                compromissoColor(c),
              )}
            >
              <HugeiconsIcon
                icon={c.tipo === "pessoal" ? Calendar03Icon : Clock01Icon}
                className="size-4"
              />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold leading-tight truncate">
                {c.tipo === "pessoal" ? c.titulo : c.paciente}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {prettifyDate(c.data)} · {weekdayNameShort(parseDateKey(c.data).getDay())} · {c.horario}
              </p>
            </div>
          </div>
          <button
            onClick={close}
            className="text-muted-foreground hover:text-foreground transition p-1 shrink-0"
            aria-label="Fechar"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {/* Tipo */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Tipo</span>
            <div className="grid grid-cols-2 gap-2">
              {(["consulta", "pessoal"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => escolherTipo(t)}
                  className={cn(
                    "h-9 rounded-md border text-sm font-medium transition",
                    tipo === t
                      ? "bg-primary text-primary-foreground border-transparent"
                      : "bg-background hover:bg-muted",
                  )}
                >
                  {t === "consulta" ? "Cliente (consulta)" : "Externo"}
                </button>
              ))}
            </div>
          </div>

          {/* Data + horário */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Data</span>
              <Input
                type="date"
                value={fmtDateForInput(data)}
                onChange={(e) => e.target.value && setData(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Horário</span>
              <Input type="time" value={horario} onChange={(e) => setHorario(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Duração</span>
            <select
              value={duracao}
              onChange={(e) => setDuracao(Number(e.target.value))}
              className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 outline-none dark:bg-input/30"
            >
              {duracaoOptions.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {tipo === "consulta" ? (
            <>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Cliente (base de pacientes)
                </span>
                <select
                  value={clienteIdx}
                  onChange={(e) => selecionarCliente(Number(e.target.value))}
                  className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 outline-none dark:bg-input/30"
                >
                  {clientesCatalogo.map((cl, i) => (
                    <option key={cl.nome + i} value={i}>
                      {cl.nome} — {cl.especialidade} · {cl.telefone}
                    </option>
                  ))}
                </select>
                {fone && (
                  <span className="text-[11px] text-muted-foreground">
                    Telefone: {fone} · Especialidade: {esp}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Status</span>
                <div className="flex flex-wrap gap-1.5">
                  {statusOptions.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={cn(
                        "h-8 px-2.5 rounded-md border text-xs font-medium inline-flex items-center gap-1.5 transition",
                        status === s
                          ? "border-transparent bg-primary text-primary-foreground"
                          : "hover:bg-muted",
                      )}
                    >
                      <span className={cn("size-2 rounded-full", statusMeta[s].dot)} />
                      {statusMeta[s].label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Título (histórico de compromissos)
              </span>
              <Input
                placeholder="Ex.: Reunião, Almoço, Academia..."
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                list="historico-externos"
              />
              <datalist id="historico-externos">
                {historicoExternos.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
              {historicoExternos.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {historicoExternos.slice(0, 5).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTitulo(t)}
                      className="text-[11px] rounded-full border px-2 py-0.5 hover:bg-muted transition truncate max-w-[140px]"
                      title={t}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Faixa de status (cor) */}
          {statusAtual && (
            <div
              className={cn(
                "rounded-md border px-3 py-2 text-xs flex items-center gap-1.5",
                compromissoColor({ ...c, tipo, status: statusAtual }),
              )}
            >
              <span className={cn("size-2 rounded-full", statusMeta[statusAtual]?.dot ?? "bg-slate-400")} />
              <span className="font-medium">
                {tipo === "pessoal"
                  ? "Compromisso externo"
                  : statusMeta[statusAtual]?.label}
              </span>
              <span className="text-muted-foreground ml-auto tabular-nums">
                {horario} - {horarioFim(horario, duracao)}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 p-4 border-t">
          {c.tipo === "consulta" && c.paciente && (
            <Button
              variant="outline"
              onClick={() => {
                openByConsulta(c.paciente!, c.id);
                close();
              }}
              className="gap-1.5"
            >
              <HugeiconsIcon icon={ClipboardIcon} className="size-4" />
              Ver prontuário
            </Button>
          )}
          <Button
            variant="outline"
            onClick={excluir}
            className="text-rose-600 hover:text-rose-500 hover:bg-rose-500/10"
          >
            <HugeiconsIcon icon={Delete01Icon} className="size-4" />
            Excluir
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" onClick={close}>
              Cancelar
            </Button>
            <Button
              onClick={salvar}
              className="bg-primary hover:bg-primary/90"
              disabled={tipo === "pessoal" && !titulo.trim()}
            >
              <HugeiconsIcon icon={Tick01Icon} className="size-4" />
              Salvar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Component principal
// ============================================================
export function CalendarioContent() {
  const view = useCalendarioStore((s) => s.view);

  return (
    <div className="w-full h-full flex flex-col gap-4 p-4 overflow-hidden">
      <Toolbar />
      <LegendaCores />
      <div className="flex-1 min-h-0 flex flex-col gap-2">
        {view === "mes" && <MonthGrid />}
        {view === "semana" && <WeekGrid />}
        {view === "ano" && <YearGrid />}
      </div>
      <CompromissoSheet />
      <CompromissoPopup />
    </div>
  );
}