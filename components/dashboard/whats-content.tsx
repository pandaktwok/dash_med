"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PauseIcon,
  HandPointingRight01Icon,
  Megaphone01Icon,
  Clock01Icon,
  Tick01Icon,
  CheckmarkCircle01Icon,
  File01Icon,
  Refresh01Icon,
  Alert02Icon,
} from "@hugeicons/core-free-icons";
import {
  inicialCards,
  agendamentoCards,
  recapturaCards,
  posCards,
  type InicialCard,
  type AgendamentoCard,
  type RecapturaCard,
  type PosCard,
  type InicialSubStep,
  type ReengajamentoStatus,
  type PosTipo,
} from "@/mock-data/whatsapp";
import { cn } from "@/lib/utils";

/* ---------- helpers ---------- */

function subStepMeta(step: InicialSubStep) {
  switch (step) {
    case "iniciado":
      return { label: "Iniciado", dot: "bg-cyan-500", text: "text-cyan-600 dark:text-cyan-400" };
    case "aguardando_dados":
      return { label: "Aguardando Dados", dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" };
    case "fisgado":
      return { label: "Cliente Fisgado", dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" };
  }
}

const subStepOrder: InicialSubStep[] = ["iniciado", "aguardando_dados", "fisgado"];

function reengajamentoMeta(r: ReengajamentoStatus) {
  switch (r) {
    case "disparado":
      return { label: "Reengajamento disparado", text: "text-emerald-600 dark:text-emerald-400" };
    case "agendado":
      return { label: "Reengajamento agendado", text: "text-amber-600 dark:text-amber-400" };
    case "nenhum":
      return { label: "Sem gatilho", text: "text-muted-foreground" };
  }
}

function posMeta(t: PosTipo) {
  switch (t) {
    case "finalizado":
      return { label: "Finalizado", text: "text-muted-foreground", icon: Tick01Icon };
    case "retorno":
      return { label: "Retorno", text: "text-amber-600 dark:text-amber-400", icon: Refresh01Icon };
    case "secretaria_documentos":
      return { label: "Secretaria Virtual", text: "text-violet-600 dark:text-violet-400", icon: File01Icon };
  }
}

function formatAusente(min: number) {
  if (min < 60) return `Ausente há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Ausente há ${h}h`;
  const d = Math.floor(h / 24);
  return `Ausente há ${d} dia${d > 1 ? "s" : ""}`;
}

/* ---------- small UI atoms ---------- */

function Tag({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium bg-muted text-muted-foreground",
        className
      )}
    >
      {children}
    </span>
  );
}

function Dot({ className }: { className?: string }) {
  return <span className={cn("size-1.5 rounded-full", className)} />;
}

/* ---------- card shell ---------- */

function CardShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-3 text-sm transition-colors hover:bg-muted/30",
        className
      )}
    >
      {children}
    </div>
  );
}

function CardHead({
  cliente,
  telefone,
  hora,
}: {
  cliente: string;
  telefone: string;
  hora?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="font-medium text-foreground truncate">{cliente}</p>
        <p className="text-xs text-muted-foreground truncate">{telefone}</p>
      </div>
      {hora && (
        <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
          {hora}
        </span>
      )}
    </div>
  );
}

function LastMsg({ msg }: { msg: string }) {
  return (
    <p className="mt-1.5 text-xs text-muted-foreground line-clamp-1">
      {msg}
    </p>
  );
}

/* ---------- column shell ---------- */

function Column({
  title,
  count,
  children,
  footer,
  accent,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
  footer?: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="flex w-[300px] sm:w-[320px] shrink-0 flex-col rounded-xl border border-border bg-muted/20">
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          {accent && <span className={cn("size-2 rounded-full", accent)} />}
          <h3 className="text-sm font-medium">{title}</h3>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
      </div>
      <div className="flex-1 space-y-2 p-2 overflow-y-auto">{children}</div>
      {footer && <div className="border-t border-border p-2">{footer}</div>}
    </div>
  );
}

/* ---------- the board ---------- */

