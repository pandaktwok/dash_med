# Relatório de Avaliação — Dashboard Médico

**Data:** 14/07/2026
**Referência:** "Dashboard Médico — Arquitetura Geral & Plano de Integração" (Notion)
**Escopo:** avaliação do estado real do `dash_med` contra o plano, e o que falta fazer.

---

## Sumário Executivo

O plano e o código divergiram **em duas direções opostas ao mesmo tempo**:

1. **O Notion subestima a UI.** O doc marca os 7 módulos como 🔴 Não iniciado. Na prática, Prontuário, Agenda e Pacientes estão substancialmente construídos e funcionais — inclusive a regra de emenda de feriado com antecedência de 2 meses que o doc descreve como futura.
2. **O Notion superestima o backend.** Não existe backend. Zero `fetch()` no projeto. Zero imports de `PrismaClient`. Todo o estado vive em Zustand volátil — **F5 apaga tudo**.
3. **Divergência de plataforma.** O doc especifica app desktop local (Electron/Tauri); o código é um web app Next.js.

**Resumo: UI ~70% pronta, backend em 0%.**

**Decisão de arquitetura adotada:** empacotar a UI atual em **Tauri/Electron**. Preserva o trabalho já feito, atende o requisito local-first do doc (dado clínico nunca sai da máquina — LGPD) e viabiliza o instalador "next, next, finish".

---

## 1. Diagnóstico por Módulo

| Módulo (Notion) | Status no doc | Status real | Gap |
|---|---|---|---|
| 1. Dashboard Hub | 🔴 Não iniciado | 🟡 Navegação pronta; sem auth, sem licença | Auth + licenciamento |
| 2. Cadastro de Pacientes | 🔴 Não iniciado | 🟡 UI pronta; sem CPF, sem endereço, sem persistência | Campos + DB |
| 3. Atendimento/Prontuário | 🔴 Não iniciado | 🟢 Muito completo | Só persistência |
| 4. Gerador de PDF | 🔴 Não iniciado | 🔴 **Falso positivo** — preview real, geração fake | Motor de PDF real |
| 5. Agenda | 🔴 Não iniciado | 🟢 3 views, feriados, emenda | Persistência + Google Calendar |
| 6. Assistente WhatsApp | 🔴 Não iniciado | 🔴 Kanban mock + stub sem lógica | Tudo |
| 7. Licenciamento/SaaS | 🔴 Não iniciado | 🔴 Nada | Tudo |

### Três coisas que parecem prontas e não estão

**O gerador de PDF não gera PDF.** `imprimir()` em `documento-drawer.tsx` abre o timbrado em branco numa aba e uma *segunda* janela com o texto em `<pre>` para copiar por cima. Não há sobreposição. `salvarNoProntuario()` fabrica URLs em `https://docs.n8n.whatsapp/...` — **domínio inexistente**.

**A Configuração não configura.** `config-store.regras` (duração da consulta, dias, horários) **não afeta o calendário**, que usa `PERIODO_ATENDIMENTO` e `ANTECEDENCIA_MESES` hardcoded. O médico mexe e nada acontece.

**O webhook OpenClaw não persiste nada.** `app/api/webhooks/openclaw/route.ts` (48 linhas) faz `switch` em 4 ações e retorna `success: true` sem gravar. O `payload` é extraído e ignorado; a lógica Prisma está toda comentada; `GET_CONVERSATION` devolve `[]` fixo. Sem autenticação, sem validação.

### Divergências que precisam de decisão

| Tema | Conflito | Resolução |
|---|---|---|
| Web vs. Desktop | Doc diz desktop, código é web | ✅ Tauri sobre o Next.js |
| Banco | Código usa SQLite; planos antigos no git pedem Postgres | ✅ SQLite — é o que o Notion pede (banco local) e o que já existe |
| **Provedor WhatsApp** | `plano-1.md` → Evolution API; `planoGoogle.md` → Z-API; código → "OpenClaw"; Notion → OpenClaw + n8n | ❌ **Em aberto.** O Notion resolve a camada conversacional (OpenClaw), mas não como a mensagem chega do WhatsApp ao n8n. **Bloqueia a Etapa 4.** |

