import { create } from "zustand";
import {
  pacientesIniciais,
  type Paciente,
  type ConsultaProntuario,
  type DocumentoRef,
  type ProntuarioStatus,
  type TipoConsulta,
  type CategoriaConsulta,
  proximaCategoria,
  labelTipo,
} from "@/mock-data/pacientes";
import { uid } from "@/mock-data/config";

interface ProntuarioState {
  open: boolean;
  pacienteId: string | null;
  activeConsultaId: string | null; // aba de consulta ativa
  // Drawer de geração de documentos
  drawerOpen: boolean;
  drawerTipo: "atestado" | "receita" | null;

  pacientes: Paciente[];

  // Abertura a partir dos 3 gatilhos (Painel Hoje, Lista Atendimento, Calendário)
  openByPaciente: (pacienteId: string, consultaId?: string) => void;
  openByConsulta: (pacienteNome: string, consultaId?: string) => void;
  close: () => void;

  setActiveConsulta: (consultaId: string) => void;

  // Atualizações dentro do prontuário
  updateConsulta: (
    pacienteId: string,
    consultaId: string,
    patch: Partial<ConsultaProntuario>,
  ) => void;
  setConsultaStatus: (
    pacienteId: string,
    consultaId: string,
    status: ProntuarioStatus,
  ) => void;
  addConsulta: (
    pacienteId: string,
    consulta: Omit<ConsultaProntuario, "id">,
  ) => void;
  // Adiciona a próxima consulta respeitando o fluxo:
  //   atendimento → retorno → (próximo) atendimento → retorno → ...
  // O médico pode forçar a categoria (ex.: novo motivo = "atendimento").
  addConsultaFluxo: (
    pacienteId: string,
    categoria: CategoriaConsulta,
    dados: { data: string; horario: string; especialidade: string },
  ) => string;
  upsertOrientacoesConsolidadas: (pacienteId: string, texto: string) => void;

  // Documentos (automação WhatsApp)
  addDocumento: (
    pacienteId: string,
    consultaId: string,
    doc: Omit<DocumentoRef, "id">,
  ) => DocumentoRef;

  // Drawer
  openDrawer: (tipo: "atestado" | "receita") => void;
  closeDrawer: () => void;
}

function findPaciente(lista: Paciente[], id: string | null) {
  return lista.find((p) => p.id === id) ?? null;
}

function findByName(lista: Paciente[], nome: string) {
  return (
    lista.find((p) => p.nome === nome) ??
    lista.find((p) => p.nome.toLowerCase() === nome.toLowerCase()) ??
    null
  );
}

export const useProntuarioStore = create<ProntuarioState>((set, get) => ({
  open: false,
  pacienteId: null,
  activeConsultaId: null,
  drawerOpen: false,
  drawerTipo: null,
  pacientes: pacientesIniciais,

  openByPaciente: (pacienteId, consultaId) =>
    set((s) => {
      const p = findPaciente(s.pacientes, pacienteId);
      if (!p) return {};
      const active =
        consultaId ??
        p.consultas[0]?.id ??
        null;
      return { open: true, pacienteId, activeConsultaId: active };
    }),

  openByConsulta: (pacienteNome, consultaId) =>
    set((s) => {
      const p = findByName(s.pacientes, pacienteNome);
      if (!p) return { open: true, pacienteId: null, activeConsultaId: null };
      // O `consultaId ??` que vinha antes do find tornava o find inalcançável:
      // um id válido era aceito sem checagem e um id inexistente também. Agora o
      // find valida, e só cai na primeira consulta se o id não existir.
      const active =
        p.consultas.find((c) => c.id === consultaId)?.id ??
        p.consultas[0]?.id ??
        null;
      return { open: true, pacienteId: p.id, activeConsultaId: active };
    }),

  close: () =>
    set({ open: false, drawerOpen: false, drawerTipo: null }),

  setActiveConsulta: (consultaId) => set({ activeConsultaId: consultaId }),

  updateConsulta: (pacienteId, consultaId, patch) =>
    set((s) => ({
      pacientes: s.pacientes.map((p) =>
        p.id !== pacienteId
          ? p
          : {
              ...p,
              consultas: p.consultas.map((c) =>
                c.id === consultaId ? { ...c, ...patch } : c,
              ),
            },
      ),
    })),

  setConsultaStatus: (pacienteId, consultaId, status) =>
    set((s) => ({
      pacientes: s.pacientes.map((p) =>
        p.id !== pacienteId
          ? p
          : {
              ...p,
              consultas: p.consultas.map((c) =>
                c.id === consultaId ? { ...c, status } : c,
              ),
            },
      ),
    })),

  addConsulta: (pacienteId, consulta) =>
    set((s) => ({
      pacientes: s.pacientes.map((p) =>
        p.id !== pacienteId
          ? p
          : {
              ...p,
              consultas: [
                ...p.consultas,
                { ...consulta, id: uid("cons") },
              ],
            },
      ),
    })),

  addConsultaFluxo: (pacienteId, categoria, dados) => {
    const state = get();
    const paciente = findPaciente(state.pacientes, pacienteId);
    if (!paciente) return "";
    // Se o médico escolheu "atendimento" manualmente, usa o próximo número.
    // Se escolheu "retorno", acompanha o último atendimento.
    const ord = [...paciente.consultas].sort(
      (a, b) => a.data.localeCompare(b.data) || a.horario.localeCompare(b.horario),
    );
    const ultimoAtendimento = [...ord]
      .reverse()
      .find((c) => c.categoria === "atendimento");
    let numeroAtendimento: number;
    if (categoria === "atendimento") {
      numeroAtendimento = (ultimoAtendimento?.numeroAtendimento ?? 0) + 1;
    } else {
      numeroAtendimento = ultimoAtendimento?.numeroAtendimento ?? 1;
    }
    const novaId = uid("cons");
    const novaConsulta: ConsultaProntuario = {
      id: novaId,
      data: dados.data,
      horario: dados.horario,
      categoria,
      numeroAtendimento,
      tipo: labelTipo(categoria, numeroAtendimento),
      especialidade: dados.especialidade,
      status: "aguardando",
      evolucao: "",
      orientacoes: "",
      medicamentos: [],
      documentos: [],
    };
    set((s) => ({
      pacientes: s.pacientes.map((p) =>
        p.id !== pacienteId
          ? p
          : { ...p, consultas: [...p.consultas, novaConsulta] },
      ),
      activeConsultaId: novaId,
    }));
    return novaId;
  },

  upsertOrientacoesConsolidadas: (pacienteId, texto) =>
    set((s) => ({
      pacientes: s.pacientes.map((p) =>
        p.id === pacienteId ? { ...p, orientacoesConsolidadas: texto } : p,
      ),
    })),

  addDocumento: (pacienteId, consultaId, doc) => {
    const novo: DocumentoRef = { ...doc, id: uid("doc") };
    set((s) => ({
      pacientes: s.pacientes.map((p) =>
        p.id !== pacienteId
          ? p
          : {
              ...p,
              consultas: p.consultas.map((c) =>
                c.id === consultaId
                  ? { ...c, documentos: [...c.documentos, novo] }
                  : c,
              ),
            },
      ),
    }));
    return novo;
  },

  openDrawer: (tipo) => set({ drawerOpen: true, drawerTipo: tipo }),
  closeDrawer: () => set({ drawerOpen: false, drawerTipo: null }),
}));

// Helpers externos
export type { TipoConsulta, CategoriaConsulta };
export { proximaCategoria, labelTipo };
