# Plano 1 — Configuração de Produção — `dash_med` (Dashboard Médico Taskplus)

---

## 1. Visão Geral da Análise

O `dash_med` é atualmente um **front-end 100% client-side** (Next.js 16 + React 19 + TypeScript + Tailwind/shadcn) que roda em uma **única rota** `/` alternando "abas" internas via Zustand (Painel, Whats, Calendário, Financeiro, CRM, Configuração). **Hoje não há backend, banco de dados, autenticação, webhooks ou integrações externas reais** — todos os dados são estáticos (pasta `mock-data/`) e o estado é volátil em memória (perde-se ao recarregar).

Pontos críticos que dependem de configuração externa para sair do mock e funcionar em produção:

| Área | Estado atual | Bloqueador para produção |
|---|---|---|
| **Persistência** | Inexistente (Zustand volátil, sem DB) | Acingente — qualquer dado editado some no refresh |
| **Autenticação** | Inexistente (app pública, usuário "LN" hardcode) | Acingente — sem login não há multiusuário/segurança |
| **WhatsApp** | 100% mock (4 colunas Kanban com pacientes fictícios) | Necessita provedor externo + backend para webhooks |
| **Calendário** | UI própria funcional, mas sem sincronia externa e **sem fuso horário tratado** | UTC/timezone precisa ser normalizado; OAuth para Google/Outlook |
| **Financeiro/CRM** | Placeholder "Em criação" (cinza/disabled na sidebar) | Ainda não implementados |
| **Variáveis de ambiente** | Nenhuma `process.env.*`, nenhum `.env*` | Precisam ser criadas para todas as integrações |
| **APIs externas** | Zero `fetch()`, zero `app/api/` | Necessário criar handlers/server actions |
| **Migrations/seed** | Nenhum | A criar após adicionar ORM |

**Resumo:** o projeto não precisa de credencial **hoje** para rodar standalone, mas para entregar as funcionalidades implícitas na UI (whatsapp, IA, calendário sincronizado, multiusuário) é preciso construir as camadas de backend, auth, DB e integrações descritas abaixo.

---

## 2. Checklist de Variáveis de Ambiente e Credenciais

> Legenda de sensibilidade: 🔴 Alta — nunca commitar / usar secret manager · 🟡 Média · 🟢 Baixa / pública.

### 2.1 Infraestrutura & Segurança

| Variável | Formato esperado | Descrição | Sensibilidade | Status |
|---|---|---|---|---|
| `DATABASE_URL` | `postgresql://USER:PASS@HOST:5432/DB?schema=public` | String do Postgres (Neon/Supabase/Aiven) | 🔴 | A definir (sugerir Neon free tier) |
| `DIRECT_URL` | idem acima (sem pooling) | Usada para migrações Prisma | 🔴 | A definir |
| `NEXTAUTH_SECRET` | string aleatória 32+ chars (`openssl rand -base64 32`) | Secret para assinar JWTs de sessão | 🔴 | A criar |
| `NEXTAUTH_URL` | `https://app.dominio.com.br` | URL canônica do app em prod | 🟡 | A definir |
| `AUTH_TRUST_HOST` | `true` | Resolve host em proxies/reverse proxies | 🟢 | Em produção |
| `APP_TIMEZONE` | `America/Sao_Paulo` | Fuso padrão server-side | 🟢 | A definir |
| `NEXT_PUBLIC_APP_NAME` | `Taskplus Med` | Nome público (exibido no header) | 🟢 | A definir |

### 2.2 Autenticação — Provedor(es) OAuth

| Variável | Formato esperado | Sensibilidade | Status |
|---|---|---|---|
| `GOOGLE_CLIENT_ID` | string de console cloud | 🟡 | A definir (se usar Google Login) |
| `GOOGLE_CLIENT_SECRET` | string de console cloud | 🔴 | A definir |
| `AUTH_DRIZZLE_ADAPTER_*` | depende do adapter | 🔴 | A definir |

### 2.3 Integração WhatsApp (provedor sugerido: **Evolution API**)

