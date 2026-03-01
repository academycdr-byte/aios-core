/**
 * Recovery Engine
 * Core AI engine for generating recovery messages and classifying customer intent.
 * Uses Claude Haiku 4.5 for low cost + fast responses.
 * Falls back to mock responses when ANTHROPIC_API_KEY is not configured.
 */

import Anthropic from '@anthropic-ai/sdk'
import type { StoreSettings, RecoveryConfig, AbandonedCart, Message, RecoveryStage } from '@/types'
import { buildSystemPrompt } from '@/lib/ai/system-prompt-builder'

// ============================================================
// TYPES
// ============================================================

export type CustomerIntent =
  | 'INTERESTED'
  | 'OBJECTION_PRICE'
  | 'OBJECTION_SHIPPING'
  | 'OBJECTION_PRODUCT'
  | 'COMPLETED'
  | 'NOT_INTERESTED'
  | 'QUESTION'
  | 'ANGRY'
  | 'OPT_OUT'

export interface GenerationResult {
  message: string
  tokensUsed: number
  model: string
  estimatedCost: number
}

export interface IntentResult {
  intent: CustomerIntent
  confidence: number
  reasoning: string
}

/**
 * Media attachment from a WhatsApp message (image, video, audio).
 * Used to send visual content to Claude for multimodal analysis.
 */
export interface MediaAttachment {
  type: 'image' | 'video' | 'audio' | 'document'
  base64: string
  mimeType: string
  caption?: string
}

// ============================================================
// COST CALCULATION
// ============================================================

// Claude Haiku 4.5 pricing: $1.00/1M input, $5.00/1M output
const MODEL = 'claude-haiku-4-5-20251001'
const INPUT_COST_PER_TOKEN = 1.0 / 1_000_000
const OUTPUT_COST_PER_TOKEN = 5.0 / 1_000_000

function calculateCost(inputTokens: number, outputTokens: number): number {
  return inputTokens * INPUT_COST_PER_TOKEN + outputTokens * OUTPUT_COST_PER_TOKEN
}

// ============================================================
// MOCK RESPONSES
// ============================================================

const MOCK_FIRST_MESSAGES = [
  'Oi {name}! Vi que voce deixou alguns produtos no carrinho. Posso ajudar com alguma duvida? {emoji}',
  'Ola {name}! Notei que voce se interessou por nossos produtos. Tem alguma duvida que posso esclarecer? {emoji}',
  'Oi {name}! Seus produtos ainda estao esperando por voce. Quer que eu ajude a finalizar? {emoji}',
]

const MOCK_FOLLOWUP_MESSAGES = [
  'Oi {name}! Seus produtos ainda estao disponiveis. Posso ajudar com algo? {emoji}',
  '{name}, so passando pra lembrar que seu carrinho ainda ta aqui! Quer finalizar? {emoji}',
  'Ola {name}! Ultima chance de garantir seus produtos. Posso tirar alguma duvida? {emoji}',
]

