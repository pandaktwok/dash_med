import { create } from "zustand";
import {
  compromissosIniciais,
  feriados,
  toDateKey,
  addDays,
  addMonths,
  parseDateKey,
  type Compromisso,
  type FeriadoConfig,
  type CalendarViewMode,
  PERIODO_ATENDIMENTO,
  todayKey,
} from "@/mock-data/calendario";
import type { AtendimentoStatus } from "@/mock-data/dashboard";

interface CalendarioState {
  // Navegação
  view: CalendarViewMode;
  cursor: Date; // data que referencia o mês/semana/ano atual
  // Dados
  compromissos: Compromisso[];
  feriadosConfigs: Record<string, FeriadoConfig>; // key = dataFeriado
  // UI
  sheetOpen: boolean;
  sheetPresetData: string | null;
  feriadoSheetOpen: boolean;
  feriadoSheetTarget: string | null;

  setView: (v: CalendarViewMode) => void;
  navigate: (delta: number) => void; // navega em função da view
  goToday: () => void;
  setCursorMonth: (y: number, m: number) => void;

  addCompromisso: (c: Omit<Compromisso, "id">) => void;
  removeCompromisso: (id: string) => void;
  updateStatus: (id: string, status: AtendimentoStatus) => void;
  updateCompromisso: (id: string, updates: Partial<Compromisso>) => void;

  openCompromissoSheet: (dataKey?: string | null) => void;
  closeCompromissoSheet: () => void;
  openFeriadoSheet: (dataKey: string | null) => void;
  closeFeriadoSheet: () => void;
  setFeriadoConfig: (
    dataFeriado: string,
    cfg: Partial<FeriadoConfig>,
  ) => void;

  popupCompromissoId: string | null;
  openCompromissoPopup: (id: string) => void;
  closeCompromissoPopup: () => void;
}

// ---------- Helpers ----------
function uid(prefix = "c") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// Retorna o dia útil (seg-sex) imediatamente seguinte ao dia do feriado.
// Se o feriado cai na sexta, o "próximo" dia útil é segunda. Para a regra de
// "feriado na quinta, perguntar sobre a sexta", esse método devolve sexta.
function proximoDiaUtilDepois(dia: Date): Date {
  let d = addDays(dia, 1);
  while (!PERIODO_ATENDIMENTO.diasSemana.includes(d.getDay())) {
    d = addDays(d, 1);
  }
  return d;
}

// Decide se o feriado deve "puxar" a pergunta de dia adjacente:
// somente quando o dia adjacente (próximo dia útil) está dentro do mesmo
// range seg-sex (ou seja, não cai em fim de semana).
function diaAdjacenteParaFeriado(dataFeriado: string): string | undefined {
  const dia = parseDateKey(dataFeriado);
  // Só perguntamos sobre adjacente quando o próprio feriado é um dia útil
  // (seg-sex) — feriados em fim de semana não interrompem o atendimento.
  if (!PERIODO_ATENDIMENTO.diasSemana.includes(dia.getDay())) return undefined;
  const prox = proximoDiaUtilDepois(dia);
  // Se o próximo dia útil for a "próxima segunda" (feriado cai na sexta),
  // não há adjacente dentro da semana corrente — usamos a segunda mesmo, e a
  // pergunta será feita quando a sexta for feriado.
  // A pergunta específica do enunciado é: "feriado na quinta, perguntar sobre
  // a sexta" — cobrimos ambos os casos devolvendo o próximo dia útil de seg-sex.
  return toDateKey(prox);
}

// Antecedência: a pergunta sobre feriados deve ser exibida (e respondida) com
// 2 meses de antecedência. Ou seja, enquanto o usuário está no mês M, a
// pergunta aparece para feriados em M+0...M+2. Usamos o cursor como base.
export const ANTECEDENCIA_MESES = 2;

// Inicializa configs de feriado para feriados dentro da janela atual + 2 meses.
function inicializarConfigs(compromissos: Compromisso[]) {
  void compromissos;
  const configs: Record<string, FeriadoConfig> = {};
  const base = new Date();
  for (let m = ANTECEDENCIA_MESES; m >= 0; m--) {
    const ref = addMonths(base, m);
    for (const f of feriados) {
      const d = parseDateKey(f.data);
      if (
        d.getFullYear() === ref.getFullYear() &&
        d.getMonth() === ref.getMonth()
      ) {
        const adj = diaAdjacenteParaFeriado(f.data);
        configs[f.data] = {
          dataFeriado: f.data,
          atendeDia: null,
          diaAdjacente: adj,
          atendeAdjacente: adj ? null : undefined,
        };
      }
    }
  }
  return configs;
}