| Variável | Formato esperado | Descrição | Sensibilidade | Status |
|---|---|---|---|---|
| `EVO_BASE_URL` | `https://api.evolution.com` (v2) | Endpoint REST do provedor | 🟡 | A definir |
| `EVO_API_KEY` | string (Bearer token) | Token de autenticação da Evolution | 🔴 | A definir |
| `EVO_INSTANCE_NAME` | `clinica_med_x` | Nome da instância/conta | 🟡 | A definir |
| `EVO_WEBHOOK_TOKEN` | string randômica | Valida assinatura do webhook incoming | 🔴 | A criar |
| `EVO_WEBHOOK_URL` | `https://app.dominio.com.br/api/whatsapp/webhook` | URL exposta para a Evolution chamar | 🟡 | A definir |

### 2.4 IA / LLM (reengajamento/classificação)

| Variável | Formato esperado | Sensibilidade | Status |
|---|---|---|---|
| `OPENAI_API_KEY` | `sk-...` | 🔴 | A definir |
| `OPENAI_MODEL` | `gpt-4o-mini` (default) | 🟢 | Sugerido `gpt-4o-mini` |
| `OPENAI_ASSISTANT_ID` | string `asst_...` (se usar Assistant) | 🟡 | Opcional |

### 2.5 Calendário / Agendamento (Google Calendar)

| Variável | Formato esperado | Sensibilidade | Status |
|---|---|---|---|
| `GOOGLE_CALENDAR_CLIENT_ID` | `.apps.googleusercontent.com` | 🟡 | A criar no Google Cloud |
| `GOOGLE_CALENDAR_CLIENT_SECRET` | string do console | 🔴 | A definir |
| `GOOGLE_CALENDAR_REDIRECT_URI` | `https://.../api/auth/google/callback` | 🟢 | Registrar no console |
| `GOOGLE_CALENDAR_REFRESH_TOKEN` | string criptografada por usuário | 🔴 | Persistido pós-consent |
| `CALENDAR_ID` | `primary` ou ID específico | 🟢 | A definir |

### 2.6 Provedor/Clínica (Dados de Negócio)

| Variável | Formato esperado | Sensibilidade | Status |
|---|---|---|---|
| `CLINICA_NOME` | `Dra. Ana Lima` / nome fantasia | 🟢 | A definir |
| `CLINICA_TELEFONE` | `+55 11 9XXXX-XXXX` | 🟡 | A definir |
| `CLINICA_TIMEZONE` | `America/Sao_Paulo` | 🟢 | A definir |
| `CLINICA_HORARIO_INICIO` | `08:00` | 🟢 | A definir |
| `CLINICA_HORARIO_FIM` | `18:00` | 🟢 | A definir |
| `CLINICA_DIAS_SEMANA` | `[1,2,3,4,5]` (Seg–Sex) | 🟢 | A definir |
| `CLINICA_DURACAO_SLOT` | `30` (minutos) | 🟢 | A definir |
| `CLINICA_ANTECEDENCIA_FERIADOS` | `2` (meses) | 🟢 | A definir (regra atual hardcode na store) |

### 2.7 Deploy / Observabilidade

| Variável | Formato esperado | Sensibilidade | Status |
|---|---|---|---|
| `SENTRY_DSN` | `https://...@sentry.io/...` | 🟡 | Opcional mas recomendado |
| `VERCEL_ENV` | `production` (auto na Vercel) | 🟢 | Automática |

---

## 3. Plano de Execução (Passo a Passo)

### FASE 1 — Infraestrutura e Segurança (Fundação)

1. **Criar `.env.example`**
   - Listar todas as variáveis da tabela acima com placeholders (`your-secret-here`).
   - Adicionar `.env.local`, `.env.production` ao `.gitignore` (confirmar).

2. **Adicionar ORM e banco de dados**
   - Escolher Prisma (recomendado) ou Drizzle — instalar como dep + `prisma init`.
   - Provisionar Postgres (sugerir **Neon** free tier — serverless, integração Vercel).
   - Definir `DATABASE_URL` e `DIRECT_URL` no `.env.local`.
   - Modelar schema inicial — sugestões de tabelas essenciais:
     - `users`, `accounts` (auth), `sessions`
     - `medicos`, `pacientes`, `compromissos`, `feriados`
     - `conversas_whats`, `mensagens_whats`
     - `config_clinica` (singleton com horário/fuso/dias)

