# QA Report — Story 1.9: QA Completa e Teste End-to-End

**Data:** 2026-03-01
**Ambiente:** Vercel Production (https://recupera-ai-five.vercel.app/)
**Store:** Space Sports (cmm54nwiv000004lbfyiacicl)
**Telefone de teste:** 5535998717592
**testMode:** Ativo (whitelist)

---

## Resumo Executivo

| Métrica | Resultado |
|---------|-----------|
| Testes executados | 10 |
| Aprovados | 9 |
| Reprovados | 0 |
| N/A (requer dashboard) | 1 |
| Severidade máxima | Nenhum bug crítico |

**Veredicto: PASS**

---

## Testes Executados

### T1: Primeira Mensagem de Recuperação
- **Status:** PASS
- **Descrição:** Carrinho abandonado (Camisa Flamengo 2025/26 - R$249,90) com 35min desde abandono
- **Resultado:** Mensagem enviada via WhatsApp com sucesso
- **Mensagem recebida:** "Opa, Ivan! 🔴⚪ Vimos que você deixou a Camisa Flamengo 2025/26 no carrinho - que escolha maneira! Tinha alguma dúvida ou posso ajudar em algo?"
- **Validação:** IA mencionou produto correto, tom amigável, personalidade "Space"

### T2: Resposta a Mensagem do Cliente (Webhook)
- **Status:** PASS
- **Descrição:** Cliente respondeu "opa" e "como é a qualidade?" via WhatsApp
- **Resultado:** IA respondeu em tempo real com respostas contextualizadas
- **Intent detection:** Classificou como QUESTION (correto)
- **Resposta sobre qualidade:** Mencionou "oficial Adidas", "nota fiscal", "selo de autenticidade" — dados do Knowledge Base

### T3: Follow-Up Step 1 (6h — Incentivo)
- **Status:** PASS
- **Descrição:** Simulação de passagem de 7h desde última mensagem
- **Resultado:** 2a mensagem enviada com cupom VOLTA10 + frete grátis
- **Mensagem:** Aplicou estratégia correta ("oferecer ajuda, mencionar benefícios")
- **recoveryAttempts:** Incrementado para 2

### T4: Follow-Up Step 2 (24h — Última Tentativa)
- **Status:** PASS
- **Descrição:** Simulação de passagem de 25h desde última mensagem
- **Resultado:** 3a e última mensagem enviada com cupom + urgência
- **Mensagem:** "Tá valendo o cupom VOLTA10 com 10% OFF só pra você"
- **recoveryAttempts:** Incrementado para 3

### T5: Transição para LOST (Max Attempts)
- **Status:** PASS
- **Descrição:** Após 3 tentativas (máximo configurado), cron roda novamente
- **Resultado:** Cart status atualizado para LOST
- **Cron output:** `"lost": 1` confirmado

### T6: testMode Guard — Bloqueio de Telefones Não-Whitelisted
- **Status:** PASS
- **Descrição:** 47 carrinhos existentes com telefones fora da whitelist
- **Resultado:** Todos os 47 foram skipados com `"skipped": 47`
- **Validação:** Nenhuma mensagem vazou para telefones não-autorizados

### T7: Criação Automática de Conversa
- **Status:** PASS
- **Descrição:** Ao enviar primeira mensagem, conversa deve ser criada automaticamente
- **Resultado:** Conversation criada com status ACTIVE, vinculada ao cart
- **Messages:** 7 mensagens rastreadas (3 IA auto + 2 IA resposta + 2 Cliente)

### T8: Cron Endpoint com CRON_SECRET
- **Status:** PASS
- **Descrição:** Endpoint /api/cron/recovery requer Authorization: Bearer <CRON_SECRET>
- **Sem token:** Retorna 401 Unauthorized
- **Com token:** Retorna 200 com stats de processamento
- **Middleware:** Endpoint passa sem redirect (fix aplicado)

### T9: Métricas Diárias (calculateDailyMetrics)
- **Status:** PASS
- **Descrição:** Cron calcula métricas diárias automaticamente
- **Resultado:** `"storesProcessed": 1, "metricsUpserted": 1, "errors": 0`
- **Validação:** Métricas calculadas a cada execução do cron

### T10: Dashboard Métricas via API
- **Status:** N/A (requer autenticação por cookie de sessão)
- **Nota:** Endpoint /api/dashboard retorna redirect sem cookie válido, comportamento correto
- **Recomendação:** Testar via UI do dashboard logando com credenciais

---

## Bugs Encontrados e Corrigidos

### Bug 1: cartItems como JSON string
- **Severidade:** HIGH
- **Descrição:** Ao salvar cartItems com JSON.stringify(), o campo ficou como string em vez de array
- **Sintoma:** `t.map is not a function` no recovery engine
- **Correção:** Salvar cartItems como array nativo (Prisma Json type aceita objetos diretamente)
- **Status:** CORRIGIDO

### Bug 2: Middleware bloqueando /api/cron
- **Severidade:** CRITICAL
- **Descrição:** O endpoint /api/cron/recovery não estava na lista de publicPaths do middleware
- **Sintoma:** Cron retornava 307 redirect para /login
- **Correção:** Adicionado '/api/cron' e '/api/r/' à lista publicPaths
- **Commit:** bfc1c538
- **Status:** CORRIGIDO

### Bug 3: Vercel deploy não triggerando automaticamente
- **Severidade:** MEDIUM
- **Descrição:** Push para fork/main não triggerou deploy automático no Vercel
- **Workaround:** Deploy manual via `npx vercel --prod`
- **Recomendação:** Verificar integração Git do Vercel com o repositório
- **Status:** WORKAROUND APLICADO

---

## Cobertura de Acceptance Criteria (PRD Story 1.9)

| AC | Descrição | Status |
|----|-----------|--------|
| AC1 | testMode flag implementado | PASS |
| AC2 | testPhones whitelist funcional | PASS |
| AC3 | Guard em scheduler, test-message, message-processor | PASS |
| AC4 | Primeira mensagem via cron | PASS |
| AC5 | Follow-ups (3 steps) executados | PASS |
| AC6 | Respostas do cliente processadas (webhook) | PASS |
| AC7 | Intent classification (QUESTION) | PASS |
| AC8 | Transição LOST após max attempts | PASS |
| AC9 | QA Report gerado | PASS (este documento) |

---

## Performance

| Métrica | Valor |
|---------|-------|
| Tempo médio do cron (48 carts) | ~26s |
| Tempo de resposta IA (webhook) | ~5s |
| Build time (Vercel) | 17s |

---

## Recomendações

1. **Vercel Git Integration:** Verificar e reconectar integração para deploys automáticos
2. **Dashboard E2E:** Testar login, visualização de métricas e conversas pela UI
3. **Opt-out test:** Criar cenário onde cliente pede para parar de receber mensagens
4. **Media test:** Testar envio de imagens/áudio quando suportado
5. **Produção:** Antes de desativar testMode, configurar monitoramento de erros (Sentry/similar)

---

*Relatório gerado automaticamente como parte da Story 1.9 — QA Completa e Teste E2E*
