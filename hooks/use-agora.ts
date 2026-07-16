"use client";

import { useEffect, useState } from "react";

// Hook que devolve o "agora" atualizado a cada `intervalMs` (default 20s).
// Usado pelo Painel Geral para computar tarjas de tempo restante e alertas.
export function useAgora(intervalMs = 20_000): Date {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

// Converte "HH:mm" para minutos desde meia-noite.
export function horarioParaMin(horario: string): number {
  const [h, m] = horario.split(":").map(Number);
  return h * 60 + m;
}

// Minutos desde meia-noite do `date`.
export function minutosDoDia(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}
