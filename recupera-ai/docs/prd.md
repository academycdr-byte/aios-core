# RecuperaAI Production-Ready — Brownfield Enhancement PRD

**Versão:** 1.0
**Data:** 2026-03-01
**Autor:** Morgan (PM Agent) + Ivan Furtado (Stakeholder)
**Status:** Draft
**Projeto:** RecuperaAI — `C:\Users\User\aios-project\recupera-ai`
**Deploy:** https://recupera-ai-five.vercel.app

---

## 1. Análise do Projeto Existente

### 1.1 Fonte da Análise

IDE-based fresh analysis — projeto localizado em `C:\Users\User\aios-project\recupera-ai`.

### 1.2 Estado Atual do Projeto

O RecuperaAI é um SaaS de recuperação de carrinhos abandonados via WhatsApp com IA (Claude Haiku). Stack: Next.js 16 + Prisma 7 + Neon PostgreSQL + Evolution API + Vercel.

**Funcional:**
- Login/Auth (NextAuth v5)
- CRUD de lojas com integração Shopify/Nuvemshop (OAuth)
- Conexão WhatsApp via Evolution API (QR/pairing code)
- Engine de IA com Claude Haiku (3 modos: first message, follow-up, reply)
- Dashboard com 6 KPIs + 4 gráficos (Recharts)
- Transcrição de áudio (Groq Whisper) + análise de imagens (Claude Vision)
- Webhook handler para mensagens recebidas
- Flow builder visual para configurar delays
- Knowledge base form para dados da loja
- Classificação de intent das mensagens do cliente
- Criptografia AES-256 para tokens

**Incompleto / Não funcional:**
- Auto-send DESABILITADO — `processRecoveryJobs()` comentado no cron
- Settings page vazia — tudo "Em breve"
- Sem tracking de vendas recuperadas — status muda mas não sincroniza com plataforma
- Sem date picker na dashboard — período fixo (7d/30d/90d)
- Sem métricas granulares — não rastreia em qual etapa/desconto a venda foi recuperada
- Follow-up básico — delays configuráveis mas sem controle fino de estratégia por etapa
- Sem controle de estratégia por mensagem — IA age livremente sem guia de etapas
- Dashboard não sincroniza na integração — precisa sync manual
- PIX/Card recovery — schema existe mas cron não diferencia tipos

### 1.3 Documentação Disponível

| Documento | Status |
|-----------|--------|
| Tech Stack Documentation | Não existe (analisado via código) |
| Source Tree/Architecture | Não existe (analisado via código) |
| Coding Standards | Não existe (inferido dos padrões) |
| API Documentation | Não existe (analisado via rotas) |
| UX/UI Guidelines | Não existe (inferido dos componentes) |
| Technical Debt Documentation | Não existe |

### 1.4 Tipo de Enhancement

- [x] New Feature Addition
- [x] Major Feature Modification
- [x] Bug Fix and Stability Improvements

### 1.5 Avaliação de Impacto

**Significant Impact** — mudanças em múltiplas camadas (schema, AI engine, cron scheduler, dashboard, UI components).

### 1.6 Goals

- Ter controle total sobre a estratégia de mensagens em cada etapa do funil de recuperação
- Maximizar dados e métricas para tomar decisões baseadas em dados sobre o que funciona
- Eliminar bugs e garantir estabilidade para iniciar testes reais com clientes
- Rastrear vendas recuperadas de ponta a ponta (abandono → conversa → pagamento confirmado)
- Melhorar a UX para que qualquer lojista entenda como configurar e usar o sistema

### 1.7 Background Context

O RecuperaAI está na fase de transição entre MVP funcional e produto testável com clientes reais. A engine de IA existe e funciona, mas falta controle estratégico sobre o comportamento da IA em cada etapa da conversa. O sistema de métricas precisa ser expandido significativamente para fornecer os dados necessários para validar a eficácia das estratégias de recuperação. O auto-send está desabilitado propositalmente até que toda a QA seja feita e o stakeholder aprove o funcionamento.

### 1.8 Change Log

| Change | Date | Version | Description | Author |
|--------|------|---------|-------------|--------|
| Criação | 2026-03-01 | 1.0 | PRD inicial — brownfield enhancement | Morgan (PM) |

---

## 2. Requisitos

### 2.1 Requisitos Funcionais (FR)

**FR1:** O sistema deve permitir configurar a estratégia de mensagem por etapa do funil — definindo o objetivo de cada estágio (ex: Etapa 1 = ser respondido, Etapa 2 = identificar objeção, Etapa 3 = aplicar estratégia de conversão, Etapa 4 = ofertar desconto).