const MOCK_REPLY_MESSAGES: Record<CustomerIntent, string[]> = {
  INTERESTED: [
    'Que otimo! Para finalizar sua compra, e so acessar o link do checkout. Posso enviar pra voce!',
    'Fico feliz! Vou te ajudar a concluir. Precisa de algo mais?',
  ],
  OBJECTION_PRICE: [
    'Entendo sua preocupacao com o valor. Nossos produtos tem otima qualidade e custo-beneficio!',
    'Compreendo! Posso verificar se temos alguma condicao especial pra voce.',
  ],
  OBJECTION_SHIPPING: [
    'Entendo! O frete pode variar. Posso verificar as opcoes de entrega pra sua regiao.',
    'Compreendo a preocupacao com o frete. Temos opcoes que podem se encaixar melhor!',
  ],
  OBJECTION_PRODUCT: [
    'Boa pergunta! Vou te passar todas as informacoes sobre o produto.',
    'Claro, posso tirar essa duvida! Me conta mais sobre o que voce precisa saber.',
  ],
  COMPLETED: [
    'Que otimo saber! Muito obrigado pela compra. Qualquer coisa, estamos aqui!',
    'Maravilha! Obrigado por comprar conosco. Se precisar de algo, e so chamar!',
  ],
  NOT_INTERESTED: [
    'Tudo bem, sem problemas! Se mudar de ideia, estamos por aqui. Obrigado!',
    'Entendo! Sem pressao. Se precisar de algo no futuro, conte conosco.',
  ],
  QUESTION: [
    'Boa pergunta! Deixa eu verificar isso pra voce.',
    'Vou checar essa informacao e ja te retorno!',
  ],
  ANGRY: [
    'Peco desculpas pelo incomodo! Vou encaminhar voce para nosso atendimento humano agora mesmo.',
    'Sinto muito pela experiencia. Vou transferir voce para um atendente que pode resolver isso.',
  ],
  OPT_OUT: [
    'Tudo bem! Nao vou mais enviar mensagens. Se precisar de algo, e so chamar. Obrigado!',
    'Entendido! Vou parar por aqui. Se mudar de ideia, estamos disponiveis. Ate mais!',
  ],
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function fillTemplate(template: string, customerName: string | null): string {
  const emojis = ['😊', '🛒', '✨', '💙', '🎉']
  return template
    .replace(/\{name\}/g, customerName || 'Oi')
    .replace(/\{emoji\}/g, pickRandom(emojis))
}

// ============================================================
// ANTHROPIC CLIENT (lazy singleton)
// ============================================================

let anthropicClient: Anthropic | null = null

function getAnthropic(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return anthropicClient
}

function isAIConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

// ============================================================
// RECOVERY ENGINE CLASS
// ============================================================

export class RecoveryEngine {
  /**
   * Generate the first recovery message for an abandoned cart.
   */
  async generateFirstMessage(
    cart: AbandonedCart,
    settings: StoreSettings,
    config: RecoveryConfig | null,
    stage?: RecoveryStage | null,
    stepStrategy?: string | null
  ): Promise<GenerationResult> {
    // If store has a template configured, use it directly
    if (config?.firstMessageTemplate) {
      return {
        message: fillTemplate(config.firstMessageTemplate, cart.customerName),
        tokensUsed: 0,
        model: 'template',
        estimatedCost: 0,
      }
    }

    const client = getAnthropic()
    if (!client) {
      return this.mockFirstMessage(cart)
    }

    const systemPrompt = buildSystemPrompt(settings, config, cart, stage)
    const stageContext = stage
      ? `\nSiga as instrucoes da Etapa ${stage.order} (${stage.name}).`
      : ''
    const strategyContext = stepStrategy
      ? `\nEstrategia para esta mensagem: ${stepStrategy}`
      : ''
    const userPrompt = `Gere a PRIMEIRA mensagem de recuperacao para este cliente.
O cliente abandonou o carrinho com valor ${formatCurrencySimple(cart.cartTotal, cart.currency)}.
Nome do cliente: ${cart.customerName || 'nao informado'}.${stageContext}${strategyContext}
Seja natural, breve (2-3 frases) e gere curiosidade ou urgencia sutil.
Responda SOMENTE com a mensagem, sem explicacoes.`

    return this.callClaude(client, systemPrompt, userPrompt)
  }

  /**
   * Generate a follow-up message (2nd, 3rd, etc.).
   */
  async generateFollowUp(
    cart: AbandonedCart,
    settings: StoreSettings,
    config: RecoveryConfig | null,
    messageNumber: number,
    stage?: RecoveryStage | null,
    stepStrategy?: string | null
  ): Promise<GenerationResult> {
    // Check for configured templates
    const templateMap: Record<number, string | null | undefined> = {
      2: config?.followUp1Template,
      3: config?.followUp2Template,
      4: config?.followUp3Template,
    }

    const template = templateMap[messageNumber]
    if (template) {
      return {
        message: fillTemplate(template, cart.customerName),
        tokensUsed: 0,
        model: 'template',
        estimatedCost: 0,
      }
    }

    const client = getAnthropic()
    if (!client) {
      return this.mockFollowUp(cart)
    }

    const systemPrompt = buildSystemPrompt(settings, config, cart, stage)
    const urgencyLevel =
      messageNumber >= 3 ? 'alta (ultima tentativa)' : 'media'

    const stageContext = stage
      ? `\nSiga as instrucoes da Etapa ${stage.order} (${stage.name}).`
      : ''
    const strategyContext = stepStrategy
      ? `\nEstrategia para este follow-up: ${stepStrategy}`
      : ''
    const userPrompt = `Gere a mensagem de FOLLOW-UP #${messageNumber} para este cliente.
O cliente NAO respondeu as mensagens anteriores.
Nivel de urgencia: ${urgencyLevel}.${stageContext}${strategyContext}
${messageNumber >= 3 ? 'Esta e a ULTIMA tentativa. Use escassez ou beneficio exclusivo se possivel.' : 'Tente um angulo diferente da mensagem anterior.'}
Nome do cliente: ${cart.customerName || 'nao informado'}.
Responda SOMENTE com a mensagem, sem explicacoes.`

    return this.callClaude(client, systemPrompt, userPrompt)
  }

  /**
   * Generate a reply to a customer message within a conversation.
   * Supports multimodal: if `media` is provided (image), it's sent to Claude for visual analysis.
   */
  async generateReply(
    cart: AbandonedCart | null,
    settings: StoreSettings,
    conversationHistory: Message[],
    customerMessage: string,
    media?: MediaAttachment | null,
    stage?: RecoveryStage | null
  ): Promise<GenerationResult> {
    const client = getAnthropic()
    if (!client) {
      const intent = await this.classifyIntent(customerMessage)
      return this.mockReply(cart, intent.intent)
    }

    const systemPrompt = buildSystemPrompt(settings, null, cart, stage)

    // Build conversation messages for context
    const messages: Anthropic.MessageParam[] = []

    // Add conversation history (last 20 messages for context window management)
    const recentHistory = conversationHistory.slice(-20)
    for (const msg of recentHistory) {
      if (msg.role === 'AI') {
        messages.push({ role: 'assistant', content: msg.content })
      } else if (msg.role === 'CUSTOMER') {
        messages.push({ role: 'user', content: msg.content })
      }
    }

    // Add the new customer message (with image if present)
    if (media && media.type === 'image') {
      const contentBlocks: Anthropic.ContentBlockParam[] = [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: media.mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
            data: media.base64,
          },
        },
        {
          type: 'text',
          text: customerMessage || '[Cliente enviou uma imagem]',
        },
      ]
      messages.push({ role: 'user', content: contentBlocks })
    } else {
      messages.push({ role: 'user', content: customerMessage })
    }

    // Ensure messages alternate correctly (Claude requires user/assistant alternation)
    const sanitizedMessages = sanitizeMessages(messages)

    return this.callClaudeChat(client, systemPrompt, sanitizedMessages)
  }

  /**
   * Classify the intent of a customer message.
   * Supports multimodal: if `media` is provided, the image is analyzed for intent context.
   */
  async classifyIntent(customerMessage: string, media?: MediaAttachment | null): Promise<IntentResult> {
    const client = getAnthropic()
    if (!client) {
      return this.mockClassifyIntent(customerMessage)
    }

    const classificationPrompt = `Voce e um classificador de intencao de mensagens de clientes em um contexto de recuperacao de vendas (carrinho abandonado, pix pendente, cartao recusado).

Classifique a mensagem do cliente em UMA das seguintes categorias:
- INTERESTED: cliente quer comprar ou demonstra interesse
- OBJECTION_PRICE: cliente acha caro ou reclama do preco (inclui screenshots de precos de concorrentes)
- OBJECTION_SHIPPING: cliente reclama do frete ou prazo de entrega
- OBJECTION_PRODUCT: cliente tem duvida sobre o produto (inclui fotos do produto, screenshots de especificacoes)
- COMPLETED: cliente diz que ja comprou ou vai comprar agora (inclui screenshots de comprovante de pagamento)
- NOT_INTERESTED: cliente nao quer comprar
- QUESTION: pergunta generica (inclui prints/imagens com duvidas)
- ANGRY: cliente irritado, reclamando ou xingando
- OPT_OUT: cliente pediu explicitamente para parar de receber mensagens

Se o cliente enviou uma imagem, analise o conteudo visual para classificar a intencao.
Responda SOMENTE em JSON: {"intent": "CATEGORY", "confidence": 0.0-1.0, "reasoning": "breve explicacao"}`

    try {
      // Build user content - multimodal if image attached
      let userContent: Anthropic.ContentBlockParam[] | string
      if (media && media.type === 'image') {
        userContent = [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: media.mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
              data: media.base64,
            },
          },
          {
            type: 'text',
            text: customerMessage || '[Cliente enviou uma imagem sem texto]',
          },
        ]
      } else {
        userContent = customerMessage
      }

      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 150,
        system: classificationPrompt,
        messages: [
          { role: 'user', content: userContent },
        ],
      })

      const content = response.content[0]?.type === 'text'
        ? response.content[0].text.trim()
        : ''

      // Extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as IntentResult
        return {
          intent: parsed.intent,
          confidence: parsed.confidence ?? 0.8,
          reasoning: parsed.reasoning ?? '',
        }
      }

      return { intent: 'QUESTION', confidence: 0.5, reasoning: 'Failed to parse classification' }
    } catch (error) {
      console.error('[RecoveryEngine] Intent classification error:', error)
      return this.mockClassifyIntent(customerMessage)
    }
  }

  /**
   * Determine if the conversation should be escalated to a human agent.
   */
  shouldEscalate(intent: CustomerIntent, messageCount: number): boolean {
    // Always escalate angry customers
    if (intent === 'ANGRY') return true

    // Escalate after too many messages without resolution
    if (messageCount >= 10) return true

    // Escalate repeated objections (customer sent 6+ messages and still has objections)
    if (messageCount >= 6 && intent.startsWith('OBJECTION_')) return true

    return false
  }

  // ============================================================
  // PRIVATE: Claude API calls
  // ============================================================

  private async callClaude(
    client: Anthropic,
    systemPrompt: string,
    userPrompt: string
  ): Promise<GenerationResult> {
    return this.callClaudeChat(client, systemPrompt, [
      { role: 'user', content: userPrompt },
    ])
  }

  private async callClaudeChat(
    client: Anthropic,
    systemPrompt: string,
    messages: Anthropic.MessageParam[]
  ): Promise<GenerationResult> {
    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 300,
        system: systemPrompt,
        messages,
      })

      const content = response.content[0]?.type === 'text'
        ? response.content[0].text.trim()
        : ''
      const inputTokens = response.usage.input_tokens
      const outputTokens = response.usage.output_tokens
      const totalTokens = inputTokens + outputTokens

      return {
        message: content,
        tokensUsed: totalTokens,
        model: MODEL,
        estimatedCost: calculateCost(inputTokens, outputTokens),
      }
    } catch (error) {
      console.error('[RecoveryEngine] Claude API error:', error)
      throw new Error(
        `Failed to generate AI message: ${error instanceof Error ? error.message : 'Unknown'}`
      )
    }
  }

  // ============================================================
  // PRIVATE: Mock responses (when ANTHROPIC_API_KEY not set)
  // ============================================================

  private mockFirstMessage(cart: AbandonedCart): GenerationResult {
    const template = pickRandom(MOCK_FIRST_MESSAGES)
    return {
      message: fillTemplate(template, cart.customerName),
      tokensUsed: 0,
      model: 'mock',
      estimatedCost: 0,
    }
  }

  private mockFollowUp(cart: AbandonedCart): GenerationResult {
    const template = pickRandom(MOCK_FOLLOWUP_MESSAGES)
    return {
      message: fillTemplate(template, cart.customerName),
      tokensUsed: 0,
      model: 'mock',
      estimatedCost: 0,
    }
  }

  private mockReply(cart: AbandonedCart | null, intent: CustomerIntent): GenerationResult {
    const templates = MOCK_REPLY_MESSAGES[intent] || MOCK_REPLY_MESSAGES.QUESTION
    const message = fillTemplate(pickRandom(templates), cart?.customerName ?? null)
    return {
      message,
      tokensUsed: 0,
      model: 'mock',
      estimatedCost: 0,
    }
  }

  private mockClassifyIntent(customerMessage: string): IntentResult {
    const lower = customerMessage.toLowerCase()

    // Keyword-based classification for mock mode
    if (/comprei|ja comprei|ja paguei|vou comprar|finaliz/i.test(lower)) {
      return { intent: 'COMPLETED', confidence: 0.9, reasoning: 'Keywords: compra realizada' }
    }
    if (/caro|preco|desconto|barato|valor alto|nao tenho dinheiro/i.test(lower)) {
      return { intent: 'OBJECTION_PRICE', confidence: 0.85, reasoning: 'Keywords: preco' }
    }
    if (/frete|entrega|demora|prazo|envio|correio/i.test(lower)) {
      return { intent: 'OBJECTION_SHIPPING', confidence: 0.85, reasoning: 'Keywords: frete' }
    }
    if (/tamanho|cor|material|funciona|como usa|medida|especifica/i.test(lower)) {
      return { intent: 'OBJECTION_PRODUCT', confidence: 0.8, reasoning: 'Keywords: produto' }
    }
    if (/pare|para de mandar|nao mande mais|saia|me tire|bloque|stop|remov|descadast/i.test(lower)) {
      return { intent: 'OPT_OUT', confidence: 0.95, reasoning: 'Keywords: opt-out explicito' }
    }
    if (/nao quero|nao preciso|cancela|spam|some|nao me mande/i.test(lower)) {
      return { intent: 'NOT_INTERESTED', confidence: 0.9, reasoning: 'Keywords: desinteresse' }
    }
    if (/absurdo|palha[cç]ada|merda|porra|lixo|droga|raiva|irritad/i.test(lower)) {
      return { intent: 'ANGRY', confidence: 0.95, reasoning: 'Keywords: raiva' }
    }
    if (/quero|interessad|gostei|legal|sim|pode ser|bora|manda/i.test(lower)) {
      return { intent: 'INTERESTED', confidence: 0.75, reasoning: 'Keywords: interesse' }
    }

    return { intent: 'QUESTION', confidence: 0.6, reasoning: 'Default: pergunta generica' }
  }
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Extract text from a message's content (handles both string and content block arrays).
 */
