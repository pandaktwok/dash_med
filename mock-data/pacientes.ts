// Camada de dados do Prontuário Médico Eletrônico.
//
// Fluxo de atendimento:
//   Primeiro Atendimento → Retorno → Segundo Atendimento → Retorno → ...
//
// Cada "Atendimento" é um episódio/motivo novo (numerado sequencialmente:
// Primeiro, Segundo, Terceiro...). Cada "Retorno" é o acompanhamento do
// último atendimento. O médico decide se a próxima consulta é um Retorno
// (mesmo motivo) ou um novo Atendimento (motivo diferente).

import { clientesCatalogo, toDateKey, addDays, parseDateKey } from "./calendario";
import { atendimentosPorDia } from "./dashboard";

export type ProntuarioStatus = "aguardando" | "em_atendimento" | "atendido";

// Categoria da consulta no fluxo de atendimento.
export type CategoriaConsulta = "atendimento" | "retorno";

// Rótulo legível do tipo de consulta, derivado de categoria + número.
export type TipoConsulta = string;

// Converte ordinal (1, 2, 3...) em rótulo por extenso.
const ordinais = [
  "", "Primeiro", "Segundo", "Terceiro", "Quarto", "Quinto",
  "Sexto", "Sétimo", "Oitavo", "Nono", "Décimo",
];

export function labelTipo(categoria: CategoriaConsulta, numeroAtendimento: number): TipoConsulta {
  if (categoria === "retorno") return "Retorno";
  const ord = ordinais[numeroAtendimento] ?? `${numeroAtendimento}º`;
  return `${ord} Atendimento`;
}

// Calcula qual deve ser a próxima consulta no fluxo:
//  - Sem histórico → Primeiro Atendimento
//  - Última foi "atendimento" → Retorno (acompanhamento desse atendimento)
//  - Última foi "retorno" → próximo Atendimento (novo motivo), incrementa número
export function proximaCategoria(consultas: ConsultaProntuario[]): {
  categoria: CategoriaConsulta;
  numeroAtendimento: number;
} {
  if (consultas.length === 0) {
    return { categoria: "atendimento", numeroAtendimento: 1 };
  }
  const ordenadas = [...consultas].sort(
    (a, b) => a.data.localeCompare(b.data) || a.horario.localeCompare(b.horario),
  );
  const ultima = ordenadas[ordenadas.length - 1];
  if (ultima.categoria === "atendimento") {
    return { categoria: "retorno", numeroAtendimento: ultima.numeroAtendimento };
  }
  // última foi retorno → próximo é novo atendimento
  const maxNum = ordenadas.reduce(
    (max, c) => (c.categoria === "atendimento" ? Math.max(max, c.numeroAtendimento) : max),
    0,
  );
  return { categoria: "atendimento", numeroAtendimento: maxNum + 1 };
}

export interface MedicamentoPrescrito {
  nome: string;
  dosagem: string;
  orientacao: string;
  data: string; // YYYY-MM-DD da consulta que o prescreveu
}

export interface DocumentoRef {
  id: string;
  tipo: "atestado" | "receita";
  // Link/referência do PDF gerado. Uma automação n8n/WhatsApp usa este campo
  // para recuperar o arquivo sem intervenção do médico.
  url: string;
  geradoEm: string; // ISO
  conteudo: string; // texto principal usado no documento
  diasAfastamento?: number; // somente atestado
}

export interface ConsultaProntuario {
  id: string; // vinculado ao Compromisso.id quando aplicável
  data: string; // YYYY-MM-DD
  horario: string; // HH:mm
  categoria: CategoriaConsulta;
  numeroAtendimento: number; // nº do atendimento (1=Primeiro, 2=Segundo...)
  tipo: TipoConsulta; // rótulo derivado: "Primeiro Atendimento", "Retorno"...
  especialidade: string;
  status: ProntuarioStatus;
  evolucao: string;
  orientacoes: string;
  medicamentos: { nome: string; dosagem: string; orientacao: string }[];
  documentos: DocumentoRef[];
}

export interface Paciente {
  id: string;
  nome: string;
  telefone: string;
  especialidade: string;
  nascimento?: string;
  // Histórico acumulado de TODOS os medicamentos já prescritos na vida do
  // paciente (consolidado a cada atendimento).
  historicoMedicamentos: MedicamentoPrescrito[];
  // Campo consolidado com as principais orientações médicas já fornecidas.
  orientacoesConsolidadas: string;
  consultas: ConsultaProntuario[];
}