**FR2:** O sistema deve permitir configurar o conteúdo/tom da primeira mensagem com controle sobre abordagem inicial, sem depender 100% da IA decidir sozinha.

**FR3:** O sistema deve permitir definir regras de quando ofertar desconto — a partir de qual etapa, condições (ex: somente após objeção de preço), e escalonamento progressivo de desconto.

**FR4:** O sistema deve implementar follow-up completo e configurável — quantidade de follow-ups, intervalo entre cada um, estratégia diferente por follow-up, e regras de parada (ex: cliente pediu para parar).

**FR5:** O sistema deve rastrear em qual etapa a venda foi recuperada — registrando se foi antes/depois de ofertar desconto, qual % de desconto foi necessário, quantas mensagens foram trocadas até a conversão.

**FR6:** O sistema deve calcular e exibir métricas granulares: taxa de resposta (mensagens respondidas / enviadas), taxa de abertura (delivered→read), taxa de cliques em links enviados, taxa de conversão por etapa.

**FR7:** O sistema deve processar áudios, imagens e vídeos recebidos do cliente — transcrever áudios (Groq Whisper), analisar imagens (Claude Vision), extrair áudio de vídeos para transcrição — e continuar o fluxo normalmente.

**FR8:** O sistema deve trackear vendas recuperadas confirmando pagamento via webhook da plataforma (Shopify `orders/paid` / Nuvemshop `orders/paid`) e vinculando ao carrinho e conversa correspondentes.

**FR9:** O sistema deve enviar o link de checkout ao cliente quando a IA identificar interesse de compra, usando o `checkoutUrl` do carrinho abandonado.

**FR10:** O sistema deve sincronizar dados da dashboard automaticamente quando uma integração com plataforma/checkout for conectada, sem necessidade de sync manual.

**FR11:** O sistema deve oferecer um seletor de datas customizado na dashboard, permitindo filtrar métricas por período específico (além dos fixos 7d/30d/90d).

**FR12:** A interface deve tornar intuitivo e claro onde o lojista insere dados da loja (frete, prazos, ofertas, cupons) e como a IA usa esses dados nas estratégias de recuperação.

### 2.2 Requisitos Não-Funcionais (NFR)

**NFR1:** Todas as alterações devem manter a performance atual — nenhuma rota de API deve exceder 3s de response time.

**NFR2:** O sistema de métricas deve processar tracking events de forma assíncrona para não impactar o tempo de resposta das mensagens.

**NFR3:** O sistema deve suportar pelo menos 1.000 conversas simultâneas ativas por loja sem degradação.

**NFR4:** Nenhuma mensagem pode ser enviada para clientes reais durante o desenvolvimento — todos os testes usam exclusivamente o número **5535998717592**.

**NFR5:** O código deve seguir os padrões já existentes no projeto (Next.js App Router, Prisma, TypeScript strict).

**NFR6:** Media files (áudio/vídeo) acima de 25MB devem ser tratados graciosamente com mensagem ao cliente, não erro silencioso.

### 2.3 Requisitos de Compatibilidade (CR)

**CR1: API existente** — Todas as rotas de API atuais devem continuar funcionando sem breaking changes. Novas funcionalidades adicionadas como endpoints novos ou extensões opcionais.

**CR2: Schema do banco** — Alterações via migrations Prisma incrementais, preservando todos os dados existentes. Nenhuma tabela existente removida.

**CR3: UI/UX consistência** — Novos componentes seguem o design system atual (Tailwind v4, Lucide icons, padrão de cards/modais existente).

**CR4: Integrações** — Integrações Shopify e Nuvemshop existentes permanecem funcionais. Novos webhooks são adicionais, não substitutivos.

---

## 3. User Interface Enhancement Goals

### 3.1 Integração com UI Existente

O RecuperaAI tem um design system consistente: cards com bordas arredondadas, sidebar escura, KPI cards com ícones Lucide, modais com backdrop, formulários com labels claros. O padrão de tabs na página da loja (`/lojas/[id]`) com 5 tabs (Visão Geral, Conhecimento, Fluxo de Recuperação, Configurações, WhatsApp) é o ponto principal de extensão.

Abordagem: expandir componentes existentes ao invés de criar páginas novas. Configuração de estratégia por etapa (FR1/FR2/FR3) dentro do `RecoveryFlowBuilder`. Métricas granulares (FR6) na dashboard existente.

### 3.2 Telas Modificadas / Novas