// Revalida configs quando o cursor muda: garante que feriados na janela atual
// tenham entrada criada (sem sobrepor decisões já tomadas).
function ensureConfigsForCursor(
  configs: Record<string, FeriadoConfig>,
  cursor: Date,
): Record<string, FeriadoConfig> {
  const next = { ...configs };
  const ref = cursor;
  for (let m = 0; m <= ANTECEDENCIA_MESES; m++) {
    const target = addMonths(ref, m);
    for (const f of feriados) {
      const d = parseDateKey(f.data);
      if (
        d.getFullYear() === target.getFullYear() &&
        d.getMonth() === target.getMonth() &&
        !next[f.data]
      ) {
        const adj = diaAdjacenteParaFeriado(f.data);
        next[f.data] = {
          dataFeriado: f.data,
          atendeDia: null,
          diaAdjacente: adj,
          atendeAdjacente: adj ? null : undefined,
        };
      }
    }
  }
  return next;
}

export const useCalendarioStore = create<CalendarioState>((set) => ({
  view: "mes",
  cursor: new Date(),
  compromissos: [...compromissosIniciais],
  feriadosConfigs: inicializarConfigs(compromissosIniciais),

  sheetOpen: false,
  sheetPresetData: null,
  feriadoSheetOpen: false,
  feriadoSheetTarget: null,

  popupCompromissoId: null,

  setView: (v) => set({ view: v }),

  navigate: (delta) =>
    set((s) => {
      if (s.view === "mes" || s.view === "ano") {
        const d = addMonths(s.cursor, s.view === "ano" ? delta * 12 : delta);
        return {
          cursor: d,
          feriadosConfigs: ensureConfigsForCursor(s.feriadosConfigs, d),
        };
      }
      // semana
      const d = addDays(s.cursor, delta * 7);
      return { cursor: d, feriadosConfigs: ensureConfigsForCursor(s.feriadosConfigs, d) };
    }),

  goToday: () =>
    set((s) => ({
      cursor: new Date(),
      feriadosConfigs: ensureConfigsForCursor(s.feriadosConfigs, new Date()),
    })),

  setCursorMonth: (y, m) =>
    set((s) => {
      const d = new Date(s.cursor);
      d.setFullYear(y, m, 1);
      return {
        cursor: d,
        feriadosConfigs: ensureConfigsForCursor(s.feriadosConfigs, d),
      };
    }),

  addCompromisso: (c) =>
    set((s) => ({
      compromissos: [...s.compromissos, { ...c, id: uid("usr") }],
      sheetOpen: false,
    })),

  removeCompromisso: (id) =>
    set((s) => ({
      compromissos: s.compromissos.filter((c) => c.id !== id),
    })),

updateStatus: (id, status) =>
    set((s) => ({
      compromissos: s.compromissos.map((c) =>
        c.id === id && c.tipo === "consulta" ? { ...c, status } : c,
      ),
    })),

  updateCompromisso: (id, updates) =>
    set((s) => ({
      compromissos: s.compromissos.map((c) =>
        c.id === id ? { ...c, ...updates } : c,
      ),
    })),

  openCompromissoSheet: (dataKey) =>
    set({ sheetOpen: true, sheetPresetData: dataKey ?? null }),
  closeCompromissoSheet: () => set({ sheetOpen: false, sheetPresetData: null }),
  openFeriadoSheet: (dataKey) =>
    set({ feriadoSheetOpen: true, feriadoSheetTarget: dataKey }),
  closeFeriadoSheet: () => set({ feriadoSheetOpen: false, feriadoSheetTarget: null }),

  setFeriadoConfig: (dataFeriado, cfg) =>
    set((s) => {
      const prev = s.feriadosConfigs[dataFeriado] ?? {
        dataFeriado,
        atendeDia: null,
      };
      return {
        feriadosConfigs: {
          ...s.feriadosConfigs,
          [dataFeriado]: {
            ...prev,
            ...cfg,
            dataFeriado,
            decididoEm: toDateKey(new Date()),
          },
        },
      };
    }),

  openCompromissoPopup: (id) => set({ popupCompromissoId: id }),
  closeCompromissoPopup: () => set({ popupCompromissoId: null }),
}));

// Util exportado para quem consome o store fora.
export {
  proximoDiaUtilDepois,
  diaAdjacenteParaFeriado,
};

// Referência usada para evitar warning de "todayKey" unused (mantém link com mock)
void todayKey;