3. **Adicionar Autenticação (NextAuth/Auth.js v5 + Adapter Prisma)**
   - Instalar `next-auth@beta` + `@auth/prisma-adapter`.
   - Criar `app/api/auth/[...nextauth]/route.ts` e `middleware.ts` para proteger rotas.
   - Configurar provider **Credentials** (e-mail+senha) e/ou **Google OAuth**.
   - Gerar `NEXTAUTH_SECRET` (`openssl rand -base64 32`) e gravar no ambiente.
   - Substituir usuário hardcode "LN" por `session.user` em `sidebar.tsx` e `mock-data/dashboard.ts`.

4. **Proteger servidor e dados sensíveis**
   - Garantir que nenhuma `API_KEY`, secret ou `DATABASE_URL` seja exposta no client (prefixar `NEXT_PUBLIC_` somente o que for realmente público).
   - Adicionar CSP/Headers no `next.config.ts` (recomendado) e/ou `vercel.json`.
   - Validar schemas com Zod (instalar) para todos os forms (criar compromisso, cadastrar paciente).

5. **Migrações e seed**
   - Rodar `prisma migrate dev --name init` localmente.
   - Criar `prisma/seed.ts` populando `config_clinica`, `feriados` (migrar de `mock-data/calendario.ts`), 1 médico admin inicial.
   - Script `db:seed` no `package.json`.

### FASE 2 — Integrações de Terceiros

6. **WhatsApp — assinar provedor (Evolution API recomendada)**
   - Criar instância no painel da Evolution; copiar `EVO_API_KEY`, `EVO_INSTANCE_NAME`, `EVO_BASE_URL`.
   - Criar `app/api/whatsapp/webhook/route.ts` (POST) que:
     - valida header `Authorization` contra `EVO_WEBHOOK_TOKEN`;
     - persiste mensagens em `mensagens_whats`;
     - dispara IA (Fase 2.2) por fila.
   - Criar `app/api/whatsapp/send/route.ts` (POST) que envia mensagem via REST da Evolution.
   - Substituir dados de `mock-data/whatsapp.ts` (`inicialCards`, etc.) por queries reais em `server actions` ou `loader` do RSC.
   - Atualizar `whats-content.tsx` para usar SWR/React Query com `/api/whatsapp/cards`.

7. **IA / Reengajamento**
   - Instalar `openai` e criar `lib/openai.ts`.
   - Definir prompt de sistema em `prompts/reengajamento.md` para classificar status (Inicial/Agendamento/Fisgado/Recaptura/Pós).
   - Criar `app/api/whatsapp/classify/route.ts` que chama `OPENAI_ASSISTANT_ID` ou `chat.completions`.
   - Implementar toggle "IA pausada" persistido por `config_clinica` (em vez de `useState` volátil).

8. **Google Calendar — OAuth + sincronização**
   - No Google Cloud Console criar projeto → habilitar **Calendar API** → criar credenciais OAuth 2.0 → cadastrar `REDIRECT_URI`.
   - Configurar `lib/google-calendar.ts` usando `googleapis` (Node SDK).
   - Criar fluxo OAuth em `app/api/calendar/auth/route.ts` (gera URL consent) e callback `app/api/calendar/callback/route.ts` (trocadod e code por `access/refresh_token`, persistir no DB por usuário/conta).
   - Sincronização bidirecional: ao criar compromisso no calendário do app → `POST /calendars/{id}/events` no Google; webhook do Google (`syncToken`) → atualiza `compromissos`.
   - Substituir `compromissosIniciais` de `mock-data/calendario.ts` por `prisma.compromisso.findMany`.
   - Ajustar `store/calendario-store.ts` para buscar via hook/server action.

9. **Webhooks de entrada (queue/erros)**
   - Garantir idempotência (salvar `messageId` único, checar antes de processar).
   - Validar assinatura HMAC de todos os webhooks (Evolution + Google).
   - Considerar fila simples (QStash Upstash) se o volume de mensagens aumentar.

### FASE 3 — Parâmetros de Negócio