| Tela | Tipo | O que muda |
|------|------|-----------|
| `/lojas/[id]` — tab Fluxo de Recuperação | Modificada | Expandir FlowBuilder com stages, regras de desconto, follow-up (FR1-FR4) |
| `/lojas/[id]` — tab Conhecimento | Modificada | Tooltips e guias mostrando como IA usa cada dado (FR12) |
| `/` — Dashboard | Modificada | Date picker (FR11), métricas granulares (FR6), indicadores de etapa (FR5) |
| `/conversas` — Detalhe | Modificada | Stage atual, desconto ofertado, status delivery/read (FR5, FR6) |
| `/carrinhos` — Tabela | Modificada | Coluna de etapa + indicador de venda confirmada (FR5, FR8) |
| `/configuracoes` | Modificada | Implementar seções que são "Em breve" |

### 3.3 Requisitos de Consistência UI

- Palette de cores existente (dark sidebar, cards brancos, accent azul/verde)
- Formulários seguem padrão de `KnowledgeBaseForm` (labels + inputs + help text)
- Gráficos com Recharts no estilo visual existente
- Modais seguem padrão de `WhatsappConnectModal`
- Responsividade mobile mantida
- Ícones exclusivamente Lucide React

---

## 4. Restrições Técnicas e Integração

### 4.1 Tech Stack Existente (sem mudanças)

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | Next.js | 16.1.6 |
| Linguagem | TypeScript | 5 |
| ORM | Prisma | 7.4.1 |
| Database | PostgreSQL (Neon) | Serverless |
| AI | Claude Haiku 4.5 | @anthropic-ai/sdk 0.78.0 |
| WhatsApp | Evolution API | homolog |
| Deploy App | Vercel | — |
| Deploy WhatsApp | VPS + Caddy + Docker | — |
| Audio | Groq Whisper | whisper-large-v3-turbo |
| Charts | Recharts | 3.7.0 |
| State | Zustand | 5.0.11 |

### 4.2 Estratégia de Integração

**Database:** Migrations incrementais Prisma. Novas tabelas para stages/métricas. Tabelas existentes recebem campos opcionais (nullable).

**API:** Novos endpoints para stages e métricas. Endpoints existentes expandidos com campos opcionais.

**Frontend:** Componentes existentes expandidos. `RecoveryFlowBuilder` recebe lógica de stages. Dashboard recebe novos cards e date picker.

**AI Engine:** `recovery-engine.ts` e `system-prompt-builder.ts` modificados para stages config. Decisão de desconto sai do prompt genérico para regras configuráveis.

### 4.3 Organização de Código

Seguir padrão existente: `src/lib/` para lógica, `src/components/` para UI, `src/app/api/` para rotas.

Novos módulos previstos:
- `src/lib/recovery/stages.ts` — lógica de stages/etapas
- `src/lib/recovery/tracking.ts` — tracking de links e eventos
- `src/lib/recovery/follow-up.ts` — lógica de follow-up avançado
- `src/components/stage-config-form.tsx` — formulário de config de etapas
- `src/components/date-range-picker.tsx` — seletor de datas

### 4.4 Deploy e Operações

Build sem mudanças (`next build` via Vercel). Cron mantém estrutura (5min). Expandir `processRecoveryJobs()` para stages.

### 4.5 Avaliação de Riscos

| Risco | Prob. | Impacto | Mitigação |
|-------|-------|---------|-----------|
| Mensagem para cliente real durante dev | Baixa | CRÍTICO | NFR4 + flag `testMode` + whitelist |
| Migration quebra dados existentes | Média | Alto | Campos nullable, backup pré-migration |
| Tracking de cliques exige redirect | Alta | Médio | Redirect interno `/api/r/[code]` |
| Groq Whisper fora do ar | Média | Médio | Fallback com mensagem amigável |
| Webhook de order não chega | Média | Alto | Polling fallback + reconciliação |

---

## 5. Epic e Story Structure

### 5.1 Decisão de Estrutura

**Epic único.** Todos os enhancements são partes do mesmo objetivo: tornar o RecuperaAI production-ready para testes reais. Dependências cruzadas entre stages → métricas → dashboard justificam epic unificado.

---

## 6. Epic 1: RecuperaAI Production-Ready

**Epic Goal:** Transformar o RecuperaAI de MVP funcional em produto testável com clientes reais — com controle estratégico total sobre as mensagens, métricas granulares para decisão por dados, e estabilidade comprovada via QA.

**Integration Requirements:** Todas as stories mantêm compatibilidade com schema, API e UI existentes. Nenhuma story quebra funcionalidade atual.

