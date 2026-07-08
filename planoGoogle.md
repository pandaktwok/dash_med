# Plano de Execução de Configurações - Dash Med (Produção)

Este documento detalha todas as configurações necessárias para migrar o sistema **Dash Med** do ambiente de desenvolvimento local para um ambiente de produção robusto, seguro e integrado.

---

## 1. Visão Geral da Análise

O programa atual da aplicação **Dash Med (Taskplus)** é um painel de controle e agendamento de consultas médicas em formato de Single Page Application (SPA), utilizando **Next.js (App Router)** e gerenciamento de estado do lado do cliente com **Zustand**. 

Os dados estão estruturados de forma estática em mocks (`mock-data/`), o que significa que o estado das conversas do WhatsApp, o controle de feriados dinâmicos e os agendamentos de consultas (`Compromisso`) residem inteiramente na memória do navegador. 

Para que a aplicação saia do ambiente de desenvolvimento e opere com robustez em produção, é necessária a transição para uma arquitetura orientada a serviços e APIs. Os pontos críticos identificados que exigem configuração externa e de infraestrutura são:
1. **Persistência de Dados**: Migrar os stores do Zustand para chamadas de API que persistam consultas, histórico de conversas, triagens de leads e decisões sobre feriados em um Banco de Dados Relacional (ex: PostgreSQL) por conta da consistência ACID requerida para agendamentos.
2. **Integração de Mensageria (WhatsApp)**: O módulo "Whats" opera com estados complexos como triagem inicial, pausas na inteligência artificial do bot de atendimento, regras de recaptura automática de ausentes e automação pós-consulta. Em produção, isso requer um webhook resiliente e um provedor de mensageria estável capaz de trafegar arquivos e mensagens de texto.
3. **Sincronização de Calendário**: O calendário local lida com conflitos de horários, regras de emenda de feriados (ex: decidir com 2 meses de antecedência se atende na sexta-feira adjacente a uma quinta-feira de feriado). Em produção, isso deve ser integrado de forma bidirecional com calendários externos (Google Calendar ou Cal.com), necessitando de autenticação OAuth2 e filas de mensageria para gerenciar expirações de tokens de acesso.
4. **Resiliência e Filas**: A recaptura de ausentes baseada em tempo (ex: *"Ausente há 125 minutos"*) exige um serviço de agendamento de tarefas em segundo plano (Worker/Cron) suportado por um banco de dados in-memory (como Redis).

---

## 2. Checklist de Variáveis de Ambiente e Credenciais

Abaixo está o mapeamento detalhado das variáveis de ambiente (`.env`) necessárias para configurar a infraestrutura de produção da aplicação:

| Categoria | Nome da Variável | Formato/Exemplo | Sensibilidade | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| **Infraestrutura** | `NODE_ENV` | `production` | Baixa | Define o modo de execução da aplicação. |
| | `DATABASE_URL` | `postgresql://user:pass@host:5432/db` | **Crítica** | String de conexão com o banco de dados PostgreSQL. |
| | `REDIS_URL` | `redis://default:password@host:6379` | **Crítica** | Conexão para cache e controle de filas de Webhooks/Cron. |
| **Autenticação** | `NEXTAUTH_SECRET` | `32_chars_random_string` | **Crítica** | Chave para criptografia dos tokens JWT de sessão de usuário. |
| | `NEXTAUTH_URL` | `https://dashmed.com.br` | Média | URL de origem da aplicação para controle de CORS do Auth. |
| **API WhatsApp** | `WHATSAPP_PROVIDER_URL` | `https://api.z-api.io/instances/ID` | Média | URL base do gateway de mensageria selecionado. |
| | `WHATSAPP_API_TOKEN` | `Bearer client_token_xyz` | **Crítica** | Token de autorização para envio de mensagens via gateway. |
| | `WHATSAPP_WEBHOOK_KEY` | `webhook_secret_verification_key` | Média | Token para validar que o payload veio do provedor correto. |
| **API Calendário** | `GOOGLE_CLIENT_ID` | `12345-abcde.apps.googleusercontent.com` | Média | ID do cliente da aplicação no Google Cloud Console. |
| | `GOOGLE_CLIENT_SECRET` | `GOCSPX-secret_key_value` | **Crítica** | Segredo do cliente no Google Cloud Console para OAuth2. |
| | `GOOGLE_REDIRECT_URI` | `https://dashmed.com.br/api/auth/callback/google` | Média | URI de redirecionamento autorizada para o fluxo OAuth2. |
| **Regras de Negócio**| `NEXT_PUBLIC_TIMEZONE` | `America/Sao_Paulo` | Baixa | Timezone padrão da clínica para cálculo de agendamentos. |
| | `CLINIC_WORK_HOURS_START`| `08:00` | Baixa | Horário de início do expediente padrão da clínica. |
| | `CLINIC_WORK_HOURS_END` | `18:00` | Baixa | Horário de fim do expediente padrão da clínica. |

---

## 3. Plano de Execução (Passo a Passo)

