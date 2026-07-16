# Continuar Aqui — estado do trabalho

> Arquivo de handoff para retomar o trabalho em outra máquina.
> **Última atualização:** 15/07/2026 · **Branch:** `etapa-0-correcoes`

---

## Onde paramos

**Etapa 0 do plano de ação está CONCLUÍDA e verificada.** As 5 correções foram aplicadas e testadas. Nada foi commitado antes deste ponto — o trabalho todo estava no working tree.

**Próximo passo: Etapa 1 — Persistência.**

---

## Contexto do projeto (leia antes de continuar)

O `dash_med` é um dashboard médico que deve rodar **localmente na máquina do médico** — dado clínico nunca sai (LGPD). A IA do WhatsApp (OpenClaw) é o único componente externo e fica com uma equipe dedicada.

**Fonte de verdade do escopo:** página do Notion "Dashboard Médico — Arquitetura Geral & Plano de Integração".
**Avaliação completa do código vs. plano:** [`relatorio-avaliacao.md`](relatorio-avaliacao.md) na raiz. **Leia esse arquivo primeiro.**

### Diagnóstico em uma frase

A UI está ~70% pronta; o backend está em **0%**. Nenhum store usa `persist` — **F5 apaga tudo**. O Notion marca os 7 módulos como "não iniciado", o que está errado nos dois sentidos: subestima a UI (Prontuário, Agenda e Pacientes estão construídos) e superestima o backend (não existe).

### Decisões já tomadas

| Tema | Decisão |
|---|---|
| Arquitetura | **Tauri/Electron sobre o Next.js atual** — preserva a UI, atende o local-first. Não reescrever nativo. |
| Banco | **SQLite local** — é o que o Notion pede e o que já existe. Os planos antigos pedem Postgres e estão **obsoletos** (ver nota abaixo). |
| Google Calendar | Recebe **apenas blocos de horário**, nunca dado clínico. |
| Financeiro / CRM | **Não deletar.** Parecem placeholders mortos, mas são módulos licenciáveis do módulo 7 do Notion. Viram feature-flags. |
| Comparação de LLMs | Feita — ver seção 5 do relatório. Recomendação: Haiku 4.5 ou Gemini 3.1 Flash-Lite para triagem, escalando para Sonnet 5. |
| Idioma | Todas as interações em **português**. |

> **Nota sobre os planos antigos.** `plano-1.md` e `planoGoogle.md` foram removidos do working tree, mas continuam no histórico do git. Para consultar:
> ```bash
> git show b3654f0:plano-1.md
> git show b3654f0:planoGoogle.md
> ```
> Eles estão **obsoletos** — pedem Postgres, divergem entre si sobre o provedor de WhatsApp (Evolution API vs. Z-API) e antecedem a decisão pelo Tauri. Valem só como registro histórico. O `relatorio-avaliacao.md` os substitui.

---

## O que foi feito nesta sessão (Etapa 0)

As 5 correções, todas verificadas:

| # | Arquivo | O que mudou | Verificação |
|---|---|---|---|
| 1 | `components/dashboard/documento-drawer.tsx` | Movido o `if (!drawerTipo) return null` para **depois** do `useMemo` de `sugestoesMed`. Era violação das Rules of Hooks — quebrava ao fechar o drawer. | Estático: hooks nas linhas 40–90, early return na 101 |
| 2 | `mock-data/pacientes.ts` | `addDays(hoje, diaIdx)` em vez de `addDays(hoje, 0)` — as 3 datas de `atendimentosPorDia` estavam sendo achatadas em uma só. | Script: 3 datas distintas confirmadas |
| 3 | `store/prontuario-store.ts` | Removido o `consultaId ??` que tornava o `find` inalcançável em `openByConsulta`. | Script: id válido e inválido testados |
| 4 | `mock-data/calendario.ts` | Telefone derivado do índice em vez de `Math.random()` em module scope. | Script: 10 telefones únicos e determinísticos |
| 5 | `lib/status.ts` | Adicionados "realizado" e "pendente" ao `legendaCores` — apareciam no calendário mas não na legenda. | Script: 5/5 status cobertos |