---

### Story 1.1 — Auditoria de Bugs e Estabilidade

> Como **operador do RecuperaAI**, quero que o sistema existente seja auditado e corrigido, para que eu tenha confiança de que a base está sólida antes de adicionar features novas.

**Acceptance Criteria:**
1. Todas as rotas de API retornam respostas corretas (sem 500, sem crashes)
2. Webhook do WhatsApp processa mensagens recebidas corretamente
3. Conexão WhatsApp (QR/pairing) funciona de ponta a ponta
4. IA gera respostas coerentes nos 3 modos (first, follow-up, reply)
5. Dashboard carrega sem erros com dados reais
6. Envio de mensagem de teste funciona para 5535998717592

**Integration Verification:**
- IV1: Login/Auth continua funcionando
- IV2: CRUD de lojas preservado
- IV3: Nenhum dado existente afetado

---

### Story 1.2 — Sistema de Etapas de Recuperação (Recovery Stages)

> Como **operador do RecuperaAI**, quero configurar a estratégia da IA por etapa do funil (primeira abordagem → identificar objeção → aplicar estratégia → ofertar desconto), para que eu tenha controle sobre como a IA age em cada momento da conversa.

**Acceptance Criteria:**
1. Novo modelo `RecoveryStage` no schema com: nome, ordem, objetivo, instruções para IA, regras de transição
2. Configuração de stages por loja na UI (tab Fluxo de Recuperação)
3. Stages padrão pré-configurados: (1) Gerar resposta, (2) Identificar objeção, (3) Estratégia de conversão, (4) Ofertar desconto
4. IA recebe o stage atual no system prompt e age de acordo
5. Conversa registra em qual stage está e transições entre stages
6. Regras de desconto configuráveis: a partir de qual stage, escalonamento (5% → 10% → 15%), condições
7. Primeira mensagem configurável: tom, abordagem, elementos obrigatórios

**Integration Verification:**
- IV1: Conversas existentes continuam funcionando (stage = null = comportamento atual)
- IV2: RecoveryConfig existente preservado, stages são adição
- IV3: Performance do AI generate não degrada (< 3s)

---

### Story 1.3 — Sistema de Follow-up Avançado

> Como **operador do RecuperaAI**, quero ter controle completo sobre os follow-ups (quantidade, timing, estratégia por follow-up, regras de parada), para que eu possa otimizar a cadência de recuperação.

**Acceptance Criteria:**
1. Configuração de até 7 follow-ups com delay individual
2. Cada follow-up tem: delay (minutos), estratégia/instrução, prioridade
3. Regras de parada: cliente pediu para parar, cliente comprou, max attempts, expiração
4. Follow-up diferenciado por tipo de carrinho (abandonado vs PIX vs cartão)
5. Scheduler (`processRecoveryJobs`) respeita nova configuração
6. Preview de timeline na UI (visualização de quando cada follow-up será enviado)
7. Log de cada follow-up com timestamp e resultado

**Integration Verification:**
- IV1: RecoveryConfig existente migrado para novo formato (retrocompatível)
- IV2: Cron job continua rodando a cada 5 min
- IV3: Carrinhos existentes não recebem follow-ups retroativos

---

### Story 1.4 — Validação e Completude de Mídia

> Como **operador do RecuperaAI**, quero ter certeza de que a IA entende qualquer mídia que o cliente enviar (áudio, imagem, vídeo), para que a conversa não quebre.

**Acceptance Criteria:**
1. Áudio: transcrição via Groq Whisper funcionando (GROQ_API_KEY configurado)
2. Imagem: análise via Claude Vision funcionando
3. Vídeo: extração de áudio + transcrição funcionando
4. Documentos: mensagem amigável informando limitação
5. Arquivos > 25MB: tratamento gracioso com resposta ao cliente
6. Testes e2e com cada tipo de mídia no número de teste

**Integration Verification:**
- IV1: Mensagens de texto continuam processando normalmente
- IV2: Webhook handler não quebra com mídia inesperada
- IV3: Custo de API dentro do esperado

---

### Story 1.5 — Tracking de Vendas Recuperadas

> Como **operador do RecuperaAI**, quero saber quais vendas foram efetivamente pagas, para que eu possa medir o ROI real do sistema.

