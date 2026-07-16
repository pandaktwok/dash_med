"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Certificate01Icon,
  PrescriptionIcon,
  PrinterIcon,
  ShieldKeyIcon,
  Tick01Icon,
  Add01Icon,
  Delete01Icon,
  WhatsappIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { useProntuarioStore } from "@/store/prontuario-store";
import { useConfigStore } from "@/store/config-store";
import { pacientesIniciais } from "@/mock-data/pacientes";
import type { MedicamentoFrequente } from "@/mock-data/config";

const GOVBR_ASSINATURA_URL = "https://www.gov.br/pt-br/servicos/assinar-documento-digital";

interface MedItem {
  nome: string;
  dosagem: string;
  orientacao: string;
}

export function DocumentoDrawer() {
  const drawerOpen = useProntuarioStore((s) => s.drawerOpen);
  const drawerTipo = useProntuarioStore((s) => s.drawerTipo);
  const closeDrawer = useProntuarioStore((s) => s.closeDrawer);
  const pacienteId = useProntuarioStore((s) => s.pacienteId);
  const activeConsultaId = useProntuarioStore((s) => s.activeConsultaId);
  const pacientes = useProntuarioStore((s) => s.pacientes);
  const addDocumento = useProntuarioStore((s) => s.addDocumento);
  const updateConsulta = useProntuarioStore((s) => s.updateConsulta);

  const modelos = useConfigStore((s) => s.modelos);
  const templatesAtestado = useConfigStore((s) => s.templatesAtestado);
  const medicamentosFrequentes = useConfigStore((s) => s.medicamentosFrequentes);

  const paciente = useMemo(
    () => pacientes.find((p) => p.id === pacienteId) ?? null,
    [pacientes, pacienteId],
  );
  const consulta = useMemo(
    () => paciente?.consultas.find((c) => c.id === activeConsultaId) ?? null,
    [paciente, activeConsultaId],
  );

  // Campos do atestado
  const [texto, setTexto] = useState("");
  const [dias, setDias] = useState(1);
  const [templateId, setTemplateId] = useState<string>("");

  // Campos da receita
  const [medItems, setMedItems] = useState<MedItem[]>([]);
  const [busca, setBusca] = useState("");

  const modelo = useMemo(
    () => modelos.find((m) => m.tipo === drawerTipo) ?? null,
    [modelos, drawerTipo],
  );

  // Reset/seed quando abre
  useEffect(() => {
    if (!drawerOpen) return;
    if (drawerTipo === "atestado") {
      const t = templatesAtestado[0];
      setTemplateId(t?.id ?? "");
      setTexto(t?.texto ?? "");
      setDias(1);
    } else if (drawerTipo === "receita") {
      setMedItems([]);
      setBusca("");
    }
  }, [drawerOpen, drawerTipo, templatesAtestado]);

  const sugestoesMed = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return medicamentosFrequentes.slice(0, 5);
    return medicamentosFrequentes.filter((m) =>
      m.nome.toLowerCase().includes(q) || m.dosagem.toLowerCase().includes(q),
    );
  }, [busca, medicamentosFrequentes]);

  // Todos os hooks precisam rodar antes de qualquer early return: com o return
  // acima do useMemo, fechar o drawer mudava a contagem de hooks entre renders
  // e o React quebrava com "Rendered fewer hooks than expected".
  if (!drawerTipo) return null;

  const tipoDoc: "atestado" | "receita" = drawerTipo;

  const dataAtual = new Date();
  const dataFmt = dataAtual.toLocaleDateString("pt-BR");

  function aplicarTemplate(id: string) {
    setTemplateId(id);
    const t = templatesAtestado.find((x) => x.id === id);
    if (t) setTexto(t.texto);
  }

  function addMed(m: MedicamentoFrequente | MedItem) {
    setMedItems((arr) => [...arr, { nome: m.nome, dosagem: m.dosagem, orientacao: m.orientacao }]);
    setBusca("");
  }

  function removeMed(i: number) {
    setMedItems((arr) => arr.filter((_, j) => j !== i));
  }

  function gerarConteudo(): string {
    if (tipoDoc === "atestado") {
      return [
        modelo?.cabecalho ?? "",
        "",
        `ATESTADO MÉDICO — ${paciente?.nome ?? ""}`,
        `Data: ${dataFmt}`,
        "",
        texto,
        "",
        `Dias de afastamento: ${dias}`,
        "",
        modelo?.rodape ?? "",
      ]
        .filter(Boolean)
        .join("\n");
    }
    return [
      modelo?.cabecalho ?? "",
      "",
      `RECEITA MÉDICA — ${paciente?.nome ?? ""}`,
      `Data: ${dataFmt}`,
      "",
      ...medItems.map((m, i) => `${i + 1}. ${m.nome} ${m.dosagem} — ${m.orientacao}`),
      "",
      modelo?.rodape ?? "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  function salvarNoProntuario() {
    if (!paciente || !consulta) return;
    const slug = (paciente.nome.replace(/\s/g, "") || "pac").toLowerCase();
    const conteudo = gerarConteudo();
    // O documento gerado referencia o PDF timbrado em branco (papel timbrado)
    // como base; a automação n8n/WhatsApp usa `modeloBase` para buscar o
    // template e `url` para o arquivo final preenchido.
    const doc = addDocumento(paciente.id, consulta.id, {
      tipo: tipoDoc,
      url: `https://docs.n8n.whatsapp/${tipoDoc}/${slug}-${consulta.data}-${Date.now()}.pdf?base=${encodeURIComponent(modelo?.pdfUrl ?? "")}`,
      geradoEm: new Date().toISOString(),
      conteudo,
      diasAfastamento: tipoDoc === "atestado" ? dias : undefined,
    });
    if (tipoDoc === "receita" && medItems.length > 0) {
      updateConsulta(paciente.id, consulta.id, {
        medicamentos: [...consulta.medicamentos, ...medItems],
      });
    }
    void doc;
    closeDrawer();
  }

  function imprimir() {
    // Abre o PDF timbrado em branco (papel timbrado) como base da impressão.
    // O conteúdo variável (paciente, data, texto, medicamentos) é exibido em
    // uma janela auxiliar para o médico copiar/colar por cima do timbrado, já
    // que o browser não consegue sobrepor HTML diretamente no PDF sem libs.
    if (modelo?.pdfUrl) {
      const pdfWin = window.open(modelo.pdfUrl, "_blank");
      if (pdfWin) {
        pdfWin.addEventListener("load", () => {
          try {
            pdfWin.print();
          } catch {
            // alguns navegadores bloqueiam print em PDF embutido
          }
        });
      }
    }
    // Janela com os dados variáveis para conferência/cópia.
    const conteudo = gerarConteudo();
    const w = window.open("", "_blank", "width=520,height=720");
    if (!w) return;
    w.document.write(
      `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Dados do documento</title>
      <style>
        body{font-family:monospace;white-space:pre-wrap;padding:24px;max-width:520px;margin:0 auto;color:#111}
        .hint{font-family:system-ui;font-size:12px;color:#666;border:1px dashed #ccc;padding:8px;border-radius:6px;margin-bottom:16px}
      </style></head><body>
      <div class="hint">Papel timbrado (PDF) aberto em outra janela. Use os dados abaixo para preencher sobre o timbrado e imprimir.</div>
      <pre>${conteudo.replace(/[<>]/g, (c) => (c === "<" ? "&lt;" : "&gt;"))}</pre>
      </body></html>`,
    );
    w.document.close();
    w.focus();
  }

  return (
    <Sheet open={drawerOpen} onOpenChange={(o) => !o && closeDrawer()}>
      <SheetContent side="right" className="w-[460px] max-w-full sm:max-w-[480px] flex flex-col gap-0">
        <SheetHeader className="border-b">
          <SheetTitle className="text-base flex items-center gap-2">
            <HugeiconsIcon
              icon={drawerTipo === "atestado" ? Certificate01Icon : PrescriptionIcon}
              className={cn(
                "size-4",
                drawerTipo === "atestado" ? "text-amber-500" : "text-emerald-500",
              )}
            />
            {drawerTipo === "atestado" ? "Gerar Atestado Médico" : "Gerar Receita"}
          </SheetTitle>
          <SheetDescription className="text-xs">
            Modelo em branco (papel timbrado) e dados do paciente carregados
            automaticamente. Ajuste o conteúdo e salve no prontuário para a
            automação do WhatsApp.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {/* Modelo PDF timbrado em branco (papel timbrado) */}
          {modelo?.pdfUrl && (
            <div className="rounded-md border bg-muted/30 p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs">
                <HugeiconsIcon
                  icon={drawerTipo === "atestado" ? Certificate01Icon : PrescriptionIcon}
                  className={cn(
                    "size-4 shrink-0",
                    drawerTipo === "atestado" ? "text-amber-500" : "text-emerald-500",
                  )}
                />
                <span className="font-medium">
                  {drawerTipo === "atestado" ? "Atestado em branco (timbrado)" : "Receituário em branco (timbrado)"}
                </span>
                <a
                  href={modelo.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto inline-flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-[11px] hover:bg-muted"
                >
                  Abrir PDF
                </a>
              </div>
              <object
                data={modelo.pdfUrl}
                type="application/pdf"
                className="w-full h-40 rounded-md border bg-background"
                aria-label="Pré-visualização do papel timbrado"
              >
                <span className="text-[11px] text-muted-foreground p-2 block">
                  Não foi possível exibir o PDF.{" "}
                  <a href={modelo.pdfUrl} target="_blank" rel="noreferrer" className="underline">
                    Abrir em nova aba
                  </a>
                </span>
              </object>
            </div>
          )}

          {/* Cabeçalho do modelo (texto) */}
          {modelo && (
            <div className="rounded-md border bg-muted/30 p-3 text-[11px] text-muted-foreground whitespace-pre-line">
              {modelo.cabecalho}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Paciente</span>
              <div className="font-medium">{paciente?.nome ?? "—"}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Data</span>
              <div className="font-medium">{dataFmt}</div>
            </div>
          </div>

          {drawerTipo === "atestado" ? (
            <>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Texto padrão (template)
                </span>
                <select
                  value={templateId}
                  onChange={(e) => aplicarTemplate(e.target.value)}
                  className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm shadow-xs outline-none dark:bg-input/30"
                >
                  <option value="">— selecionar —</option>
                  {templatesAtestado.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.titulo || "(sem título)"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Texto principal
                </span>
                <textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  rows={6}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Número de dias de afastamento
                </span>
                <Input
                  type="number"
                  min={1}
                  value={dias}
                  onChange={(e) => setDias(Math.max(1, Number(e.target.value) || 1))}
                  className="w-28"
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Buscar medicamento frequente
                </span>
                <Input
                  placeholder="Digite para autocompletar..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
                {sugestoesMed.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {sugestoesMed.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => addMed(m)}
                        className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] hover:bg-muted transition"
                      >
                        <HugeiconsIcon icon={Add01Icon} className="size-3" />
                        {m.nome} {m.dosagem}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Medicamentos da receita
                </span>
                {medItems.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    Adicione medicamentos acima.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {medItems.map((m, i) => (
                      <li
                        key={i}
                        className="rounded-md border bg-background p-2 text-xs flex items-start gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{m.nome} {m.dosagem}</div>
                          <div className="text-muted-foreground">{m.orientacao}</div>
                        </div>
                        <button
                          onClick={() => removeMed(i)}
                          className="text-muted-foreground hover:text-rose-500 p-0.5"
                          aria-label="Remover"
                        >
                          <HugeiconsIcon icon={Delete01Icon} className="size-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}

          {/* Pré-visualização compacta */}
          <details className="rounded-md border bg-muted/20 p-2">
            <summary className="text-xs font-medium cursor-pointer">Pré-visualização</summary>
            <pre className="mt-2 text-[10px] whitespace-pre-wrap text-muted-foreground">
              {gerarConteudo()}
            </pre>
          </details>
        </div>

        <SheetFooter className="border-t flex-row flex-wrap gap-2">
          <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={imprimir}>
            <HugeiconsIcon icon={PrinterIcon} className="size-4" />
            Imprimir
          </Button>
          <a href={GOVBR_ASSINATURA_URL} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm" className="h-9 gap-1.5">
              <HugeiconsIcon icon={ShieldKeyIcon} className="size-4 text-blue-500" />
              Assinar via GOV.BR
            </Button>
          </a>
          <Button
            size="sm"
            className="h-9 gap-1.5 bg-primary hover:bg-primary/90 ml-auto"
            onClick={salvarNoProntuario}
            disabled={drawerTipo === "atestado" ? !texto.trim() : medItems.length === 0}
          >
            <HugeiconsIcon icon={Tick01Icon} className="size-4" />
            Salvar no Prontuário
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// Evita warning de import não usado em alguns bundlers.
void pacientesIniciais;
void WhatsappIcon;