10. **Configuração da Clínica (admin)**
    - Reativar o item "Configuração" da sidebar (atualmente navegável, mas sem view real — cai em "Em criação" via `page.tsx`). Construir view `ConfigContent`.
    - Formulário salvo em `config_clinica`: nome, telefone, e-mail, logo, timezone, horário de atendimento (dias/início/fim/duração do slot).
    - Mover constantes `PERIODO_ATENDIMENTO` e `ANTECEDENCIA_MESES` de `mock-data/calendario.ts` e `store/calendario-store.ts` para o DB.

11. **Fuso horário (timezone)**
    - Definir `APP_TIMEZONE` e `CLINICA_TIMEZONE` = `America/Sao_Paulo`.
    - Normalizar todas as datas server-side em UTC + converter para o fuso da clínica ao exibir (usar `date-fns-tz` ou `Intl.DateTimeFormat`).
    - Ajustar helpers de `mock-data/calendario.ts` (`toDateKey`, `parseDateKey`, `addDays`) para `date-fns-tz`.
    - Garantir que feriados vindouros da base estática sejam interpretados no fuso correto.

12. **Regras de feriados personalizadas**
    - A regra "feriado na quinta → perguntar sobre a sexta" (em `calendario-store.ts` `diaAdjacenteParaFeriado`) migra para config (caixa de seleção por feriado: "Manter" / "Mover" / "Cancelar").
    - Antecedência de meses para avisar (`ANTECEDENCIA_MESES = 2`) passa a ser configurável por `config_clinica.antecedenciaFeriados`.

13. **Ativação dos módulos restantes (Financeiro, CRM)**
    - Remover `disabled: true` da sidebar quando cada módulo estiver pronto.
    - Financeiro: criar `FinanceiroContent` (contas a receber/receber via WhatsApp → "Cliente Fisgado"), tabela `cobrancas`.
    - CRM: pipeline de leads conectado ao WhatsApp ("Inicial" e "Agendamento" já servem de estágio inicial).

### FASE 4 — Testes de Conexão e Validação

14. **Testes de conexão (checklist manual/script)**
    - [ ] `DATABASE_URL` acessível pelo app (`prisma db push` sem erros).
    - [ ] `NEXTAUTH_SECRET` gera cookies válidos (login → refresh mantém sessão).
    - [ ] Evolution API: `curl -H "Authorization: Bearer $EVO_API_KEY" $EVO_BASE_URL/instance/fetch` retorna 200.
    - [ ] Webhook Evolution recebe mensagem de teste → chega em `mensagens_whats`.
    - [ ] OpenAI: `lib/openai.ts` responde em <5s; classificação enquadra status corretamente.
    - [ ] Google Calendar: OAuth callback salva `refresh_token`; evento criado no app aparece no Google e vice-versa.
    - [ ] Fuso horário: criar compromisso às "09:00" desde fuso ≠ America/Sao_Paulo aparecer no mesmo "09:00" no SP.
    - [ ] Clicar em "Financeiro"/"CRM" antes do MVP → mostra tela cinza "Em criação" (atual).

15. **Smoke test de build e deploy**
    - [ ] `next build` (ou `pnpm build`) sem erros/warnings de TS.
    - [ ] ESLint (`eslint`): corrigir o erro conhecido *circular structure JSON* atual (provável versão do eslint-config-next incompatível com ESLint 9.39 — pinar versão ou migrar para flat config estável).
    - [ ] Vercel: preview environment roda com `.env` de produção; checkout de settings/cookies funciona (undefined session = redirect para login).

16. **Monitoramento/Garantia de continuidade**
    - Integrar Sentry (`SENTRY_DSN`) em `app/layout.tsx` via `<SentryProvider>` ou pacote `@sentry/nextjs`.
    - Definir alertas em fallback de APIs WhatsApp/Google (exponential backoff + alerta de downtime).
    - Documentar runbook (mockar chamada de webhook de emergência, girar `OPENAI_API_KEY`, etc.).

---

## 4. Pontos de Atenção e Boas Práticas