**Estado da verificação:** `npx tsc --noEmit` passa limpo. App compila e serve HTTP 200.

### ⚠️ Duas ressalvas importantes

**1. O bug #1 não foi testado clicando.** Não havia automação de browser na sessão. A correção foi provada estaticamente (a causa era hook depois de early return; não há mais nenhum), mas o teste de interação real ainda não foi feito:

```
npm run dev → abrir prontuário → "Gerar Atestado" → fechar o drawer
```

Se não quebrar, está confirmado.

**2. O ESLint está quebrado — e é pré-existente.** `npm run lint` estoura com `Converting circular structure to JSON` no plugin `react`. Confirmado guardando todas as mudanças e rodando de novo: quebra igual. O stack trace mostra falha no *carregamento da config* (`_loadExtendedShareableConfig`), antes de qualquer arquivo ser lido. **Não foi causado pelas correções.** Vale um PR separado.

---

## Próximo passo: Etapa 1 — Persistência

> **Esta é a etapa mais importante do plano inteiro.** Enquanto F5 apagar os dados, nada mais importa.

### 1.1 — Schema (~2 dias)

Expandir `prisma/schema.prisma`. Hoje tem só 3 modelos rasos (`Paciente`, `Agendamento`, `Conversa`), muito aquém do que a UI já exercita.

- **Adicionar:** `Compromisso`, `FeriadoConfig`, `ConsultaProntuario`, `Documento`, `MedicamentoPrescrito`, `Profissional`, `Usuario`
- **Expandir `Paciente`:** CPF, endereço, nascimento (hoje o nascimento é gerado por fórmula no mock: `19${70+(i%20)}-...`)
- **Corrigir `Agendamento.data` e `.hora`:** hoje são `String`. Migrar para `DateTime` com timezone. **Fazer agora**, antes de existir dado real para migrar.

Usar os tipos de `mock-data/pacientes.ts` como referência — eles já modelam o domínio real (`ConsultaProntuario`, `MedicamentoPrescrito`, `DocumentoRef`).

### 1.2 — Infra Prisma (~1 dia)

- Criar `lib/prisma.ts` — **não existe**. Nenhuma linha do código importa `PrismaClient` hoje.
- `prisma generate` — o client nunca foi gerado (`lib/generated/prisma` está no `.gitignore` mas não existe)
- **Sair de `db push` para `migrate`.** O `dev.db` foi criado com `db push` — confirmado: não há tabela `_prisma_migrations`. O histórico de schema não está versionado.
- Seed a partir dos mocks atuais
- Scripts npm: `db:migrate`, `db:seed`, `db:studio` — hoje o `package.json` só tem `dev`, `build`, `start`, `lint`

> **A partir daqui a equipe do OpenClaw destrava.** Não precisa esperar a Etapa 1 terminar — mas precisa da decisão do provedor (ver pendências).

### 1.3 — Rotas de API (~2 dias)

`/api/pacientes`, `/api/consultas`, `/api/compromissos`, `/api/config` — CRUD.

Hoje só existe `app/api/webhooks/openclaw/route.ts`, que é um **stub**: faz `switch` em 4 ações e retorna `success: true` sem gravar nada. O `payload` é extraído e ignorado; a lógica Prisma está toda comentada; `GET_CONVERSATION` devolve `[]` fixo. Sem auth, sem validação.

### 1.4 — Ligar os stores (~2 dias) ⚠️ **passo arriscado**

Trocar os seeds mock por chamadas de API.

**Manter a forma dos stores.** `prontuario-store`, `calendario-store` e `config-store` são consumidos por 6+ componentes cada. Mudar a interface deles quebra a UI inteira. A lógica de fluxo (`proximaCategoria`, `labelTipo` em `mock-data/pacientes.ts`) é **real** — reaproveitar, não reescrever.

