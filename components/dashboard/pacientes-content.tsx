"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  UserMultipleIcon,
  EyeIcon,
  ClipboardIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { useProntuarioStore } from "@/store/prontuario-store";
import { useAgora } from "@/hooks/use-agora";

const statusDot: Record<string, string> = {
  aguardando: "bg-blue-500",
  em_atendimento: "bg-amber-500",
  atendido: "bg-emerald-500",
};

function prettifyData(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${d.toString().padStart(2, "0")}/${m.toString().padStart(2, "0")}/${y}`;
}

export function PacientesContent() {
  const pacientes = useProntuarioStore((s) => s.pacientes);
  const openByPaciente = useProntuarioStore((s) => s.openByPaciente);
  const [q, setQ] = useState("");
  const agora = useAgora();
  void agora;

  const lista = useMemo(() => {
    const query = q.trim().toLowerCase();
    return pacientes
      .filter((p) => !query || p.nome.toLowerCase().includes(query) || p.especialidade.toLowerCase().includes(query))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [pacientes, q]);

  return (
    <div className="w-full h-full flex flex-col p-4 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={UserMultipleIcon} className="size-5 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">Pacientes</h2>
          <span className="text-xs text-muted-foreground">{lista.length} cadastrado(s)</span>
        </div>
        <div className="relative w-full sm:w-64">
          <HugeiconsIcon icon={Search01Icon} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar paciente..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-8 h-9 text-sm bg-muted/50"
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto rounded-xl border bg-card">
        {lista.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Nenhum paciente encontrado.
          </div>
        ) : (
          <div className="divide-y">
            {lista.map((p) => {
              const ultima = [...p.consultas].sort((a, b) =>
                b.data.localeCompare(a.data),
              )[0];
              return (
                <button
                  key={p.id}
                  onClick={() => openByPaciente(p.id)}
                  className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="size-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                    <HugeiconsIcon icon={ClipboardIcon} className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{p.nome}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {p.especialidade} · {p.telefone}
                      {p.consultas.length > 0 && ` · ${p.consultas.length} consulta(s)`}
                    </div>
                  </div>
                  {ultima && (
                    <div className="hidden sm:flex flex-col items-end text-[11px] text-muted-foreground">
                      <span>Última: {prettifyData(ultima.data)}</span>
                      <span className="flex items-center gap-1">
                        <span className={cn("size-1.5 rounded-full", statusDot[ultima.status])} />
                        {ultima.status.replace("_", " ")}
                      </span>
                    </div>
                  )}
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 shrink-0">
                    <HugeiconsIcon icon={EyeIcon} className="size-3.5" />
                    Prontuário
                  </Button>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