---

## 2. Seções do Programa e suas Integrações

### 2.1 Hub / Shell — Módulo 1
**Arquivos:** `app/page.tsx`, `components/dashboard/sidebar.tsx`, `header.tsx`, `store/dashboard-store.ts`
**Integrações externas:** API de licenciamento (heartbeat diário, HTTP REST)
**A fazer:** shell Tauri + instalador; auth local; ler `features` da licença para habilitar módulos.

### 2.2 Pacientes — Módulo 2
**Arquivos:** `pacientes-content.tsx`, `store/prontuario-store.ts`, `mock-data/pacientes.ts`
**Integrações:** banco local (query direta); n8n grava aqui quando o cadastro vem da IA
**A fazer:** adicionar CPF, endereço e nascimento real (hoje é gerado por fórmula: `19${70+(i%20)}-...`); criar formulário de cadastro (não existe); trocar seed mock por Prisma.

### 2.3 Prontuário — Módulo 3
**Arquivos:** `prontuario-modal.tsx`, `store/prontuario-store.ts`
**Integrações:** banco local apenas. **Dado clínico nunca sai da máquina.**
**A fazer:** só persistência. A lógica de fluxo (`proximaCategoria`, `labelTipo`) é real — **reaproveitar, não reescrever**.

### 2.4 Documentos / PDF — Módulo 4
**Arquivos:** `documento-drawer.tsx`, `mock-data/config.ts`, PDFs em `public/`
**Integrações:** gerador local (sem rede); GOV.BR (assinatura — hoje só um link genérico)
**A fazer:** motor real (`pdf-lib`) sobrepondo texto no timbrado; coordenadas X/Y configuráveis; salvar em disco.

### 2.5 Agenda — Módulo 5
**Arquivos:** `calendario-content.tsx` (1.491 linhas), `store/calendario-store.ts`, `mock-data/calendario.ts`
**Integrações:** Google Calendar (OAuth2, **só blocos de horário, nunca dado clínico**); n8n consulta antes de confirmar
**A fazer:** persistência; ligar `config-store.regras`; feriados além de 2026-27; sync bidirecional.

### 2.6 WhatsApp / IA — Módulo 6 ⭐ equipe
**Arquivos:** `whats-content.tsx`, `app/api/webhooks/openclaw/route.ts`
**Integrações:** WhatsApp → Cloudflare Tunnel → n8n → OpenClaw → n8n → DB / Google Calendar
**A fazer:** tudo. **O flag `iaPausada` (Prisma `Conversa` + UI) já modela a interrupção pelo médico — é o ativo mais valioso que existe aqui.** Preservar.

### 2.7 Configuração — transversal
**Arquivos:** `config-content.tsx`, `store/config-store.ts`
**A fazer:** persistir; **ligar `regras` ao calendário**.

### 2.8 Licenciamento — Módulo 7
**Integrações:** servidor de licenças na nuvem (REST, heartbeat diário)
**A fazer:** tudo — servidor + cliente + bloqueio preventivo após X dias sem validar.

---

## 3. Etapas de Execução

### Etapa 0 — Correções (sem dependências)

| # | Arquivo | Problema |
|---|---|---|
| 1 | `documento-drawer.tsx:90` | **Bug real.** `return null` antes do `useMemo` da linha 97 → violação das Rules of Hooks; quebra ao fechar o drawer |
| 2 | `mock-data/pacientes.ts:126` | `toDateKey(addDays(hoje, 0))` achata as 3 datas para hoje |
| 3 | `store/prontuario-store.ts:105` | Condição inalcançável em `openByConsulta` |
| 4 | `mock-data/calendario.ts:94` | Telefones com `Math.random()` em module scope |
| 5 | `lib/status.ts` | `legendaCores` omite "realizado" e "pendente", que aparecem no calendário |

