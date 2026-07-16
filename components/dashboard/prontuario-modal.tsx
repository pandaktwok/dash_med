"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  ClipboardIcon,
  Note01Icon,
  Certificate01Icon,
  PrescriptionIcon,
  Tick01Icon,
  Clock01Icon,
  File02Icon,
  WhatsappIcon,
  Medicine01Icon,
  Alert02Icon,
  Add01Icon,
  RepeatIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { useProntuarioStore, proximaCategoria } from "@/store/prontuario-store";
import { useAtendimentoStore } from "@/store/atendimento-store";
import { useConfigStore } from "@/store/config-store";
import type { ProntuarioStatus, ConsultaProntuario, CategoriaConsulta } from "@/mock-data/pacientes";
import { toDateKey } from "@/mock-data/calendario";
import { DocumentoDrawer } from "./documento-drawer";

const statusProntuarioMeta: Record<
  ProntuarioStatus,
  { label: string; className: string; dot: string }
> = {
  aguardando: {
    label: "Aguardando",
    className: "text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  em_atendimento: {
    label: "Em Atendimento",
    className: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  atendido: {
    label: "Atendido",
    className: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
};

const statusOrdem: ProntuarioStatus[] = ["aguardando", "em_atendimento", "atendido"];

function prettifyData(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${d.toString().padStart(2, "0")} ${meses[m - 1]} ${y}`;
}

export function ProntuarioModal() {
  const open = useProntuarioStore((s) => s.open);
  const pacienteId = useProntuarioStore((s) => s.pacienteId);
  const activeConsultaId = useProntuarioStore((s) => s.activeConsultaId);
  const pacientes = useProntuarioStore((s) => s.pacientes);
  const close = useProntuarioStore((s) => s.close);
  const setActiveConsulta = useProntuarioStore((s) => s.setActiveConsulta);
  const updateConsulta = useProntuarioStore((s) => s.updateConsulta);
  const setConsultaStatus = useProntuarioStore((s) => s.setConsultaStatus);
  const upsertOrientacoes = useProntuarioStore((s) => s.upsertOrientacoesConsolidadas);
  const openDrawer = useProntuarioStore((s) => s.openDrawer);
  const addConsultaFluxo = useProntuarioStore((s) => s.addConsultaFluxo);

  const iniciarAtendimento = useAtendimentoStore((s) => s.iniciarAtendimento);
  const finalizarAtendimento = useAtendimentoStore((s) => s.finalizarAtendimento);

  const profissional = useConfigStore((s) => s.profissionais[0]);

  const paciente = useMemo(
    () => pacientes.find((p) => p.id === pacienteId) ?? null,
    [pacientes, pacienteId],
  );

  if (!open || !paciente) return null;

  // Consultas ordenadas da mais recente para a mais antiga.
  const consultas = [...paciente.consultas].sort((a, b) =>
    b.data.localeCompare(a.data) || b.horario.localeCompare(a.horario),
  );
  const active =
    consultas.find((c) => c.id === activeConsultaId) ?? consultas[0] ?? null;

  function handleAtender() {
    if (!active) return;
    setConsultaStatus(paciente!.id, active.id, "em_atendimento");
    iniciarAtendimento(active.id);
  }

  function handleFinalizar() {
    if (!active) return;
    setConsultaStatus(paciente!.id, active.id, "atendido");
    finalizarAtendimento(active.id);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
      role="dialog"
      aria-label="Prontuário do paciente"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={close} aria-hidden />

      <div
        className="relative z-10 w-full max-w-[1400px] h-[94vh] rounded-xl border bg-card shadow-xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===== Cabeçalho ===== */}
        <header className="flex flex-col gap-3 border-b px-5 py-4 bg-muted/30">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex items-center gap-3">
              <div className="size-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <HugeiconsIcon icon={ClipboardIcon} className="size-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold leading-tight truncate">
                  {paciente.nome}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {paciente.especialidade} · {paciente.telefone}
                  {paciente.nascimento ? ` · Nasc. ${prettifyData(paciente.nascimento)}` : ""}
                </p>
              </div>
            </div>
            <button
              onClick={close}
              className="text-muted-foreground hover:text-foreground transition p-1.5 shrink-0"
              aria-label="Fechar"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="size-5" />
            </button>
          </div>

          {/* Tipo de atendimento + status atual */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Atendimento:</span>
              <span className="rounded-md border bg-background px-2 py-1 font-medium">
                {active?.tipo ?? "—"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Status atual:</span>
              <div className="flex flex-wrap gap-1.5">
                {statusOrdem.map((st) => {
                  const meta = statusProntuarioMeta[st];
                  const activeStatus = active?.status === st;
                  return (
                    <button
                      key={st}
                      onClick={() => active && setConsultaStatus(paciente.id, active.id, st)}
                      className={cn(
                        "h-7 px-2.5 rounded-md border text-xs font-medium inline-flex items-center gap-1.5 transition",
                        activeStatus
                          ? "border-transparent bg-primary text-primary-foreground"
                          : "bg-background hover:bg-muted",
                      )}
                    >
                      <span className={cn("size-2 rounded-full", meta.dot)} />
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </header>

        {/* ===== Corpo: grid lateral ===== */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[300px_1fr] overflow-hidden">
          {/* --- Lateral: Visão Geral --- */}
          <aside className="border-r bg-muted/20 overflow-y-auto p-4 flex flex-col gap-4">
            <section>
              <div className="flex items-center gap-2 mb-2">
                <HugeiconsIcon icon={Medicine01Icon} className="size-4 text-primary" />
                <h3 className="text-sm font-semibold">Histórico de Medicamentos</h3>
              </div>
              <p className="text-[11px] text-muted-foreground mb-2">
                Todos os medicamentos já prescritos na vida do paciente.
              </p>
              {paciente.historicoMedicamentos.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Nenhum medicamento registrado.</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {paciente.historicoMedicamentos.map((m, i) => (
                    <li key={i} className="rounded-md border bg-background p-2 text-xs">
                      <div className="font-medium">{m.nome} · {m.dosagem}</div>
                      <div className="text-muted-foreground">{m.orientacao}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {prettifyData(m.data)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <div className="flex items-center gap-2 mb-2">
                <HugeiconsIcon icon={Note01Icon} className="size-4 text-primary" />
                <h3 className="text-sm font-semibold">Orientações Consolidadas</h3>
              </div>
              <textarea
                value={paciente.orientacoesConsolidadas}
                onChange={(e) => upsertOrientacoes(paciente.id, e.target.value)}
                rows={6}
                className="w-full rounded-md border border-input bg-background px-2.5 py-2 text-xs shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50"
                placeholder="Principais orientações médicas já fornecidas ao paciente..."
              />
            </section>
          </aside>

          {/* --- Principal: Abas de consulta + evolução --- */}
          <div className="flex flex-col min-h-0 overflow-hidden">
            {consultas.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
                <span>Nenhuma consulta registrada.</span>
                <NovaConsultaButton pacienteId={paciente.id} especialidade={paciente.especialidade} consultas={paciente.consultas} onAdd={addConsultaFluxo} />
              </div>
            ) : (
              <>
                {/* Abas cronológicas */}
                <div className="border-b bg-background px-3 pt-2 overflow-x-auto">
                  <div className="flex items-center gap-1 min-w-max">
                    {consultas.map((c) => {
                      const isActive = c.id === active?.id;
                      const meta = statusProntuarioMeta[c.status];
                      const isRetorno = c.categoria === "retorno";
                      return (
                        <button
                          key={c.id}
                          onClick={() => setActiveConsulta(c.id)}
                          className={cn(
                            "px-3 py-2 text-xs font-medium rounded-t-md border border-b-0 transition inline-flex items-center gap-1.5 whitespace-nowrap",
                            isActive
                              ? "bg-card border-border text-foreground -mb-px"
                              : "bg-muted/40 border-transparent text-muted-foreground hover:text-foreground",
                          )}
                        >
                          <span className={cn("size-1.5 rounded-full", meta.dot)} />
                          {isRetorno ? (
                            <HugeiconsIcon icon={RepeatIcon} className="size-3 text-pink-500 shrink-0" />
                          ) : (
                            <span className="inline-flex items-center justify-center size-3.5 rounded-full bg-primary/15 text-primary text-[8px] font-bold shrink-0">
                              {c.numeroAtendimento}
                            </span>
                          )}
                          {prettifyData(c.data)} · {c.tipo}
                        </button>
                      );
                    })}
                    <NovaConsultaButton compact pacienteId={paciente.id} especialidade={paciente.especialidade} consultas={paciente.consultas} onAdd={addConsultaFluxo} />
                  </div>
                </div>

                {active && (
                  <ConsultaDetalhe
                    pacienteId={paciente.id}
                    consulta={active}
                    onChange={(patch) => updateConsulta(paciente.id, active.id, patch)}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* ===== Rodapé: ações de documento ===== */}
        {active && (
          <footer className="border-t px-5 py-3 flex flex-wrap items-center gap-2 bg-muted/30">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5"
              onClick={() => openDrawer("atestado")}
            >
              <HugeiconsIcon icon={Certificate01Icon} className="size-4 text-amber-500" />
              Gerar Atestado Médico
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5"
              onClick={() => openDrawer("receita")}
            >
              <HugeiconsIcon icon={PrescriptionIcon} className="size-4 text-emerald-500" />
              Gerar Receita
            </Button>
            <div className="ml-auto flex items-center gap-2">
              {active.status !== "atendido" && active.status !== "em_atendimento" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 gap-1.5"
                  onClick={handleAtender}
                >
                  <HugeiconsIcon icon={Clock01Icon} className="size-4" />
                  Iniciar Atendimento
                </Button>
              )}
              {active.status === "em_atendimento" && (
                <Button
                  size="sm"
                  className="h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-600/90 text-white"
                  onClick={handleFinalizar}
                >
                  <HugeiconsIcon icon={Tick01Icon} className="size-4" />
                  Finalizar Atendimento
                </Button>
              )}
              <Button variant="outline" size="sm" className="h-9" onClick={close}>
                Fechar
              </Button>
            </div>
          </footer>
        )}

        <DocumentoDrawer />
      </div>
    </div>
  );
}

// ============================================================
// Botão: Nova Consulta (respeita o fluxo atendimento → retorno)
// ============================================================
function NovaConsultaButton({
  pacienteId,
  especialidade,
  consultas,
  onAdd,
  compact,
}: {
  pacienteId: string;
  especialidade: string;
  consultas: ConsultaProntuario[];
  onAdd: (pacienteId: string, categoria: CategoriaConsulta, dados: { data: string; horario: string; especialidade: string }) => string;
  compact?: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const prox = proximaCategoria(consultas);

  function adicionar(categoria: CategoriaConsulta) {
    const hoje = new Date();
    onAdd(pacienteId, categoria, {
      data: toDateKey(hoje),
      horario: "09:00",
      especialidade,
    });
    setAberto(false);
  }

  if (compact) {
    return (
      <div className="relative shrink-0">
        <button
          onClick={() => setAberto((v) => !v)}
          className="px-3 py-2 text-xs font-medium rounded-t-md border border-b-0 bg-muted/40 text-muted-foreground hover:text-foreground transition inline-flex items-center gap-1.5 whitespace-nowrap"
        >
          <HugeiconsIcon icon={Add01Icon} className="size-3" />
          Nova Consulta
        </button>
        {aberto && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setAberto(false)} aria-hidden />
            <div className="absolute top-full left-0 mt-1 z-50 w-52 rounded-md border bg-popover shadow-lg p-2 flex flex-col gap-1.5">
              <p className="text-[11px] text-muted-foreground px-1">
                Próxima no fluxo: <strong className="text-foreground">{prox.categoria === "retorno" ? "Retorno" : "Novo Atendimento"}</strong>
              </p>
              <button
                onClick={() => adicionar("retorno")}
                className="h-8 px-2 rounded-md border text-xs font-medium inline-flex items-center gap-1.5 hover:bg-muted transition"
              >
                <HugeiconsIcon icon={RepeatIcon} className="size-3.5 text-pink-500" />
                Retorno (mesmo motivo)
              </button>
              <button
                onClick={() => adicionar("atendimento")}
                className="h-8 px-2 rounded-md border text-xs font-medium inline-flex items-center gap-1.5 hover:bg-muted transition"
              >
                <HugeiconsIcon icon={Add01Icon} className="size-3.5 text-primary" />
                Novo Atendimento (outro motivo)
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => setAberto((v) => !v)}>
        <HugeiconsIcon icon={Add01Icon} className="size-4" />
        Nova Consulta
      </Button>
      {aberto && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setAberto(false)} aria-hidden />
          <div className="absolute top-full left-0 mt-1 z-50 w-56 rounded-md border bg-popover shadow-lg p-2 flex flex-col gap-1.5">
            <p className="text-[11px] text-muted-foreground px-1">
              Próxima no fluxo: <strong className="text-foreground">{prox.categoria === "retorno" ? "Retorno" : "Novo Atendimento"}</strong>
            </p>
            <button
              onClick={() => adicionar("retorno")}
              className="h-8 px-2 rounded-md border text-xs font-medium inline-flex items-center gap-1.5 hover:bg-muted transition"
            >
              <HugeiconsIcon icon={RepeatIcon} className="size-3.5 text-pink-500" />
              Retorno (mesmo motivo)
            </button>
            <button
              onClick={() => adicionar("atendimento")}
              className="h-8 px-2 rounded-md border text-xs font-medium inline-flex items-center gap-1.5 hover:bg-muted transition"
            >
              <HugeiconsIcon icon={Add01Icon} className="size-3.5 text-primary" />
              Novo Atendimento (outro motivo)
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// Detalhe de uma consulta (aba ativa)
// ============================================================
function ConsultaDetalhe({
  pacienteId,
  consulta,
  onChange,
}: {
  pacienteId: string;
  consulta: ConsultaProntuario;
  onChange: (patch: Partial<ConsultaProntuario>) => void;
}) {
  void pacienteId;
  const profissional = useConfigStore((s) => s.profissionais[0]);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-5 flex flex-col gap-5">
      {/* Cabeçalho da consulta */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">
          {prettifyData(consulta.data)} · {consulta.horario}
        </span>
        <span>·</span>
        <span>{consulta.especialidade}</span>
        <span>·</span>
        <span className={cn(
          "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-medium",
          consulta.categoria === "retorno"
            ? "border-pink-500/40 bg-pink-500/10 text-pink-600 dark:text-pink-400"
            : "border-primary/40 bg-primary/10 text-primary",
        )}>
          {consulta.categoria === "retorno" ? (
            <HugeiconsIcon icon={RepeatIcon} className="size-3" />
          ) : (
            <span className="inline-flex items-center justify-center size-3.5 rounded-full bg-primary/20 text-primary text-[8px] font-bold">
              {consulta.numeroAtendimento}
            </span>
          )}
          {consulta.tipo}
        </span>
      </div>

      {/* Evolução clínica */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Note01Icon} className="size-4 text-primary" />
          <h3 className="text-sm font-semibold">Evolução Clínica</h3>
        </div>
        <textarea
          value={consulta.evolucao}
          onChange={(e) => onChange({ evolucao: e.target.value })}
          rows={6}
          placeholder="Descreva a evolução clínica do paciente neste atendimento..."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50"
        />
      </section>

      {/* Orientações da consulta */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Note01Icon} className="size-4 text-primary" />
          <h3 className="text-sm font-semibold">Orientações deste atendimento</h3>
        </div>
        <textarea
          value={consulta.orientacoes}
          onChange={(e) => onChange({ orientacoes: e.target.value })}
          rows={3}
          placeholder="Orientações fornecidas ao paciente nesta consulta..."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50"
        />
      </section>

      {/* Medicamentos prescritos nesta consulta */}
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">Medicamentos prescritos</h3>
        {consulta.medicamentos.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            Nenhum medicamento nesta consulta. Use "Gerar Receita" para prescrever.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {consulta.medicamentos.map((m, i) => (
              <li
                key={i}
                className="rounded-md border bg-muted/30 p-2 text-xs flex items-center gap-2"
              >
                <HugeiconsIcon icon={Medicine01Icon} className="size-3.5 text-primary shrink-0" />
                <span className="font-medium">{m.nome} {m.dosagem}</span>
                <span className="text-muted-foreground truncate">{m.orientacao}</span>
                <button
                  className="ml-auto text-muted-foreground hover:text-rose-500 text-[11px] px-1.5"
                  onClick={() =>
                    onChange({
                      medicamentos: consulta.medicamentos.filter((_, j) => j !== i),
                    })
                  }
                >
                  remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Repositório de documentos por consulta */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={File02Icon} className="size-4 text-primary" />
          <h3 className="text-sm font-semibold">Documentos deste atendimento</h3>
        </div>
        <p className="text-[11px] text-muted-foreground">
          PDFs vinculados à consulta {consulta.id} e ao paciente. Disponíveis para
          automação via WhatsApp (n8n).
        </p>
        {consulta.documentos.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
            Nenhum documento gerado ainda.
          </div>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {consulta.documentos.map((d) => (
              <li
                key={d.id}
                className="rounded-md border bg-background p-2.5 text-xs flex items-center gap-2"
              >
                <HugeiconsIcon
                  icon={d.tipo === "atestado" ? Certificate01Icon : PrescriptionIcon}
                  className={cn(
                    "size-4 shrink-0",
                    d.tipo === "atestado" ? "text-amber-500" : "text-emerald-500",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="font-medium capitalize">{d.tipo}</div>
                  <div className="text-muted-foreground truncate" title={d.url}>
                    {d.url}
                  </div>
                </div>
                <a
                  href={d.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] hover:bg-muted"
                >
                  <HugeiconsIcon icon={WhatsappIcon} className="size-3.5 text-emerald-500" />
                  Abrir
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Aviso de profissional responsável */}
      <div className="mt-auto text-[11px] text-muted-foreground flex items-center gap-1.5">
        <HugeiconsIcon icon={Alert02Icon} className="size-3.5" />
        Responsável: {profissional?.nome ?? "—"}
      </div>
    </div>
  );
}
