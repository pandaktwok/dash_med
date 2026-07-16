// Calendário mock data.
// Reaproveita os pacientes/tipos existentes em dashboard.ts para compor os
// compromissos iniciais, e mantém uma lista de feriados nacionais brasileiros.

import { atendimentosPorDia, type AtendimentoStatus } from "./dashboard";

export type CalendarViewMode = "mes" | "semana" | "ano";

export interface Compromisso {
  id: string;
  data: string; // YYYY-MM-DD
  horario: string; // HH:mm
  duracaoMin: number;
  tipo: "consulta" | "pessoal";
  // Tipo consulta (cliente)
  paciente?: string;
  especialidade?: string;
  status?: AtendimentoStatus;
  telefone?: string;
  observacao?: string;
  // Tipo pessoal
  titulo?: string;
}

export interface Feriado {
  data: string; // YYYY-MM-DD
  nome: string;
  tipo: "nacional" | "estadual" | "municipal";
}

export interface FeriadoConfig {
  dataFeriado: string; // YYYY-MM-DD
  atendeDia: boolean | null; // null = ainda não decidido
  // Para a regra de dia adjacente (feriado na quinta -> sexta, etc.)
  diaAdjacente?: string; // YYYY-MM-DD
  atendeAdjacente?: boolean | null;
  decididoEm?: string; // YYYY-MM-DD
}

// ---------- Helpers ----------
function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export const WEEKDAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// Período de atendimento padrão: segunda a sexta, 08h–18h
export const PERIODO_ATENDIMENTO = {
  diasSemana: [1, 2, 3, 4, 5], // 0=Dom ... 6=Sáb
  horaInicio: 8,
  horaFim: 18,
};

// ---------- Catálogo de clientes (reaproveitado do dashboard) ----------
export interface ClienteCatalogo {
  nome: string;
  especialidade: string;
  telefone: string;
}

export const clientesCatalogo: ClienteCatalogo[] = (() => {
  const map = new Map<string, ClienteCatalogo>();
  for (const dia of atendimentosPorDia) {
    for (const a of dia.itens) {
      if (!map.has(a.paciente)) {
        // Telefone derivado do índice, não de Math.random(): em module scope o
        // random gerava um número novo a cada reload e divergiria entre server e
        // client se o módulo fosse avaliado nos dois.
        map.set(a.paciente, {
          nome: a.paciente,
          especialidade: a.tipo,
          telefone: `+55 11 9${87654321 + map.size * 1234}`,
        });
      }
    }
  }
  return Array.from(map.values());
})();

// ---------- Feriados ----------
// Feriados nacionais brasileiros fixos + movíveis de 2026 e 2027.
export const feriados: Feriado[] = [
  { data: "2026-01-01", nome: "Confraternização Universal", tipo: "nacional" },
  { data: "2026-02-17", nome: "Carnaval (terça)", tipo: "nacional" },
  { data: "2026-04-03", nome: "Sexta-feira Santa", tipo: "nacional" },
  { data: "2026-04-21", nome: "Tiradentes", tipo: "nacional" },
  { data: "2026-05-01", nome: "Dia do Trabalho", tipo: "nacional" },
  { data: "2026-06-04", nome: "Corpus Christi", tipo: "nacional" },
  { data: "2026-09-07", nome: "Independência do Brasil", tipo: "nacional" },
  { data: "2026-10-12", nome: "Nossa Senhora Aparecida", tipo: "nacional" },
  { data: "2026-11-02", nome: "Finados", tipo: "nacional" },
  { data: "2026-11-15", nome: "Proclamação da República", tipo: "nacional" },
  { data: "2026-12-25", nome: "Natal", tipo: "nacional" },

  { data: "2027-01-01", nome: "Confraternização Universal", tipo: "nacional" },
  { data: "2027-02-09", nome: "Carnaval (terça)", tipo: "nacional" },
  { data: "2027-03-26", nome: "Sexta-feira Santa", tipo: "nacional" },
  { data: "2027-04-21", nome: "Tiradentes", tipo: "nacional" },
  { data: "2027-05-01", nome: "Dia do Trabalho", tipo: "nacional" },
  { data: "2027-06-03", nome: "Corpus Christi", tipo: "nacional" },
  { data: "2027-09-07", nome: "Independência do Brasil", tipo: "nacional" },
  { data: "2027-10-12", nome: "Nossa Senhora Aparecida", tipo: "nacional" },
  { data: "2027-11-02", nome: "Finados", tipo: "nacional" },
  { data: "2027-11-15", nome: "Proclamação da República", tipo: "nacional" },
  { data: "2027-12-25", nome: "Natal", tipo: "nacional" },
];

// ---------- Compromissos iniciais ----------
const today = new Date();
const todayKey = toDateKey(today);

let seedId = 0;
function mkC(
  offset: number,
  horario: string,
  paciente: string,
  especialidade: string,
  status: AtendimentoStatus,
  duracaoMin = 30,
): Compromisso {
  seedId += 1;
  return {
    id: `seed-${seedId}`,
    data: toDateKey(addDays(today, offset)),
    horario,
    duracaoMin,
    tipo: "consulta",
    paciente,
    especialidade,
    status,
    telefone: clientesCatalogo.find((c) => c.nome === paciente)?.telefone,
  };
}

function mkP(
  offset: number,
  horario: string,
  titulo: string,
  duracaoMin = 60,
): Compromisso {
  seedId += 1;
  return {
    id: `seed-${seedId}`,
    data: toDateKey(addDays(today, offset)),
    horario,
    duracaoMin,
    tipo: "pessoal",
    titulo,
  };
}

// Distribui alguns atendimentos (reaproveitando os pacientes do dashboard) ao
// redor da semana atual, e alguns compromissos pessoais.
export const compromissosIniciais: Compromisso[] = [
  mkC(0, "09:00", "Maria S.", "Cardiologia", "realizado"),
  mkC(0, "10:30", "João P.", "Clínico Geral", "realizado"),
  mkC(0, "14:00", "Ana L.", "Pediatria", "confirmado"),
  mkC(0, "16:00", "Carlos M.", "Telemedicina", "confirmado"),
  mkP(0, "11:30", "Reunião equipe médica", 45),

  mkC(1, "08:30", "Rosa F.", "Ginecologia", "confirmado"),
  mkC(1, "11:00", "Pedro G.", "Ortopedia", "pendente"),
  mkC(1, "15:30", "Lia R.", "Dermatologia", "confirmado"),
  mkC(1, "16:30", "Beatriz T.", "Vascular", "retorno"),

  mkC(2, "09:15", "Bruno C.", "Cardiologia", "confirmado"),
  mkC(2, "13:00", "Sofia A.", "Pediatria", "cancelado"),
  mkP(2, "17:00", "Consulta particular extra", 30),

  mkC(3, "10:00", "Maria S.", "Cardiologia", "confirmado"),
  mkC(4, "14:30", "Pedro G.", "Ortopedia", "pendente"),
  mkC(5, "09:00", "Ana L.", "Pediatria", "confirmado"),

  mkP(-2, "18:30", "Academia", 60),
  mkP(7, "12:00", "Almoço com fornecedor", 90),
];

// Conveniência: lista de horários válidos no período de atendimento (08-18,
// slots de 30 em 30 min).
export const slotsHorario: string[] = (() => {
  const slots: string[] = [];
  for (let h = PERIODO_ATENDIMENTO.horaInicio; h < PERIODO_ATENDIMENTO.horaFim; h++) {
    slots.push(`${pad(h)}:00`);
    slots.push(`${pad(h)}:30`);
  }
  return slots;
})();

export { todayKey };