### Etapa 1 — Persistência (fundação de tudo)
- Expandir `prisma/schema.prisma`: `Compromisso`, `FeriadoConfig`, `ConsultaProntuario`, `Documento`, `MedicamentoPrescrito`, `Profissional`, `Usuario`. Adicionar CPF/endereço/nascimento em `Paciente`.
- **Corrigir `Agendamento.data`/`hora`** — hoje são `String`. Migrar para `DateTime` com timezone. Bomba-relógio conhecida.
- Criar `lib/prisma.ts` (não existe); gerar o client; sair de `db push` para `migrate` (não há `_prisma_migrations` no `dev.db` — histórico de schema não versionado); criar seed a partir dos mocks; adicionar scripts npm.
- Trocar seeds dos stores por chamadas de API. **Manter a forma dos stores** — toda a UI depende deles.

### Etapa 2 — Shell Desktop + Auth + Config real
Tauri + instalador; auth local; ligar `regras` ao calendário.

### Etapa 3 — Gerador de PDF real
`pdf-lib` sobrepondo no timbrado; remover o hack de duas janelas.

### Etapa 4 — WhatsApp / IA ⭐ equipe (paralelo a partir da Etapa 1)
**Pré-requisito: decidir o provedor de conexão.** n8n via Docker; Cloudflare Tunnel; implementar o webhook de fato (auth por assinatura, validação zod, Prisma). Preservar `iaPausada`.

### Etapa 5 — Google Calendar
OAuth2; sync bidirecional; só blocos de horário.

### Etapa 6 — Licenciamento
Servidor REST; heartbeat; `features` habilitam Financeiro/CRM.

---

## 4. Remoções Propostas (com justificativa)

| Remover | Onde | Por quê |
|---|---|---|
| Dropdown de workspaces | `sidebar.tsx` | "Equipe de Marketing", "Estúdio de Design", "Criar Espaço de Trabalho" — resquício do template Square UI. Modela um SaaS multi-workspace que **contradiz** "roda localmente na máquina do médico". Nenhum item tem `onClick`. |
| `FeriadosPanel` | `calendario-content.tsx:572` | Componente inteiro nunca renderizado. Substituído pelo `FeriadoPopover`, que funciona. Arrasta 4 campos órfãos do store. |
| Estado morto | vários stores | `alertaHorarioId` (nunca setado), `reset()`, `clearFilters`, `addConsulta`, `performanceScore`, `performanceChange`, `lastUpdated` — zero consumidores. |
| Deps não usadas | `package.json` | `@modelcontextprotocol/sdk`, `hono`, `js-yaml`, `diff` — zero imports; vieram de `pnpm.overrides`, não foram escolhidas para o produto. |
| URLs `docs.n8n.whatsapp` | `mock-data/pacientes.ts`, `documento-drawer.tsx` | Domínio **inexistente**. Pior que código morto: *parece* integração e não é. Substituir por caminho de arquivo local. |

### Manter, apesar de parecerem candidatos

- **Financeiro / CRM** — o módulo 7 do Notion os cita explicitamente como módulos licenciáveis ("básico, CRM, financeiro"). Viram feature-flags, não lixo.
- **`iniciadoEm`** (`atendimento-store.ts`) — nunca lido, mas duração da consulta é dado útil. **Ligar, não apagar.**
- **Metadata "Painel Taskplus - Square UI"** (`app/layout.tsx`) — corrigir, não remover.

---

## 5. Comparação de LLMs (Módulo 6)

### Correção de premissa

A nota do Notion lista **"suporte a interrupção de sessão"** como critério de escolha do provedor. **Isso não é um recurso de LLM.** Interrupção é resolvida na sua camada: o flag `iaPausada` (Prisma `Conversa` + `whats-content.tsx`) já modela exatamente isso — o n8n checa antes de responder. Todo provedor "suporta" igualmente. O critério não discrimina nada e foi removido da comparação.