### Como saber que a Etapa 1 acabou

```
Criar paciente → F5 → paciente continua lá.
```

É o teste definitivo.

---

## Mapa do código (levantado nesta sessão)

### Onde os dados vivem hoje

```
mock-data/dashboard.ts  (atendimentosPorDia — raiz de tudo)
    ├──► mock-data/calendario.ts (clientesCatalogo, compromissosIniciais)
    │        ├──► store/calendario-store.ts ──► calendario-content.tsx
    │        └──► mock-data/pacientes.ts (pacientesIniciais)
    │                 └──► store/prontuario-store.ts ──► prontuario-modal, documento-drawer,
    │                                                     pacientes-content, atendimentos-list,
    │                                                     todays-tasks, calendario-content
    ├──► stats-cards, performance-chart, content
    └──► todays-tasks, atendimentos-list

mock-data/config.ts  ──► store/config-store.ts ──► config-content, documento-drawer, prontuario-modal
mock-data/whatsapp.ts ──► whats-content.tsx  (ilha isolada — nomes não batem com o resto do domínio)
```

**5 stores**, nenhum com `persist`, `devtools` ou qualquer middleware. Zero `localStorage`. Tudo volátil.

### Armadilhas conhecidas (não descobrir de novo)

- **`config-store.regras` não afeta o calendário.** O calendário usa `PERIODO_ATENDIMENTO` (de `mock-data/calendario.ts`) e `ANTECEDENCIA_MESES` (hardcoded em `calendario-store.ts`). O médico configura e nada muda. Corrigir na Etapa 2.
- **O gerador de PDF não gera PDF.** `imprimir()` em `documento-drawer.tsx` abre o timbrado numa aba e uma *segunda* janela com o texto em `<pre>` para copiar por cima. Não há sobreposição. Etapa 3.
- **URLs `https://docs.n8n.whatsapp/...`** em `mock-data/pacientes.ts` e `documento-drawer.tsx` — **domínio inexistente**. Parece integração e não é.
- **IDs incompatíveis:** `todayTasks` usa `"1".."5"`, `atendimentosPorDia` usa `"a1".."a10"`, `ConsultaProntuario` usa `"seed-Maria S.-0"`. `atendimento-store` e `prontuario-store` **não se sincronizam** — o elo entre calendário e prontuário é o **nome** do paciente (`openByConsulta`).
- **`feriados` cobre só 2026–2027** (`mock-data/calendario.ts`). Fora dessa janela o sistema de feriados fica vazio.
- **`FeriadosPanel`** (`calendario-content.tsx:572`) é **dead code** — nunca renderizado. Arrasta 4 campos órfãos do store (`feriadoSheet*`).

### Código morto mapeado (remover na Etapa 2)

- Dropdown de workspaces em `sidebar.tsx` ("Equipe de Marketing", "Estúdio de Design") — resquício do template Square UI, contradiz o local-first
- `FeriadosPanel` + `feriadoSheet*` do `calendario-store`
- `atendimento-store`: `alertaHorarioId` (nunca setado), `reset()` (nunca chamado)
- `dashboard-store.clearFilters`, `prontuario-store.addConsulta` — sem consumidor
- Exports mortos: `performanceScore`, `performanceChange`, `lastUpdated` em `mock-data/dashboard.ts`
- Deps sem import: `@modelcontextprotocol/sdk`, `hono`, `js-yaml`, `diff` — vieram de `pnpm.overrides`
- Metadata `"Painel Taskplus - Square UI"` em `app/layout.tsx` — **corrigir**, não remover

**Manter apesar de parecer morto:** `iniciadoEm` (`atendimento-store`) — nunca lido, mas duração da consulta é dado útil. Ligar, não apagar.

---

## Pendências que bloqueiam

### 1. 🔴 Provedor de conexão do WhatsApp — bloqueia a Etapa 4

