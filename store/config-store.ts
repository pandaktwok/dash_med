import { create } from "zustand";
import {
  configInicial,
  uid,
  type ConfigState,
  type Profissional,
  type LocalAtendimento,
  type MedicamentoFrequente,
  type ModeloDocumento,
  type TemplateAtestado,
  type RegrasCalendario,
} from "@/mock-data/config";

interface ConfigStore extends ConfigState {
  // Profissionais / locais
  addProfissional: () => void;
  updateProfissional: (id: string, patch: Partial<Profissional>) => void;
  removeProfissional: (id: string) => void;

  addLocal: () => void;
  updateLocal: (id: string, patch: Partial<LocalAtendimento>) => void;
  removeLocal: (id: string) => void;

  // Modelos
  updateModelo: (tipo: "atestado" | "receita", patch: Partial<ModeloDocumento>) => void;

  // Medicamentos frequentes
  addMedicamento: () => void;
  updateMedicamento: (id: string, patch: Partial<MedicamentoFrequente>) => void;
  removeMedicamento: (id: string) => void;

  // Templates de atestado
  addTemplate: () => void;
  updateTemplate: (id: string, patch: Partial<TemplateAtestado>) => void;
  removeTemplate: (id: string) => void;

  // Regras
  updateRegras: (patch: Partial<RegrasCalendario>) => void;
  toggleDiaSemana: (dia: number) => void;
}

export const useConfigStore = create<ConfigStore>((set) => ({
  ...configInicial,

  addProfissional: () =>
    set((s) => ({
      profissionais: [
        ...s.profissionais,
        { id: uid("med"), nome: "", especialidade: "", assistente: "" },
      ],
    })),
  updateProfissional: (id, patch) =>
    set((s) => ({
      profissionais: s.profissionais.map((p) =>
        p.id === id ? { ...p, ...patch } : p,
      ),
    })),
  removeProfissional: (id) =>
    set((s) => ({
      profissionais: s.profissionais.filter((p) => p.id !== id),
    })),

  addLocal: () =>
    set((s) => ({
      locais: [...s.locais, { id: uid("loc"), nome: "", endereco: "" }],
    })),
  updateLocal: (id, patch) =>
    set((s) => ({
      locais: s.locais.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    })),
  removeLocal: (id) =>
    set((s) => ({ locais: s.locais.filter((l) => l.id !== id) })),

  updateModelo: (tipo, patch) =>
    set((s) => ({
      modelos: s.modelos.map((m) => (m.tipo === tipo ? { ...m, ...patch } : m)),
    })),

  addMedicamento: () =>
    set((s) => ({
      medicamentosFrequentes: [
        ...s.medicamentosFrequentes,
        { id: uid("med"), nome: "", dosagem: "", orientacao: "" },
      ],
    })),
  updateMedicamento: (id, patch) =>
    set((s) => ({
      medicamentosFrequentes: s.medicamentosFrequentes.map((m) =>
        m.id === id ? { ...m, ...patch } : m,
      ),
    })),
  removeMedicamento: (id) =>
    set((s) => ({
      medicamentosFrequentes: s.medicamentosFrequentes.filter((m) => m.id !== id),
    })),

  addTemplate: () =>
    set((s) => ({
      templatesAtestado: [
        ...s.templatesAtestado,
        { id: uid("tpl"), titulo: "", texto: "" },
      ],
    })),
  updateTemplate: (id, patch) =>
    set((s) => ({
      templatesAtestado: s.templatesAtestado.map((t) =>
        t.id === id ? { ...t, ...patch } : t,
      ),
    })),
  removeTemplate: (id) =>
    set((s) => ({
      templatesAtestado: s.templatesAtestado.filter((t) => t.id !== id),
    })),

  updateRegras: (patch) =>
    set((s) => ({ regras: { ...s.regras, ...patch } })),
  toggleDiaSemana: (dia) =>
    set((s) => ({
      regras: {
        ...s.regras,
        diasSemana: s.regras.diasSemana.includes(dia)
          ? s.regras.diasSemana.filter((d) => d !== dia)
          : [...s.regras.diasSemana, dia].sort(),
      },
    })),
}));