1. **Segurança de credenciais**
   - Nunca commitar `.env`. Usar secret manager (Vercel Environment Variables, Doppler ou AWS SM) em produção.
   - Rotacionar `OPENAI_API_KEY`, `EVO_API_KEY` e `GOOGLE_CLIENT_SECRET` a cada 90 dias ou incidente.
   - Variáveis `NEXT_PUBLIC_*` ficam embutidas no bundle JS → NUNCA usar para segredos; apenas para chaves públicas como Google Client ID.

2. **Tratamento de erros externos**
   - Queda da Evolution: fila + retry exponencial (3 tentativas), estado "Indisponível" no Kanban de WhatsApp, banner visual no header.
   - Webhook mal-formatado → HTTP 200 com log para evitar re-entrega infinita (Evolution re-tenta em 400/500).
   - Rate limit OpenAI (429) → cache de classificação por `messageId` por 24h.

3. **Validação de timezone (crítico)**
   - Hoje `new Date()` no browser cria datas no fuso do visitante — um cliente na Europa verá compromissos em horário local. Em prod, **normalizar server-side** com `America/Sao_Paulo` fixo por clínica.
   - Persistir todas as datas em UTC (`TIMESTAMPTZ`); converter para o fuso da clínica só na renderização.
   - Feriados da base estática (`mock-data/calendario.ts` — atualmente até 2027) precisam passar a vir de uma API (ex.: **BrasilAPI `/api/v1/feriados/v1/{ano}`**) ou ser atualizada anualmente por job.

4. **Webhooks reversíveis**
   - Webhook da Evolution exposto em `/api/whatsapp/webhook` precisa de HTTPS válido (Vercel cuida) + assinatura HMAC; sem validação, qualquer um pode forjar mensagens.
   - Considerar `tunnel` dev local via `ngrok` + adicionar a URL do ngrok em `EVO_WEBHOOK_URL` para testar incoming na Fase 2.

5. **Persistência antes de UI**
   - Atualmente qualquer criação/edição de compromisso **some ao recarregar** (Zustand não é persistido). Antes de ativar usuários reais, é indispensável completar a Fase 1 (DB + auth), senão funcionalidades de cadastro não surtem efeito.

6. **Módulos desabilitados**
   - Financeiro e CRM estão cinza/disabled na `sidebar.tsx` e mostram "Em criação" em `app/page.tsx`. Enquanto em desenvolvimento, manter o `disabled: true`; removê-lo **somente** após smoke-test completo do novo módulo.

7. **CI/CD**
   - Adicionar GitHub Actions: `lint` + `typecheck` + `build` em cada PR. Atualmente `eslint` está quebrando por bug da config ESLint 9.39 — fix prioritário para não inibir PRs downstream.
   - Manter `vercel.json:ignoreCommand` (skip build quando nada muda em `.`), mas adicionar `headers` para CSP/HSTS e `cleanUrls: true` (opcional).

8. **Recursos e Custos**
   - Neon free tier = 0.5 GB Postgres; suficiente para MVP, mas monitorar para migrar antes do estouro.
   - OpenAI `gpt-4o-mini` ≈ $0.15/1M tokens — adequado para classificação; monitorar consumo.
   - Evolution API na mesma Vercel pode estourar limite de 60s da Edge — recomendado instância própria (Railway/Fly.io/Render) na mesma região.

---

## 5. Status Resumido por Área

| Área | Estado |
|---|---|
| Front-end / UI | Implementado (real) |
| Estado client | Implementado (Zustand, volátil) |
| Persistência | **Faltante** |
| Auth | **Faltante** |
| WhatsApp | **Mock** |
| Calendário | Implementado UI; sem sincronia externa real |
| Financeiro / CRM / Config | Placeholder "Em criação" (sidebar mostra, `page.tsx` exibe "Em criação") |
| APIs externas | **Nenhuma** |
| Env vars | **Nenhuma** |
| migrations/seed | **Nenhum** |

---

**Resumo de criticidade:** o app está visualmente completo na camada de UI, mas **precisa de backend (DB + auth + APIs) antes de qualquer rollout real**. Sugerimos executar **Fase 1 completa** como pré-requisito incontornável; o restante (WhatsApp/IA/Calendar) pode ser entregue de forma incremental por módulo.