O Notion resolve a camada conversacional (OpenClaw) mas **não diz como a mensagem sai do WhatsApp e chega no n8n**. Existem quatro respostas conflitantes no projeto: `plano-1.md` diz Evolution API, `planoGoogle.md` diz Z-API, o código diz "OpenClaw", o Notion diz OpenClaw + n8n.

| Opção | A favor | Contra |
|---|---|---|
| **Cloud API oficial** (Meta) | Estável, sem risco de ban, suporte oficial | Verificação do negócio, custo por conversa, template aprovado |
| **Evolution API** | Grátis, self-hosted, combina com o local-first | Não oficial — risco de bloqueio do número |
| **Z-API** | Rápido de subir, suporte BR | Pago, também não oficial |

**Esta é a parte da equipe** — é a que mais se beneficia de rodar em paralelo, e é a que está travada.

### 2. NVIDIA NIM — pesquisa de custo

Ficou fora da comparação de LLMs: é infra de inferência cobrada por GPU-hora, não por token — não cabe na mesma tabela. Requer pesquisa dedicada, se ainda for de interesse.

### 3. Fluxo detalhado das automações

O Notion pede explicitamente para deixar para depois. Mantido fora do escopo.

---

## Setup na nova máquina

```bash
git clone https://github.com/pandaktwok/dash_med
cd dash_med
git checkout etapa-0-correcoes
npm install

# .env NÃO está no git (correto). Recriar:
echo 'DATABASE_URL="file:./dev.db"' > .env

# dev.db também não está no git (é gerado). Recriar:
npx prisma db push     # ou, depois da Etapa 1.2: npx prisma migrate dev

npm run dev            # http://localhost:3000
```

**Notas:**
- `npm run lint` vai falhar — é o problema pré-existente do ESLint descrito acima. Não é você.
- As pastas `.claude/`, `.agents/`, `.gemini/` são tooling de agente instalado localmente, não fazem parte do projeto e não estão no git.

---

## Plano de ação completo

| Etapa | Escopo | Estimativa | Status |
|---|---|---|---|
| **0** | Correções (5 bugs) | 1 dia | ✅ **Concluída** |
| **1** | Persistência — schema, Prisma, API, stores | ~1 semana | ⬅️ **Próxima** |
| **2** | Desktop (Tauri) + Auth + Config real + limpeza | ~1 semana | Pendente |
| **3** | Gerador de PDF real (`pdf-lib`) | ~4 dias | Pendente |
| **4** | WhatsApp / IA ⭐ equipe | — | 🔴 Bloqueada (provedor) |
| **5** | Google Calendar (OAuth2, sync) | ~1 semana | Pendente |
| **6** | Licenciamento / SaaS | ~1 semana | Pendente |

```
Semana 1    │ Etapa 0 ──► Etapa 1.1 ──► 1.2
Semana 2    │ Etapa 1.3 ──► 1.4                    ✅ dados sobrevivem ao F5
Semana 3-4  │ Etapa 2        ║  Etapa 4 (equipe, a partir da 1.2)
Semana 5    │ Etapa 3        ║
Semana 6-7  │ Etapa 5        ║
Semana 8    │ Etapa 6
```

**Etapa 0 → Etapa 1 são pré-requisito de tudo.**

### Como verificar cada etapa

| Etapa | Teste |
|---|---|
| 0 | Abrir prontuário → "Gerar Atestado" → fechar o drawer. Hoje quebra; depois não. |
| 1 | Criar paciente → **F5** → paciente continua lá. **O teste definitivo.** |
| 2 | Mudar duração da consulta em Configurações → slots do calendário mudam. |
| 3 | Gerar receita → abrir o PDF → texto sobreposto no timbrado, alinhado. |
| 4 | Mensagem no WhatsApp → paciente aparece no kanban; "Intervir" → IA para. |
| 5 | Criar consulta → bloco aparece no Google Calendar, sem dado clínico. |
| 6 | Licença inativa → módulos bloqueiam. |