export function WhatsContent() {
  const [inicial, setInicial] = useState<InicialCard[]>(inicialCards);
  const [agendamento, setAgendamento] = useState<AgendamentoCard[]>(agendamentoCards);
  const [recaptura] = useState<RecapturaCard[]>(recapturaCards);
  const [pos] = useState<PosCard[]>(posCards);
  const [limite, setLimite] = useState("14:00");

  /* ações */
  const intervir = (id: string) => {
    setInicial((arr) =>
      arr.map((c) => (c.id === id ? { ...c, iaPausada: true } : c))
    );
  };
  const retomarIA = (id: string) => {
    setInicial((arr) =>
      arr.map((c) => (c.id === id ? { ...c, iaPausada: false } : c))
    );
  };
  const confirmarAg = (id: string) => {
    setAgendamento((arr) =>
      arr.map((c) => (c.id === id ? { ...c, confirmado: true } : c))
    );
  };
  const confirmarLote = () => {
    setAgendamento((arr) => arr.map((c) => ({ ...c, confirmado: true })));
  };

  const totalAtivos = useMemo(
    () => inicial.length + agendamento.length + recaptura.length + pos.length,
    [inicial, agendamento, recaptura, pos]
  );

  return (
    <main className="h-full w-full overflow-hidden p-4">
      <div className="mx-auto flex h-full w-full flex-col gap-4">
        {/* header */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
              Atendimentos WhatsApp
            </h1>
            <p className="text-sm text-muted-foreground">
              {totalAtivos} conversas ativas · Secretaria virtual Open Cloud
            </p>
          </div>
          <div className="flex items-center gap-2 self-start">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              IA conectada
            </span>
          </div>
        </div>

        {/* board */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex h-full gap-3 min-w-max pb-1">
            {/* 1. Atendimento Inicial */}
            <Column
              title="Atendimento Inicial"
              count={inicial.length}
              accent="bg-cyan-500"
            >
              {inicial.map((c) => {
                const meta = subStepMeta(c.subStep);
                const stepIdx = subStepOrder.indexOf(c.subStep);
                return (
                  <CardShell key={c.id}>
                    <CardHead cliente={c.cliente} telefone={c.telefone} hora={c.hora} />
                    <LastMsg msg={c.ultimaMensagem} />

                    {/* sub-etapas */}
                    <div className="mt-2 flex items-center gap-1">
                      {subStepOrder.map((s, i) => (
                        <div
                          key={s}
                          className={cn(
                            "h-1 flex-1 rounded-full",
                            i <= stepIdx ? meta.dot : "bg-border"
                          )}
                        />
                      ))}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className={cn("inline-flex items-center gap-1 text-[11px] font-medium", meta.text)}>
                        <Dot className={meta.dot} />
                        {meta.label}
                      </span>
                      {c.iaPausada && (
                        <Tag className="bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          <HugeiconsIcon icon={PauseIcon} className="size-3" />
                          IA pausada
                        </Tag>
                      )}
                    </div>

                    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                      {!c.iaPausada ? (
                        <Button
                          variant="outline"
                          size="xs"
                          className="gap-1"
                          onClick={() => intervir(c.id)}
                        >
                          <HugeiconsIcon icon={HandPointingRight01Icon} className="size-3" />
                          Intervir manualmente
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="xs"
                          className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => retomarIA(c.id)}
                        >
                          <HugeiconsIcon icon={Tick01Icon} className="size-3" />
                          Retomar IA
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="xs"
                        className="gap-1 ml-auto"
                        onClick={() => console.log("Ver conversa", c.id)}
                      >
                        Ver Conversa
                      </Button>
                    </div>
                  </CardShell>
                );
              })}
            </Column>

            {/* 2. Agendamento */}
            <Column
              title="Agendamento"
              count={agendamento.length}
              accent="bg-amber-500"
              footer={
                <div className="flex items-center gap-1.5">
                  <Input
                    type="time"
                    value={limite}
                    onChange={(e) => setLimite(e.target.value)}
                    className="h-7 flex-1 text-xs bg-background"
                  />
                    <Button
                      variant="default"
                      size="xs"
                      className="gap-1"
                      onClick={confirmarLote}
                    >
                      <HugeiconsIcon icon={Tick01Icon} className="size-3" />
                      Confirmar até {limite}
                    </Button>
                </div>
              }
            >
              {agendamento.map((c) => (
                <CardShell key={c.id}>
                  <CardHead cliente={c.cliente} telefone={c.telefone} hora={c.hora} />
                  <LastMsg msg={c.ultimaMensagem} />

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <HugeiconsIcon icon={Clock01Icon} className="size-3" />
                      {c.dataSugerida}
                    </span>
                    {c.confirmado ? (
                      <Tag className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-3" />
                        Confirmado
                      </Tag>
                    ) : (
                      <Button
                        variant="outline"
                        size="icon-xs"
                        className="gap-1"
                        onClick={() => confirmarAg(c.id)}
                        aria-label="Confirmar agendamento"
                      >
                        <HugeiconsIcon icon={Tick01Icon} className="size-3" />
                      </Button>
                    )}
                  </div>
                </CardShell>
              ))}
            </Column>

            {/* 3. Recaptura */}
            <Column
              title="Recaptura de Clientes"
              count={recaptura.length}
              accent="bg-rose-500"
            >
              {recaptura.map((c) => {
                const rmeta = reengajamentoMeta(c.reengajamento);
                const longTime = c.ausenteMin >= 720;
                return (
                  <CardShell key={c.id}>
                    <CardHead cliente={c.cliente} telefone={c.telefone} />
                    <LastMsg msg={c.ultimaMensagem} />

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-[11px] font-medium",
                          longTime
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-muted-foreground"
                        )}
                      >
                        <HugeiconsIcon icon={Alert02Icon} className="size-3" />
                        {formatAusente(c.ausenteMin)}
                      </span>
                    </div>

                    <div className="mt-1.5 flex items-center gap-1.5">
                      <HugeiconsIcon
                        icon={c.reengajamento === "disparado" ? Megaphone01Icon : Clock01Icon}
                        className={cn("size-3", rmeta.text)}
                      />
                      <span className={cn("text-[11px]", rmeta.text)}>
                        {rmeta.label}
                      </span>
                    </div>
                  </CardShell>
                );
              })}
            </Column>

            {/* 4. Pós-Atendimento */}
            <Column
              title="Pós-Atendimento"
              count={pos.length}
              accent="bg-violet-500"
            >
              {pos.map((c) => {
                const pmeta = posMeta(c.tipo);
                return (
                  <CardShell key={c.id}>
                    <CardHead cliente={c.cliente} telefone={c.telefone} hora={c.hora} />
                    <LastMsg msg={c.ultimaMensagem} />

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <Tag className={cn("bg-transparent border border-border", pmeta.text)}>
                        <HugeiconsIcon icon={pmeta.icon} className="size-3" />
                        {pmeta.label}
                      </Tag>

                      {c.tipo === "secretaria_documentos" && (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-[11px]",
                            c.docEnviado
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-muted-foreground"
                          )}
                        >
                          <HugeiconsIcon icon={File01Icon} className="size-3" />
                          {c.docEnviado ? "Enviado pelo WhatsApp" : "Processando"}
                        </span>
                      )}
                    </div>
                  </CardShell>
                );
              })}
            </Column>
          </div>
        </div>
      </div>
    </main>
  );
}
