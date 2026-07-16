"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Settings01Icon,
  StethoscopeIcon,
  Building01Icon,
  Certificate01Icon,
  Medicine01Icon,
  Note01Icon,
  Calendar03Icon,
  Add01Icon,
  Delete01Icon,
  Tick01Icon,
  Alert02Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { useConfigStore } from "@/store/config-store";
import { feriados, parseDateKey, addMonths, MONTHS, WEEKDAYS_SHORT } from "@/mock-data/calendario";

type Secao =
  | "profissionais"
  | "modelos"
  | "medicamentos"
  | "templates"
  | "regras";

const secoes: { id: Secao; label: string; icon: typeof Settings01Icon }[] = [
  { id: "profissionais", label: "Dados Profissionais e Locais", icon: StethoscopeIcon },
  { id: "modelos", label: "Modelos de Documentos (Papel Timbrado)", icon: Certificate01Icon },
  { id: "medicamentos", label: "Medicamentos Frequentes", icon: Medicine01Icon },
  { id: "templates", label: "Textos Padrão para Atestados", icon: Note01Icon },
  { id: "regras", label: "Regras do Calendário e Feriados", icon: Calendar03Icon },
];

export function ConfigContent() {
  const [secao, setSecao] = useState<Secao>("profissionais");

  return (
    <div className="w-full h-full flex flex-col lg:flex-row overflow-hidden">
      {/* Sub-abas */}
      <nav className="lg:w-72 lg:border-r border-b lg:border-b-0 bg-muted/20 p-2 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-y-auto shrink-0">
        {secoes.map((s) => (
          <button
            key={s.id}
            onClick={() => setSecao(s.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left whitespace-nowrap transition",
              secao === s.id
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            <HugeiconsIcon icon={s.icon} className="size-4 shrink-0" />
            <span className="truncate">{s.label}</span>
          </button>
        ))}
      </nav>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto w-full max-w-3xl flex flex-col gap-5">
          {secao === "profissionais" && <SecaoProfissionais />}
          {secao === "modelos" && <SecaoModelos />}
          {secao === "medicamentos" && <SecaoMedicamentos />}
          {secao === "templates" && <SecaoTemplates />}
          {secao === "regras" && <SecaoRegras />}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// A) Dados profissionais e locais
// ============================================================
function SecaoProfissionais() {
  const { profissionais, locais, addProfissional, updateProfissional, removeProfissional, addLocal, updateLocal, removeLocal } =
    useConfigStore();

  return (
    <>
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <HugeiconsIcon icon={StethoscopeIcon} className="size-4 text-primary" />
            Profissionais
          </h3>
          <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={addProfissional}>
            <HugeiconsIcon icon={Add01Icon} className="size-4" />
            Novo profissional
          </Button>
        </div>
        <div className="flex flex-col gap-3">
          {profissionais.map((p) => (
            <div key={p.id} className="rounded-lg border bg-card p-3 flex flex-col gap-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Field label="Nome do Médico">
                  <Input value={p.nome} onChange={(e) => updateProfissional(p.id, { nome: e.target.value })} placeholder="Dr(a)." />
                </Field>
                <Field label="Especialidade">
                  <Input value={p.especialidade} onChange={(e) => updateProfissional(p.id, { especialidade: e.target.value })} />
                </Field>
                <Field label="Assistente">
                  <Input value={p.assistente ?? ""} onChange={(e) => updateProfissional(p.id, { assistente: e.target.value })} />
                </Field>
              </div>
              <div className="flex justify-end">
                <Button size="sm" variant="ghost" className="h-7 text-rose-600 gap-1" onClick={() => removeProfissional(p.id)}>
                  <HugeiconsIcon icon={Delete01Icon} className="size-3.5" />
                  Remover
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <HugeiconsIcon icon={Building01Icon} className="size-4 text-primary" />
            Locais / Consultórios
          </h3>
          <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={addLocal}>
            <HugeiconsIcon icon={Add01Icon} className="size-4" />
            Novo local
          </Button>
        </div>
        <div className="flex flex-col gap-3">
          {locais.map((l) => (
            <div key={l.id} className="rounded-lg border bg-card p-3 flex flex-col gap-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Field label="Nome do local">
                  <Input value={l.nome} onChange={(e) => updateLocal(l.id, { nome: e.target.value })} />
                </Field>
                <Field label="Endereço">
                  <Input value={l.endereco} onChange={(e) => updateLocal(l.id, { endereco: e.target.value })} />
                </Field>
              </div>
              <div className="flex justify-end">
                <Button size="sm" variant="ghost" className="h-7 text-rose-600 gap-1" onClick={() => removeLocal(l.id)}>
                  <HugeiconsIcon icon={Delete01Icon} className="size-3.5" />
                  Remover
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

// ============================================================
// B) Modelos de documentos
// ============================================================
function SecaoModelos() {
  const { modelos, updateModelo } = useConfigStore();
  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-semibold flex items-center gap-2">
        <HugeiconsIcon icon={Certificate01Icon} className="size-4 text-primary" />
        Papel Timbrado — Atestado e Receitário
      </h3>
      <p className="text-xs text-muted-foreground">
        Configure o layout/texto base em branco. Ao gerar um documento no
        atendimento, o sistema usa este modelo e apenas sobrescreve os dados
        variáveis por cima.
      </p>
      {modelos.map((m) => (
        <div key={m.tipo} className="rounded-lg border bg-card p-3 flex flex-col gap-2">
          <h4 className="text-sm font-medium capitalize flex items-center gap-2">
            <HugeiconsIcon
              icon={m.tipo === "atestado" ? Certificate01Icon : Medicine01Icon}
              className={cn("size-4", m.tipo === "atestado" ? "text-amber-500" : "text-emerald-500")}
            />
            {m.tipo === "atestado" ? "Atestado Médico" : "Receitário"}
          </h4>
          <Field label="PDF timbrado em branco (URL)">
            <Input
              value={m.pdfUrl ?? ""}
              onChange={(e) => updateModelo(m.tipo, { pdfUrl: e.target.value })}
              placeholder="/atestado_em_branco_timbrado.pdf"
            />
            {m.pdfUrl && (
              <a
                href={m.pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-primary hover:underline mt-1 inline-block"
              >
                Abrir PDF em branco →
              </a>
            )}
          </Field>
          <Field label="Logo (URL)">
            <Input
              value={m.logoUrl ?? ""}
              onChange={(e) => updateModelo(m.tipo, { logoUrl: e.target.value })}
              placeholder="/logo.png"
            />
          </Field>
          <Field label="Cabeçalho">
            <textarea
              value={m.cabecalho}
              onChange={(e) => updateModelo(m.tipo, { cabecalho: e.target.value })}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-2.5 py-2 text-sm shadow-xs outline-none focus-visible:border-ring"
            />
          </Field>
          <Field label="Rodapé">
            <textarea
              value={m.rodape}
              onChange={(e) => updateModelo(m.tipo, { rodape: e.target.value })}
              rows={2}
              className="w-full rounded-md border border-input bg-background px-2.5 py-2 text-sm shadow-xs outline-none focus-visible:border-ring"
            />
          </Field>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// C) Medicamentos frequentes
// ============================================================
function SecaoMedicamentos() {
  const { medicamentosFrequentes, addMedicamento, updateMedicamento, removeMedicamento } = useConfigStore();
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <HugeiconsIcon icon={Medicine01Icon} className="size-4 text-primary" />
          Medicamentos Frequentes
        </h3>
        <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={addMedicamento}>
          <HugeiconsIcon icon={Add01Icon} className="size-4" />
          Novo
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Pré-cadastre os medicamentos mais receitados para autocompletar o
        preenchimento durante o atendimento.
      </p>
      <div className="flex flex-col gap-2">
        {medicamentosFrequentes.map((m) => (
          <div key={m.id} className="rounded-lg border bg-card p-2.5 flex flex-wrap items-end gap-2">
            <Field label="Nome" className="flex-1 min-w-[140px]">
              <Input value={m.nome} onChange={(e) => updateMedicamento(m.id, { nome: e.target.value })} />
            </Field>
            <Field label="Dosagem" className="w-28">
              <Input value={m.dosagem} onChange={(e) => updateMedicamento(m.id, { dosagem: e.target.value })} />
            </Field>
            <Field label="Orientação" className="flex-[2] min-w-[180px]">
              <Input value={m.orientacao} onChange={(e) => updateMedicamento(m.id, { orientacao: e.target.value })} />
            </Field>
            <Button size="icon-sm" variant="ghost" className="text-rose-600" onClick={() => removeMedicamento(m.id)}>
              <HugeiconsIcon icon={Delete01Icon} className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// D) Templates de atestado
// ============================================================
function SecaoTemplates() {
  const { templatesAtestado, addTemplate, updateTemplate, removeTemplate } = useConfigStore();
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <HugeiconsIcon icon={Note01Icon} className="size-4 text-primary" />
          Textos Padrão para Atestados
        </h3>
        <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={addTemplate}>
          <HugeiconsIcon icon={Add01Icon} className="size-4" />
          Novo template
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        {templatesAtestado.map((t) => (
          <div key={t.id} className="rounded-lg border bg-card p-3 flex flex-col gap-2">
            <Field label="Título">
              <Input value={t.titulo} onChange={(e) => updateTemplate(t.id, { titulo: e.target.value })} placeholder="Ex.: Afastamento padrão" />
            </Field>
            <Field label="Texto / Justificativa">
              <textarea
                value={t.texto}
                onChange={(e) => updateTemplate(t.id, { texto: e.target.value })}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-2.5 py-2 text-sm shadow-xs outline-none focus-visible:border-ring"
              />
            </Field>
            <div className="flex justify-end">
              <Button size="sm" variant="ghost" className="h-7 text-rose-600 gap-1" onClick={() => removeTemplate(t.id)}>
                <HugeiconsIcon icon={Delete01Icon} className="size-3.5" />
                Remover
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// E) Regras do calendário e feriados
// ============================================================
function SecaoRegras() {
  const { regras, updateRegras, toggleDiaSemana } = useConfigStore();

  // Feriados dentro da janela de antecedência (mês atual + N meses).
  const feriadosJanela = (() => {
    const base = new Date();
    const fim = addMonths(base, regras.antecedenciaFeriadosMeses + 1);
    return feriados
      .filter((f) => {
        const d = parseDateKey(f.data);
        return d >= base && d < fim;
      })
      .sort((a, b) => a.data.localeCompare(b.data));
  })();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <h3 className="font-semibold flex items-center gap-2">
          <HugeiconsIcon icon={Calendar03Icon} className="size-4 text-primary" />
          Regras de Atendimento
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Tempo padrão de consulta (min)">
            <Input
              type="number"
              min={5}
              value={regras.duracaoConsultaMin}
              onChange={(e) => updateRegras({ duracaoConsultaMin: Math.max(5, Number(e.target.value) || 30) })}
              className="w-28"
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Hora início">
              <Input type="number" min={0} max={23} value={regras.horaInicio} onChange={(e) => updateRegras({ horaInicio: Number(e.target.value) || 8 })} />
            </Field>
            <Field label="Hora fim">
              <Input type="number" min={1} max={24} value={regras.horaFim} onChange={(e) => updateRegras({ horaFim: Number(e.target.value) || 18 })} />
            </Field>
          </div>
        </div>

        <Field label="Dias úteis da semana">
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAYS_SHORT.map((w, idx) => {
              const on = regras.diasSemana.includes(idx);
              return (
                <button
                  key={idx}
                  onClick={() => toggleDiaSemana(idx)}
                  className={cn(
                    "h-9 px-3 rounded-md border text-xs font-medium transition",
                    on ? "bg-primary text-primary-foreground border-transparent" : "bg-background hover:bg-muted",
                  )}
                >
                  {w}
                </button>
              );
            })}
          </div>
        </Field>
      </div>

      <div className="rounded-lg border bg-card p-3 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Alert02Icon} className="size-4 text-amber-500" />
            <h4 className="text-sm font-semibold">Pergunte para mim</h4>
          </div>
          <button
            onClick={() => updateRegras({ pergunteFeriados: !regras.pergunteFeriados })}
            className={cn(
              "relative h-6 w-11 rounded-full transition",
              regras.pergunteFeriados ? "bg-emerald-500" : "bg-muted",
            )}
            aria-pressed={regras.pergunteFeriados}
            aria-label="Ativar Pergunte para mim"
          >
            <span
              className={cn(
                "absolute top-0.5 size-5 rounded-full bg-background transition-all",
                regras.pergunteFeriados ? "left-0.5" : "left-0.5",
                regras.pergunteFeriados && "translate-x-5",
              )}
            />
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Se ativo, o sistema lança um alerta na tela com{" "}
          <strong>{regras.antecedenciaFeriadosMeses} meses de antecedência</strong>{" "}
          avisando sobre feriados futuros e calcula as emendas (seg/sex/sáb)
          conforme seus dias úteis.
        </p>

        {regras.pergunteFeriados && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Feriados na janela de antecedência
            </span>
            {feriadosJanela.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Nenhum feriado no período.</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {feriadosJanela.map((f) => {
                  const d = parseDateKey(f.data);
                  const diaSemana = WEEKDAYS_SHORT[d.getDay()];
                  const emenda = descricaoEmenda(d, regras.diasSemana);
                  return (
                    <li key={f.data} className="rounded-md border bg-muted/30 p-2 text-xs flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span className="font-medium">{f.nome}</span>
                      <span className="text-muted-foreground">
                        · {d.getDate().toString().padStart(2, "0")} {MONTHS[d.getMonth()].slice(0, 3)} · {diaSemana}
                      </span>
                      {emenda && (
                        <span className="ml-auto text-[11px] text-amber-600 dark:text-amber-400">
                          {emenda}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Calcula a pergunta de emenda conforme dias úteis.
function descricaoEmenda(diaFeriado: Date, diasSemana: number[]): string | null {
  const ds = diaFeriado.getDay();
  const terca = ds === 2;
  const quinta = ds === 4;
  const sexta = ds === 5;

  if (terca && !diasSemana.includes(0) && diasSemana.includes(1)) {
    return "Emendar segunda?";
  }
  if (quinta && diasSemana.includes(5)) {
    return "Emendar sexta?";
  }
  if (sexta && diasSemana.includes(6)) {
    return "Trabalhar sábado?";
  }
  return null;
}

// ============================================================
// Helpers locais
// ============================================================
function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1", className)}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

void Tick01Icon;