### Fase 1: Infraestrutura e Segurança (Banco de Dados e Variáveis Locais)
1. **Provisionamento do Banco de Dados**: Subir uma instância de PostgreSQL gerenciada (ex: AWS RDS ou Neon) e um nó de Redis (ex: AWS ElastiCache ou Upstash).
2. **Definição do Schema (ORM)**: Implementar um ORM (como Prisma ou Drizzle) para espelhar as entidades modeladas nos mocks:
   * Tabela `Paciente` (Nome, Telefone, ID)
   * Tabela `Compromisso` (Data, Horário, Duração, Tipo, PacienteID, Status, Observação)
   * Tabela `FeriadoConfig` (Data, AtendeDia, DiaAdjacente, AtendeAdjacente, DecididoEm)
   * Tabela `WhatsAppLead` (Cliente, Telefone, ÚltimaMensagem, SubStep, IaPausada, AusenteDesde)
3. **Criptografia e Cofre de Chaves**: 
   * Inserir as variáveis de ambiente sensíveis no painel de configurações do provedor Cloud (ex: Vercel Environment Variables).
   * Habilitar criptografia em repouso (*Encryption at Rest*) para o banco de dados de produção para proteger dados sensíveis de pacientes (em conformidade com a LGPD).

### Fase 2: Integrações de Terceiros (WhatsApp e APIs de Calendário)
1. **Configuração do Gateway de WhatsApp**:
   * Configurar a instância no provedor do WhatsApp.
   * Cadastrar a URL de Webhook no painel do provedor apontando para `/api/webhooks/whatsapp` da nossa aplicação.
   * Desenvolver o endpoint de recebimento do webhook no Next.js com validação de assinatura e enfileiramento das mensagens recebidas no Redis (via BullMQ ou similar) para evitar perda de mensagens devido a *rate limiting*.
2. **Setup do Google OAuth2 para Calendário**:
   * Criar um projeto no Google Cloud Console, habilitar a *Google Calendar API* e configurar a tela de consentimento OAuth.
   * Cadastrar as credenciais (`GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`) no servidor.
   * Criar rotas de autenticação para que os médicos associem suas respectivas contas do Google Calendar ao sistema.
   * Registrar o canal de notificações push do Google (*Watch Request*) para receber atualizações em tempo real quando um evento for modificado diretamente no app do Google Calendar.

### Fase 3: Parâmetros de Negócio (Horários e Fornecedores)
1. **Painel de Configurações Administrativas**:
   * Adaptar a aba de **Configurações** da sidebar para gerenciar de forma dinâmica (salvando no banco de dados) os horários de início/fim de atendimento da clínica e os dias de expediente.
2. **Mapeamento de Feriados Nacionais e Adjacências**:
   * Implementar a rotina automatizada (`ANTECEDENCIA_MESES = 2`) no backend. Uma tarefa cron executada no primeiro dia de cada mês deve varrer os feriados nacionais cadastrados para os próximos 2 meses e disparar no banco os registros de `FeriadoConfig` pendentes, gerando os alertas e cards no dashboard do médico sobre emendas de feriados.

### Fase 4: Testes de Conexão e Validação
1. **Testes de Conexão de Banco**: Validar latência das queries e testar resiliência da conexão sob estresse.
2. **Simulação de Webhook (WhatsApp)**: Realizar testes de carga enviando payloads simulados ao endpoint `/api/webhooks/whatsapp` para validar a corretude das transições de estados de lead ("iniciado" -> "aguardando_dados" -> "fisgado").
3. **Sanity Check de Fuso Horário**: Criar compromissos em cenários de transição de dia e horário de verão local (se houver), garantindo consistência entre a API e o banco de dados.

---

## 4. Pontos de Atenção e Boas Práticas

> [!IMPORTANT]
> **Tratamento de Timezone (Fuso Horário)**
> Todas as datas e horas de agendamentos (`Compromisso`) devem ser obrigatoriamente salvas no banco de dados no formato **UTC** (padrão ISO 8601). A conversão para o fuso horário local (`America/Sao_Paulo`) deve ocorrer estritamente na camada de apresentação (client-side) do Next.js ou ao enviar a notificação ao paciente. Isso previne incompatibilidades com calendários externos e garante que o expediente da clínica seja respeitado mesmo se a aplicação estiver hospedada em servidores com fuso horário padrão dos EUA (UTC).

> [!WARNING]
> **Idempotência no Webhook do WhatsApp**
> O webhook de plataformas de mensageria (incluindo a API oficial da Meta) pode disparar o mesmo payload de mensagem múltiplas vezes devido a retentativas de rede. É vital estruturar o banco de dados com uma restrição única (*unique constraint*) no campo `id_mensagem_whatsapp`. Antes de processar e transicionar o estado de um lead, o servidor deve verificar se aquele identificador de mensagem já foi persistido, evitando mensagens duplicadas enviadas pela IA ou loops indesejados de atendimento.

> [!CAUTION]
> **Resiliência e Mecanismo de Fallback de APIs**
> APIs de terceiros falham ou sofrem instabilidades. O sistema deve seguir o princípio do *Graceful Degradation*:
> * Se a API do Google Calendar estiver fora do ar, o sistema deve permitir o agendamento local no banco interno e enfileirar a sincronização no Redis para ser processada assim que a API retornar.
> * Implementar a estratégia de **Circuit Breaker** nas requisições do WhatsApp: caso o gateway retorne falhas consecutivas, as tentativas de disparo automático de recaptura de ausentes devem ser pausadas temporariamente e uma notificação de sistema deve alertar a recepção médica para que o fluxo manual seja ativado.
