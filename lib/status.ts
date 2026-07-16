import {
  CircleIcon,
  Tick01Icon,
  Clock01Icon,
  Cancel01Icon,
  RepeatIcon,
} from "@hugeicons/core-free-icons";
import type { AtendimentoStatus } from "@/mock-data/dashboard";
import type { Compromisso } from "@/mock-data/calendario";
import { cn } from "@/lib/utils";

// Padrão de cores do programa (aplicado em calendário, lista de atendimentos,
// etc.).
//
//   Azul     -> Confirmado
//   Verde    -> Realizado
//   Rosa     -> Retorno
//   Amarelo  -> Pendente
//   Vermelho -> Cancelado
//   Cinza    -> Compromissos externos (tipo pessoal)
//
// Para compromissos do tipo "pessoal" (externos), o bloco usa a cor cinza
// definida em `compromissoColor`. Para consultas, a cor é derivada do `status`.

export const statusMeta: Record<
  AtendimentoStatus,
  {
    label: string;
    icon: typeof CircleIcon;
    className: string;
    dot: string;
  }
> = {
  confirmado: {
    label: "Confirmado",
    icon: CircleIcon,
    className: "text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  realizado: {
    label: "Realizado",
    icon: Tick01Icon,
    className: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  retorno: {
    label: "Retorno",
    icon: RepeatIcon,
    className: "text-pink-600 dark:text-pink-400",
    dot: "bg-pink-500",
  },
  pendente: {
    label: "Pendente",
    icon: Clock01Icon,
    className: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  cancelado: {
    label: "Cancelado",
    icon: Cancel01Icon,
    className: "text-red-600 dark:text-red-400",
    dot: "bg-red-500",
  },
};

export const statusOptions: AtendimentoStatus[] = [
  "confirmado",
  "realizado",
  "retorno",
  "pendente",
  "cancelado",
];

// Itens da legenda usada acima do calendário (e em outros lugares do app).
export const legendaCores = [
  {
    key: "confirmado",
    label: "Confirmado",
    className: "bg-blue-500",
    textClass: "text-blue-700 dark:text-blue-400",
  },
  {
    key: "realizado",
    label: "Realizado",
    className: "bg-emerald-500",
    textClass: "text-emerald-700 dark:text-emerald-400",
  },
  {
    key: "retorno",
    label: "Retorno",
    className: "bg-pink-500",
    textClass: "text-pink-700 dark:text-pink-400",
  },
  {
    key: "pendente",
    label: "Pendente",
    className: "bg-amber-500",
    textClass: "text-amber-700 dark:text-amber-400",
  },
  {
    key: "cancelado",
    label: "Cancelado",
    className: "bg-red-500",
    textClass: "text-red-700 dark:text-red-400",
  },
  {
    key: "externo",
    label: "Compromisso externo",
    className: "bg-slate-400",
    textClass: "text-slate-600 dark:text-slate-300",
  },
] as const;

// Bloco de cor para o compromisso no calendário (compartilhado por todas as
// views e reaproveitado na lista de compromissos dentro do sheet).
export function compromissoColor(c: Compromisso): string {
  if (c.tipo === "pessoal")
    return "bg-slate-400/15 text-slate-700 dark:text-slate-300 border-slate-400/30";
  if (c.status === "cancelado")
    return "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30 line-through";
  if (c.status === "confirmado")
    return "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30";
  if (c.status === "realizado")
    return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
  if (c.status === "retorno")
    return "bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/30";
  if (c.status === "pendente")
    return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30";
  return "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30";
}

// Calcula o horário de fim a partir do horário de início + duração em minutos.
// Retorna "HH:mm".
export function horarioFim(horario: string, duracaoMin: number): string {
  const [h, m] = horario.split(":").map(Number);
  const total = h * 60 + m + duracaoMin;
  const hh = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const mm = (total % 60).toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

export { cn };