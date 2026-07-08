export const dashboardStats = {
  consultasHoje: { value: 8, change: 2 },
  consultasMes: { value: 142, change: 18 },
  atendimentoWhats: { value: 67, change: 9 },
  proximoMes: { value: 53, change: 5 },
};

export const performanceScore = 86;
export const performanceChange = 15;

export const performanceChartData = [
  { day: "Seg", atual: 12, anterior: 9 },
  { day: "Ter", atual: 15, anterior: 11 },
  { day: "Qua", atual: 9, anterior: 14 },
  { day: "Qui", atual: 18, anterior: 10 },
  { day: "Sex", atual: 14, anterior: 12 },
  { day: "Sáb", atual: 6, anterior: 8 },
];

export interface TodayItem {
  id: string;
  name: string;
  time: string;
  type: "consulta" | "calendario";
  patient?: string;
}

export const todayTasks: TodayItem[] = [
  { id: "1", name: "Consulta - Cardiologia", time: "09:00", type: "consulta", patient: "Maria S." },
  { id: "2", name: "Retorno - Clínico Geral", time: "10:30", type: "consulta", patient: "João P." },
  { id: "3", name: "Reunião equipe médica", time: "11:30", type: "calendario" },
  { id: "4", name: "Consulta - Pediatria", time: "14:00", type: "consulta", patient: "Ana L." },
  { id: "5", name: "Telemedicina", time: "16:00", type: "consulta", patient: "Carlos M." },
];

export interface Atendimento {
  id: string;
  paciente: string;
  horario: string;
  tipo: string;
  status: AtendimentoStatus;
}

export type AtendimentoStatus =
  | "confirmado"
  | "realizado"
  | "cancelado"
  | "pendente"
  | "retorno";

export interface AtendimentoDia {
  dia: string;
  itens: Atendimento[];
}

export const atendimentosPorDia: AtendimentoDia[] = [
  {
    dia: "Hoje - 02 Jul",
    itens: [
      { id: "a1", paciente: "Maria S.", horario: "09:00", tipo: "Cardiologia", status: "realizado" },
      { id: "a2", paciente: "João P.", horario: "10:30", tipo: "Clínico Geral", status: "realizado" },
      { id: "a3", paciente: "Ana L.", horario: "14:00", tipo: "Pediatria", status: "confirmado" },
      { id: "a4", paciente: "Carlos M.", horario: "16:00", tipo: "Telemedicina", status: "confirmado" },
    ],
  },
  {
    dia: "03 Jul",
    itens: [
      { id: "a5", paciente: "Rosa F.", horario: "08:30", tipo: "Ginecologia", status: "confirmado" },
      { id: "a6", paciente: "Pedro G.", horario: "11:00", tipo: "Ortopedia", status: "pendente" },
      { id: "a7", paciente: "Lia R.", horario: "15:30", tipo: "Dermatologia", status: "confirmado" },
      { id: "a10", paciente: "Beatriz T.", horario: "16:30", tipo: "Vascular", status: "retorno" },
    ],
  },
  {
    dia: "04 Jul",
    itens: [
      { id: "a8", paciente: "Bruno C.", horario: "09:15", tipo: "Cardiologia", status: "confirmado" },
      { id: "a9", paciente: "Sofia A.", horario: "13:00", tipo: "Pediatria", status: "cancelado" },
    ],
  },
];

export const welcomeSummary = {
  userName: "LN",
  tasksDueToday: 4,
  overdueTasks: 2,
  upcomingDeadlines: 8,
};

export const lastUpdated = "02 Jul 2026";