function uid(prefix = "doc") {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

// Deriva um conjunto inicial de pacientes a partir do catálogo de clientes e
// dos atendimentos mockados, enriquecendo com histórico demonstrativo que
// respeita o fluxo: Primeiro Atendimento → Retorno → Segundo Atendimento...
function buildPacientesIniciais(): Paciente[] {
  const hoje = new Date();
  const baseConsultas = new Map<
    string,
    { data: string; horario: string; especialidade: string; status: string }[]
  >();

  // `atendimentosPorDia` traz 3 dias consecutivos (hoje, hoje+1, hoje+2), então
  // o índice do dia é o offset. Antes usava `addDays(hoje, 0)` para todos, o que
  // achatava os 3 dias em um só.
  atendimentosPorDia.forEach((dia, diaIdx) => {
    for (const a of dia.itens) {
      if (!baseConsultas.has(a.paciente)) baseConsultas.set(a.paciente, []);
      baseConsultas.get(a.paciente)!.push({
        data: toDateKey(addDays(hoje, diaIdx)),
        horario: a.horario,
        especialidade: a.tipo,
        status: a.status,
      });
    }
  });

  const lista: Paciente[] = clientesCatalogo.map((cli, i) => {
    const consultasBase = baseConsultas.get(cli.nome) ?? [];

    // Histórico demonstrativo respeitando o fluxo:
    //   1. Primeiro Atendimento (45 dias atrás)
    //   2. Retorno do Primeiro (16 dias atrás)
    //   3. Segundo Atendimento (hoje, novo motivo) — aguardando
    const c1Data = toDateKey(addDays(hoje, -45));
    const c2Data = toDateKey(addDays(hoje, -16));
    const consultas: ConsultaProntuario[] = [
      {
        id: `seed-${cli.nome}-2`,
        data: c1Data,
        horario: "09:30",
        categoria: "atendimento",
        numeroAtendimento: 1,
        tipo: labelTipo("atendimento", 1),
        especialidade: cli.especialidade,
        status: "atendido",
        evolucao:
          "Primeiro atendimento. Paciente relata quadro de início insidioso. Exame físico sem alterações relevantes. Solicitados exames complementares.",
        orientacoes:
          "Repouso relativo, hidratação oral e retorno caso sintomas persistam por mais de 72h.",
        medicamentos: [
          {
            nome: "Paracetamol",
            dosagem: "750mg",
            orientacao: "1 comprimido a cada 6h se dor/febre",
          },
        ],
        documentos: [
          {
            id: uid(),
            tipo: "atestado",
            url: `https://docs.n8n.whatsapp/atestado/${cli.nome.replace(/\s/g, "")}-${c1Data}.pdf`,
            geradoEm: new Date(parseDateKey(c1Data).getTime() + 9.5 * 3600_000).toISOString(),
            conteudo:
              "Declaro para os devidos fins que o paciente acima identificado esteve sob meus cuidados médicos na data indicada, necessitando de repouso.",
            diasAfastamento: 2,
          },
        ],
      },
      {
        id: `seed-${cli.nome}-1`,
        data: c2Data,
        horario: "10:00",
        categoria: "retorno",
        numeroAtendimento: 1,
        tipo: labelTipo("retorno", 1),
        especialidade: cli.especialidade,
        status: "atendido",
        evolucao:
          "Retorno do Primeiro Atendimento com melhora parcial do quadro. Ajuste de conduta e nova prescrição. Paciente orientado quanto a sinais de alarme.",
        orientacoes:
          "Manter conduta anterior, suspender medicação se houver melhora completa e retornar em 30 dias para reavaliação.",
        medicamentos: [
          {
            nome: "Losartana",
            dosagem: "50mg",
            orientacao: "1 comprimido pela manhã",
          },
          {
            nome: "Paracetamol",
            dosagem: "750mg",
            orientacao: "Se necessário, a cada 6h",
          },
        ],
        documentos: [
          {
            id: uid(),
            tipo: "receita",
            url: `https://docs.n8n.whatsapp/receita/${cli.nome.replace(/\s/g, "")}-${c2Data}.pdf`,
            geradoEm: new Date(parseDateKey(c2Data).getTime() + 10 * 3600_000).toISOString(),
            conteudo: "Losartana 50mg - 1 cp manhã / Paracetamol 750mg - se dor.",
          },
        ],
      },
    ];

    // Consulta de hoje: Segundo Atendimento (novo motivo), aguardando.
    if (consultasBase.length > 0) {
      const c0 = consultasBase[0];
      const statusProntuario: ProntuarioStatus =
        c0.status === "realizado"
          ? "atendido"
          : c0.status === "cancelado"
            ? "atendido"
            : "aguardando";
      consultas.unshift({
        id: `seed-${cli.nome}-0`,
        data: c0.data,
        horario: c0.horario,
        categoria: "atendimento",
        numeroAtendimento: 2,
        tipo: labelTipo("atendimento", 2),
        especialidade: c0.especialidade,
        status: statusProntuario,
        evolucao: "",
        orientacoes: "",
        medicamentos: [],
        documentos: [],
      });
    }

    const historicoMedicamentos: MedicamentoPrescrito[] = [];
    for (const c of consultas) {
      for (const m of c.medicamentos) {
        historicoMedicamentos.push({ ...m, data: c.data });
      }
    }

    return {
      id: `pac-${i + 1}`,
      nome: cli.nome,
      telefone: cli.telefone,
      especialidade: cli.especialidade,
      nascimento: `19${70 + (i % 20)}-0${(i % 9) + 1}-1${i % 9}`,
      historicoMedicamentos,
      orientacoesConsolidadas:
        "Hidratação oral, repouso nos quadros agudos e retorno em caso de persistência dos sintomas. Manter acompanhamento periódico.",
      consultas,
    };
  });

  return lista;
}

export const pacientesIniciais: Paciente[] = buildPacientesIniciais();
