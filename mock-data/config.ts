// Configurações globais do dash_med — dados profissionais, modelos de
// documentos (papel timbrado), medicamentos frequentes, textos padrão de
// atestados e regras do calendário (incluindo a lógica inteligente de
// feriados com antecedência).

export interface Profissional {
  id: string;
  nome: string;
  especialidade: string;
  assistente?: string;
}

export interface LocalAtendimento {
  id: string;
  nome: string;
  endereco: string;
}

export interface ModeloDocumento {
  tipo: "atestado" | "receita";
  cabecalho: string;
  rodape: string;
  logoUrl?: string;
  // PDF em branco (papel timbrado) usado como base. Os dados variáveis do
  // atendimento são sobrescritos por cima deste template.
  pdfUrl?: string;
}

export interface MedicamentoFrequente {
  id: string;
  nome: string;
  dosagem: string;
  orientacao: string;
}

export interface TemplateAtestado {
  id: string;
  titulo: string;
  texto: string;
}

export interface RegrasCalendario {
  duracaoConsultaMin: number;
  diasSemana: number[]; // 0=Dom ... 6=Sáb
  horaInicio: number;
  horaFim: number;
  pergunteFeriados: boolean; // "Pergunte para mim"
  antecedenciaFeriadosMeses: number;
}

export interface ConfigState {
  profissionais: Profissional[];
  locais: LocalAtendimento[];
  modelos: ModeloDocumento[];
  medicamentosFrequentes: MedicamentoFrequente[];
  templatesAtestado: TemplateAtestado[];
  regras: RegrasCalendario;
}

function uid(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export const configInicial: ConfigState = {
  profissionais: [
    {
      id: uid("med"),
      nome: "Dr. Leonardo N.",
      especialidade: "Clínico Geral",
      assistente: "Ana (Recepção)",
    },
  ],
  locais: [
    {
      id: uid("loc"),
      nome: "Consultório Principal",
      endereco: "Av. Paulista, 1000 — Sala 1010, São Paulo/SP",
    },
  ],
  modelos: [
    {
      tipo: "atestado",
      cabecalho:
        "Dr. Leonardo N. — Clínico Geral | CRM 00000\nAv. Paulista, 1000 — São Paulo/SP",
      rodape: "Documento gerado eletronicamente via dash_med.",
      logoUrl: "/ln.png",
      pdfUrl: "/atestado_em_branco_timbrado.pdf",
    },
    {
      tipo: "receita",
      cabecalho:
        "Dr. Leonardo N. — Clínico Geral | CRM 00000\nAv. Paulista, 1000 — São Paulo/SP",
      rodape: "Receita gerada eletronicamente via dash_med.",
      logoUrl: "/ln.png",
      pdfUrl: "/receituaio_em_branco_timbrado.pdf",
    },
  ],
  medicamentosFrequentes: [
    { id: uid("med"), nome: "Paracetamol", dosagem: "750mg", orientacao: "1cp a cada 6h se dor/febre" },
    { id: uid("med"), nome: "Losartana", dosagem: "50mg", orientacao: "1cp pela manhã" },
    { id: uid("med"), nome: "Amoxicilina", dosagem: "500mg", orientacao: "1cp de 8/8h por 7 dias" },
    { id: uid("med"), nome: "Ibuprofeno", dosagem: "600mg", orientacao: "1cp de 8/8h após refeição" },
    { id: uid("med"), nome: "Omeprazol", dosagem: "20mg", orientacao: "1cp em jejum 30min antes do café" },
  ],
  templatesAtestado: [
    {
      id: uid("tpl"),
      titulo: "Afastamento padrão",
      texto:
        "Declaro para os devidos fins que o paciente acima identificado esteve sob meus cuidados médicos, necessitando de afastamento de suas atividades pelo período indicado.",
    },
    {
      id: uid("tpl"),
      titulo: "Acompanhante",
      texto:
        "Declaro para os devidos fins que o paciente acima identificado necessita de acompanhante durante o período de tratamento.",
    },
  ],
  regras: {
    duracaoConsultaMin: 30,
    diasSemana: [1, 2, 3, 4, 5],
    horaInicio: 8,
    horaFim: 18,
    pergunteFeriados: true,
    antecedenciaFeriadosMeses: 2,
  },
};

export { uid };