### Custo por 1.000 mensagens

Estimativa: ~1.500 tokens de entrada (com histórico) + ~150 de saída por mensagem. **Sem cache.** Preços de julho/2026.

| Provedor / Modelo | Entrada $/M | Saída $/M | ~1k msgs |
|---|---|---|---|
| Gemini 3.1 Flash-Lite | $0.25 | $1.50 | **~$0.60** |
| Claude Haiku 4.5 | $1.00 | $5.00 | ~$2.25 |
| GPT-5.6 Luna | $1.00 | $6.00 | ~$2.40 |
| Gemini 3.5 Flash | $1.50 | $9.00 | ~$3.60 |
| GPT-5.6 Terra | $2.50 | $15.00 | ~$6.00 |
| Claude Sonnet 5 | $3.00 (promo $2 até 31/08) | $15.00 (promo $10) | ~$6.75 (promo ~$4.50) |
| Claude Opus 4.8 | $5.00 | $25.00 | ~$11.25 |
| GPT-5.6 Sol | $5.00 | $30.00 | ~$12.00 |

**Cache muda o jogo — com uma pegadinha.** Leitura de cache custa ~10% da entrada; com prompt de sistema estável o custo real cai 60-80%. **Porém**: o prefixo mínimo cacheável do Haiku 4.5 e do Opus 4.8 é **4.096 tokens**. Um prompt de clínica de ~1.000 tokens **não cacheia e falha em silêncio** (`cache_creation_input_tokens: 0`, sem erro). Quem planeja economia com cache nesse cenário planeja errado.

**NVIDIA NIM — não incluído.** É infraestrutura de inferência cobrada por GPU-hora, não por token; não cabe na mesma tabela. Requer pesquisa dedicada.

### Recomendação

Começar com **Claude Haiku 4.5** ou **Gemini 3.1 Flash-Lite** para triagem e agendamento — a conversa é roteirizada e não precisa de modelo caro. Escalar para **Sonnet 5** nos casos que a triagem não resolve.

**Humanização vem muito mais do prompt e do design de fluxo** (múltiplas camadas, evitar loops) **do que da escolha de provedor.** O orçamento de esforço deveria refletir isso.

---

## 6. Como Verificar Cada Etapa

| Etapa | Teste |
|---|---|
| 0 | Abrir prontuário → "Gerar Atestado" → fechar o drawer. Hoje quebra; depois não. |
| 1 | Criar paciente → **F5** → paciente continua lá. **O teste definitivo.** |
| 2 | Mudar duração da consulta em Configurações → slots do calendário mudam. |
| 3 | Gerar receita → abrir o PDF → texto sobreposto no timbrado, alinhado. |
| 4 | Mensagem no WhatsApp → paciente aparece no kanban; "Intervir" → IA para de responder. |
| 5 | Criar consulta → bloco aparece no Google Calendar, sem dado clínico. |
| 6 | Licença inativa → módulos bloqueiam. |

---

## 7. Ordem e Paralelismo

```
Etapa 0 ──► Etapa 1 ──┬──► Etapa 2 ──► Etapa 3
 (bugs)   (persistência)│                (PDF)
                        ├──► Etapa 4 ⭐ equipe  [requer decisão do provedor]
                        ├──► Etapa 5 (Google Calendar)
                        └──► Etapa 6 (Licenciamento)
```

**Etapa 0 → Etapa 1 são pré-requisito de tudo.** Nada mais faz sentido enquanto F5 apagar os dados.

---

## Pendências

1. **Provedor de conexão do WhatsApp** — bloqueia a Etapa 4. Evolution API, Z-API ou Cloud API oficial?
2. **NVIDIA NIM** — pesquisa de custo dedicada, se ainda for de interesse.
3. **Fluxo detalhado das automações** — o Notion pede explicitamente para deixar para depois. Mantido fora do escopo.