**Acceptance Criteria:**
1. Webhook handler para `orders/paid` da Shopify e Nuvemshop
2. Reconciliação: order paga vinculada ao carrinho abandonado (por email/phone/cartId)
3. Status atualiza automaticamente: CONTACTING/RECOVERED → PAID
4. Registro de `paidAt`, `paidValue` no AbandonedCart
5. Dashboard sincroniza dados automaticamente ao conectar integração (FR10)
6. Indicador visual no carrinho e na conversa quando venda confirmada

**Integration Verification:**
- IV1: Webhooks existentes não afetados
- IV2: Schema migration adiciona sem quebrar
- IV3: Sync automático não duplica dados

---

### Story 1.6 — Métricas Granulares e Tracking de Links

> Como **operador do RecuperaAI**, quero métricas detalhadas (taxa de resposta, abertura, cliques, etapa de recuperação, desconto necessário), para que eu possa decidir por dados.

**Acceptance Criteria:**
1. Taxa de resposta: respondidas / enviadas (por período)
2. Taxa de abertura: DELIVERED→READ via webhook status Evolution API
3. Taxa de cliques: redirect interno (`/api/r/[code]`) que registra e redireciona
4. Registro de em qual stage a venda foi recuperada
5. Registro de qual % de desconto foi necessário
6. Métricas por etapa do funil: quantos chegam/convertem em cada stage
7. Expansão do DailyMetrics com novos campos
8. Custo por recuperação (tokens / vendas)

**Integration Verification:**
- IV1: DailyMetrics existente preservado
- IV2: Checkout URLs continuam funcionando (redirect é wrapper)
- IV3: Performance do webhook handler mantida (tracking assíncrono)

---

### Story 1.7 — Dashboard UI: Date Picker e Novas Métricas

> Como **operador do RecuperaAI**, quero filtrar a dashboard por datas customizadas e ver métricas granulares.

**Acceptance Criteria:**
1. Date range picker funcional (data início / data fim)
2. Dashboard responde ao filtro em todos os KPIs e gráficos
3. Novos KPI cards: taxa de resposta, taxa de abertura, taxa de cliques
4. Novo gráfico: funil de etapas
5. Novo gráfico: efetividade de desconto
6. Indicador de vendas confirmadas (pagas) vs recuperadas

**Integration Verification:**
- IV1: KPIs e gráficos existentes funcionando
- IV2: Filtros fixos (7d/30d/90d) continuam como atalhos
- IV3: Performance da rota `/api/dashboard` mantida

---

### Story 1.8 — UX e Onboarding Intuitivo

> Como **lojista usando o RecuperaAI pela primeira vez**, quero entender como a IA funciona e onde inserir meus dados.

**Acceptance Criteria:**
1. Tooltips/help text em cada campo do Knowledge Base
2. Indicadores de completude da configuração (barra de progresso)
3. Guia visual do fluxo: "Seus dados → IA → Mensagem"
4. Validação de link de checkout (URL acessível)
5. Preview de mensagem exemplo com dados configurados
6. Página de configurações implementada (sair do "Em breve")

**Integration Verification:**
- IV1: Formulários existentes preservados
- IV2: Dados salvos continuam válidos
- IV3: Nenhuma mudança no fluxo de salvamento

---

### Story 1.9 — QA Completa e Teste End-to-End

> Como **operador do RecuperaAI**, quero validação completa antes de ativar para clientes reais.

**Acceptance Criteria:**
1. Teste e2e completo: abandono → mensagem → resposta → desconto → link → venda
2. Todos os testes no número **5535998717592** exclusivamente
3. Teste de cada tipo de mídia
4. Teste de follow-ups (sequência completa)
5. Teste de edge cases: reclama, ignora, compra direto, pede para parar
6. Dashboard reflete dados dos testes corretamente
7. Métricas granulares computadas corretamente
8. Flag `testMode` para proteção contra envio acidental
9. Relatório de QA com todos os cenários e resultados

**Integration Verification:**
- IV1: Nenhum envio para números não autorizados
- IV2: Dados de teste identificados no banco
- IV3: Sistema pronto para ativar auto-send após aprovação

---

### Sequência de Dependências

```
Story 1.1 (Auditoria)
  └→ Story 1.2 (Stages) ──→ Story 1.3 (Follow-up)
                                └→ Story 1.4 (Mídia)
                                └→ Story 1.5 (Sales Tracking)
                                     └→ Story 1.6 (Métricas)
                                          └→ Story 1.7 (Dashboard UI)
                                └→ Story 1.8 (UX/Onboarding)
                                          └→ Story 1.9 (QA E2E)
```

---

_PRD gerado por Morgan (PM Agent) — Synkra AIOS_
_Data: 2026-03-01 | Versão: 1.0_