function extractText(content: Anthropic.MessageParam['content']): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .filter((b): b is Anthropic.TextBlockParam => b.type === 'text')
      .map(b => b.text)
      .join('\n')
  }
  return ''
}

/**
 * Ensure messages alternate between user and assistant roles.
 * Claude requires strict alternation - merge consecutive same-role messages.
 * Supports multimodal content (image + text blocks).
 */
function sanitizeMessages(messages: Anthropic.MessageParam[]): Anthropic.MessageParam[] {
  if (messages.length === 0) return [{ role: 'user', content: '...' }]

  const result: Anthropic.MessageParam[] = []

  for (const msg of messages) {
    const last = result[result.length - 1]
    if (last && last.role === msg.role) {
      // Merge consecutive same-role messages
      // If either has multimodal content (arrays), merge as text to avoid complexity
      const lastText = extractText(last.content)
      const msgText = extractText(msg.content)

      // If the NEW message has image blocks, keep them and append previous text
      if (Array.isArray(msg.content) && msg.content.some(b => b.type === 'image')) {
        const blocks: Anthropic.ContentBlockParam[] = []
        if (lastText) blocks.push({ type: 'text', text: lastText })
        blocks.push(...(msg.content as Anthropic.ContentBlockParam[]))
        last.content = blocks
      } else {
        last.content = `${lastText}\n${msgText}`
      }
    } else {
      result.push({ ...msg })
    }
  }

  // Ensure first message is from user
  if (result.length > 0 && result[0].role !== 'user') {
    result.unshift({ role: 'user', content: '(inicio da conversa)' })
  }

  return result
}

// ============================================================
// SINGLETON
// ============================================================

const globalForEngine = globalThis as unknown as { recoveryEngine: RecoveryEngine }

export const recoveryEngine =
  globalForEngine.recoveryEngine || new RecoveryEngine()

if (process.env.NODE_ENV !== 'production') {
  globalForEngine.recoveryEngine = recoveryEngine
}

// ============================================================
// HELPERS (module-level)
// ============================================================

function formatCurrencySimple(value: number, currency = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(value)
}

/**
 * Helper to check if AI is configured (useful for UI status)
 */
export { isAIConfigured }
