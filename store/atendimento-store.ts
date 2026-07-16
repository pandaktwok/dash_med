import { create } from "zustand";

// Controlador de tempo do Painel Geral (Hoje).
//
// - `atendendoId` é o ID da consulta/paciente em atendimento ativo.
// - `iniciadoEm` marca o início do atendimento para cálculo de duração.
// - `finalizados` registra os IDs já concluídos (status "Atendido").
//
// Os alertas de tempo (tarjas amarela/vermelha/verde) são derivados em
// componentes a partir de `now` (atualizado por useAgora) comparado com os
// horários das próximas consultas.

interface AtendimentoState {
  atendendoId: string | null;
  iniciadoEm: number | null;
  finalizados: Record<string, true>;
  alertaHorarioId: string | null; // popup "está na hora"
  alertaHorarioDismiss: string | null;

  iniciarAtendimento: (id: string) => void;
  finalizarAtendimento: (id: string) => void;
  dismissAlertaHorario: (id: string) => void;
  reset: () => void;
}

export const useAtendimentoStore = create<AtendimentoState>((set) => ({
  atendendoId: null,
  iniciadoEm: null,
  finalizados: {},
  alertaHorarioId: null,
  alertaHorarioDismiss: null,

  iniciarAtendimento: (id) =>
    set({
      atendendoId: id,
      iniciadoEm: Date.now(),
      alertaHorarioDismiss: id,
    }),

  finalizarAtendimento: (id) =>
    set((s) => ({
      atendendoId: s.atendendoId === id ? null : s.atendendoId,
      iniciadoEm: s.atendendoId === id ? null : s.iniciadoEm,
      finalizados: { ...s.finalizados, [id]: true },
    })),

  dismissAlertaHorario: (id) => set({ alertaHorarioDismiss: id }),

  reset: () =>
    set({
      atendendoId: null,
      iniciadoEm: null,
      finalizados: {},
      alertaHorarioId: null,
      alertaHorarioDismiss: null,
    }),
}));
