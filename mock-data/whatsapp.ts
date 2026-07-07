export type InicialSubStep = "iniciado" | "aguardando_dados" | "fisgado";
export type ReengajamentoStatus = "agendado" | "disparado" | "nenhum";
export type PosTipo = "finalizado" | "retorno" | "secretaria_documentos";

export interface InicialCard {
  id: string;
  cliente: string;
  telefone: string;
  ultimaMensagem: string;
  hora: string;
  subStep: InicialSubStep;
  iaPausada: boolean;
}

export interface AgendamentoCard {
  id: string;
  cliente: string;
  telefone: string;
  ultimaMensagem: string;
  hora: string;
  dataSugerida: string;
  confirmado: boolean;
}

export interface RecapturaCard {
  id: string;
  cliente: string;
  telefone: string;
  ultimaMensagem: string;
  ausenteMin: number;
  reengajamento: ReengajamentoStatus;
}

export interface PosCard {
  id: string;
  cliente: string;
  telefone: string;
  ultimaMensagem: string;
  hora: string;
  tipo: PosTipo;
  docEnviado?: boolean;
}

export const inicialCards: InicialCard[] = [
  { id: "w1", cliente: "Marina Costa", telefone: "+55 11 98877-1122", ultimaMensagem: "oi, queria marcar uma consulta", hora: "09:12", subStep: "iniciado", iaPausada: false },
  { id: "w2", cliente: "Rafael Lima", telefone: "+55 11 99654-3321", ultimaMensagem: "pode sim, qual documento?", hora: "09:24", subStep: "aguardando_dados", iaPausada: false },
  { id: "w3", cliente: "Beatriz Alves", telefone: "+55 21 98123-5566", ultimaMensagem: "perfeito, obrigada!", hora: "09:31", subStep: "fisgado", iaPausada: false },
  { id: "w4", cliente: "Tom Oliveira", telefone: "+55 11 97777-8899", ultimaMensagem: "qual o valor da consulta?", hora: "09:48", subStep: "aguardando_dados", iaPausada: true },
];

export const agendamentoCards: AgendamentoCard[] = [
  { id: "w5", cliente: "Sofia Mendes", telefone: "+55 11 99000-1212", ultimaMensagem: "quinta às 14h fica bom", hora: "10:02", dataSugerida: "Qui 04 Jul - 14:00", confirmado: false },
  { id: "w6", cliente: "Henrique Souza", telefone: "+55 11 98555-7788", ultimaMensagem: "pode ser segunda de manhã", hora: "10:15", dataSugerida: "Seg 08 Jul - 09:00", confirmado: false },
  { id: "w7", cliente: "Larissa Pinto", telefone: "+55 31 98888-4444", ultimaMensagem: "confirmado, obrigada", hora: "10:30", dataSugerida: "Ter 09 Jul - 11:30", confirmado: true },
];

export const recapturaCards: RecapturaCard[] = [
  { id: "w8", cliente: "Bruno Carvalho", telefone: "+55 11 96666-1234", ultimaMensagem: "oi", ausenteMin: 125, reengajamento: "disparado" },
  { id: "w9", cliente: "Ana Júlia", telefone: "+55 21 97444-5588", ultimaMensagem: "depois te respondo", ausenteMin: 1440, reengajamento: "agendado" },
  { id: "w10", cliente: "Pedro Naves", telefone: "+55 11 98321-9090", ultimaMensagem: "ok", ausenteMin: 95, reengajamento: "nenhum" },
];

export const posCards: PosCard[] = [
  { id: "w11", cliente: "Júlia Reis", telefone: "+55 11 99111-2233", ultimaMensagem: "muito obrigada pela atenção", hora: "11:05", tipo: "finalizado" },
  { id: "w12", cliente: "Marcos Téo", telefone: "+55 11 98222-3344", ultimaMensagem: "preciso remarcar o retorno", hora: "11:20", tipo: "retorno" },
  { id: "w13", cliente: "Clara Nunes", telefone: "+55 11 99000-7766", ultimaMensagem: "pode enviar o atestado?", hora: "11:40", tipo: "secretaria_documentos", docEnviado: true },
  { id: "w14", cliente: "Diego Martins", telefone: "+55 11 98555-1212", ultimaMensagem: "segunda via da receita por favor", hora: "11:55", tipo: "secretaria_documentos", docEnviado: false },
];
