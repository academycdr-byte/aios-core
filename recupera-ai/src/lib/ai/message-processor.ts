/**
 * Message Processor
 * Handles incoming customer messages: classifies intent, decides action,
 * generates AI reply, sends via WhatsApp, and updates database metrics.
 */

import { prisma } from '@/lib/prisma'
import { evolutionApi } from '@/lib/evolution-api'
import { recoveryEngine } from '@/lib/ai/recovery-engine'
import type { MediaAttachment } from '@/lib/ai/recovery-engine'
import type { Message, StoreSettings, AbandonedCart, AbandonmentReason, RecoveryStage } from '@/types'

// ============================================================
// INTENT -> ABANDONMENT REASON MAPPING
// ============================================================

const INTENT_TO_REASON: Record<string, AbandonmentReason> = {
  OBJECTION_PRICE: 'PRICE',
  OBJECTION_SHIPPING: 'SHIPPING',
  OBJECTION_PRODUCT: 'PRODUCT_DOUBT',
  NOT_INTERESTED: 'CHANGED_MIND',
  ANGRY: 'OTHER',
}

function mapIntentToReason(intent: string): AbandonmentReason | null {
  return INTENT_TO_REASON[intent] ?? null
}

// ============================================================
// TYPES
// ============================================================

export interface ProcessResult {
  action: 'replied' | 'recovered' | 'lost' | 'escalated' | 'error'
  intent: string
  aiMessage: string | null
  tokensUsed: number
  estimatedCost: number
  error?: string
}

// ============================================================
// MAIN PROCESSOR
// ============================================================

/**
 * Process an incoming customer message:
 * 1. Load conversation context (cart, store settings, history)
 * 2. Classify customer intent
 * 3. Decide action based on intent + conversation state
 * 4. Generate AI response (if appropriate)
 * 5. Send via WhatsApp
 * 6. Update database (metrics, status)
 */
export async function processIncomingMessage(
  conversationId: string,
  customerMessage: string,
  media?: MediaAttachment | null
): Promise<ProcessResult> {
  try {
    // ----------------------------------------------------------
    // 1. Load full conversation context
    // ----------------------------------------------------------
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        store: {
          include: {
            settings: true,
            recoveryConfig: true,
            recoveryStages: { orderBy: { order: 'asc' } },
          },
        },
        abandonedCart: true,
        messages: {
          orderBy: { sentAt: 'asc' },
          take: 50,
        },
      },
    })

    if (!conversation) {
      console.error(`[MessageProcessor] Conversation not found: ${conversationId}`)
      return {
        action: 'error',
        intent: 'UNKNOWN',
        aiMessage: null,
        tokensUsed: 0,
        estimatedCost: 0,
        error: 'Conversation not found',
      }
    }

    const store = conversation.store
    const settings = store.settings as unknown as StoreSettings | null
    const cart = conversation.abandonedCart as unknown as AbandonedCart | null
    const messages = conversation.messages as unknown as Message[]
    const stages = (store.recoveryStages ?? []) as unknown as RecoveryStage[]

    // Resolve current stage
    const currentStageOrder = conversation.currentStageOrder ?? 1
    const currentStage = stages.find((s) => s.order === currentStageOrder) ?? stages[0] ?? null

    // If no settings, we cannot build a proper system prompt
    if (!settings) {
      console.warn(`[MessageProcessor] No settings for store ${store.id}, skipping AI response`)
      return {
        action: 'error',
        intent: 'UNKNOWN',
        aiMessage: null,
        tokensUsed: 0,
        estimatedCost: 0,
        error: 'Store settings not configured',
      }
    }

    // ----------------------------------------------------------
    // 2. Classify customer intent
    // ----------------------------------------------------------
    const intentResult = await recoveryEngine.classifyIntent(customerMessage, media)
    const { intent } = intentResult

    console.log(
      `[MessageProcessor] Intent: ${intent} (confidence: ${intentResult.confidence}) for conversation ${conversationId}`
    )

    // Persist intent on the customer message (find the most recent CUSTOMER message)
    const lastCustomerMsg = await prisma.message.findFirst({
      where: { conversationId, role: 'CUSTOMER' },
      orderBy: { sentAt: 'desc' },
    })
    if (lastCustomerMsg) {
      await prisma.message.update({
        where: { id: lastCustomerMsg.id },
        data: { intent },
      })
    }

    // Count total messages in conversation (to decide escalation)
    const messageCount = messages.length

    // ----------------------------------------------------------
    // 3. Decide action based on intent
    // ----------------------------------------------------------

    // 3a. COMPLETED: Customer says they bought / will buy
    if (intent === 'COMPLETED') {
      // Generate a thank-you message
      const result = await recoveryEngine.generateReply(cart, settings, messages, customerMessage, media, currentStage)

      // Send via WhatsApp
      await sendWhatsAppMessage(store.id, conversation.customerPhone, result.message)

      // Save AI message to DB
      await saveAIMessage(conversationId, result)

      // Update cart to RECOVERED with stage tracking
      if (cart) {
        await prisma.abandonedCart.update({
          where: { id: cart.id },
          data: {
            status: 'RECOVERED',
            recoveredAt: new Date(),
            recoveredValue: cart.cartTotal,
            recoveredAtStage: currentStageOrder,
            discountUsed: conversation.discountOffered,
          },
        })
      }

      // Close conversation as RECOVERED
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          status: 'RECOVERED',
          closedAt: new Date(),
          closingReason: 'Cliente confirmou compra',
          totalTokens: { increment: result.tokensUsed },
          estimatedCost: { increment: result.estimatedCost },
          aiModel: result.model,
          lastMessageAt: new Date(),
        },
      })

      return {
        action: 'recovered',
        intent,
        aiMessage: result.message,
        tokensUsed: result.tokensUsed,
        estimatedCost: result.estimatedCost,
      }
    }

    // 3b. OPT_OUT: Customer explicitly asked to stop
    if (intent === 'OPT_OUT') {
      // Send farewell message
      const result = await recoveryEngine.generateReply(cart, settings, messages, customerMessage, media, currentStage)
      await sendWhatsAppMessage(store.id, conversation.customerPhone, result.message)
      await saveAIMessage(conversationId, result)

      // Mark cart as lost
      if (cart) {
        await prisma.abandonedCart.update({
          where: { id: cart.id },
          data: { status: 'LOST' },
        })
      }

      // Close conversation
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          status: 'LOST',
          closedAt: new Date(),
          closingReason: 'Cliente pediu para parar (opt-out)',
          totalTokens: { increment: result.tokensUsed },
          estimatedCost: { increment: result.estimatedCost },
          aiModel: result.model,
          lastMessageAt: new Date(),
        },
      })

      return {
        action: 'lost',
        intent,
        aiMessage: result.message,
        tokensUsed: result.tokensUsed,
        estimatedCost: result.estimatedCost,
      }
    }

    // 3c. ANGRY: Escalate to human
    if (intent === 'ANGRY') {
      // Mark as escalated without sending AI reply
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          status: 'ESCALATED',
          lastMessageAt: new Date(),
          closingReason: 'Cliente irritado - escalado para humano',
          abandonmentReason: mapIntentToReason(intent),
        },
      })

      // Save system message noting escalation
      await prisma.message.create({
        data: {
          conversationId,
          role: 'SYSTEM',
          content: `Conversa escalada para atendimento humano. Motivo: cliente irritado (intent: ${intent})`,
          messageStatus: 'SENT',
        },
      })

      return {
        action: 'escalated',
        intent,
        aiMessage: null,
        tokensUsed: 0,
        estimatedCost: 0,
      }
    }

    // 3d. NOT_INTERESTED after 3+ messages: Mark as lost
    if (intent === 'NOT_INTERESTED' && messageCount >= 3) {
      // Generate a polite goodbye message
      const result = await recoveryEngine.generateReply(cart, settings, messages, customerMessage, media, currentStage)

      // Send via WhatsApp
      await sendWhatsAppMessage(store.id, conversation.customerPhone, result.message)

      // Save AI message to DB
      await saveAIMessage(conversationId, result)

      // Update cart to LOST
      if (cart) {
        await prisma.abandonedCart.update({
          where: { id: cart.id },
          data: { status: 'LOST' },
        })
      }

      // Close conversation as LOST
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          status: 'LOST',
          closedAt: new Date(),
          closingReason: `Cliente nao interessado (intent: ${intent})`,
          abandonmentReason: mapIntentToReason(intent),
          totalTokens: { increment: result.tokensUsed },
          estimatedCost: { increment: result.estimatedCost },
          aiModel: result.model,
          lastMessageAt: new Date(),
        },
      })

      return {
        action: 'lost',
        intent,
        aiMessage: result.message,
        tokensUsed: result.tokensUsed,
        estimatedCost: result.estimatedCost,
      }
    }

    // 3e. Check if should escalate based on message count + intent
    if (recoveryEngine.shouldEscalate(intent, messageCount)) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          status: 'ESCALATED',
          lastMessageAt: new Date(),
          closingReason: `Escalado: ${messageCount}+ mensagens, intent: ${intent}`,
          abandonmentReason: mapIntentToReason(intent),
        },
      })

      await prisma.message.create({
        data: {
          conversationId,
          role: 'SYSTEM',
          content: `Conversa escalada para atendimento humano. Motivo: ${messageCount}+ mensagens, intent: ${intent}`,
          messageStatus: 'SENT',
        },
      })

      return {
        action: 'escalated',
        intent,
        aiMessage: null,
        tokensUsed: 0,
        estimatedCost: 0,
      }
    }

    // 3f. Default: Generate AI reply and send
    const result = await recoveryEngine.generateReply(cart, settings, messages, customerMessage, media, currentStage)

    // Send via WhatsApp
    await sendWhatsAppMessage(store.id, conversation.customerPhone, result.message)

    // Save AI message to DB
    await saveAIMessage(conversationId, result)

    // Advance to next stage (each customer interaction moves to next stage)
    const nextStageOrder = stages.length > 0
      ? Math.min(currentStageOrder + 1, Math.max(...stages.map((s) => s.order)))
      : currentStageOrder

    // Track discount if current stage has discount enabled
    const discountUpdate = currentStage?.discountEnabled && currentStage?.discountPercent
      ? { discountOffered: currentStage.discountPercent }
      : {}

    // Update conversation metrics + advance stage
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        totalTokens: { increment: result.tokensUsed },
        estimatedCost: { increment: result.estimatedCost },
        aiModel: result.model,
        lastMessageAt: new Date(),
        currentStageOrder: nextStageOrder,
        ...discountUpdate,
      },
    })

    return {
      action: 'replied',
      intent,
      aiMessage: result.message,
      tokensUsed: result.tokensUsed,
      estimatedCost: result.estimatedCost,
    }
  } catch (error) {
    console.error('[MessageProcessor] Error processing message:', error)
    return {
      action: 'error',
      intent: 'UNKNOWN',
      aiMessage: null,
      tokensUsed: 0,
      estimatedCost: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Send a message via WhatsApp using Evolution API.
 * Silently logs errors instead of throwing (message is still saved in DB).
 */
async function sendWhatsAppMessage(
  storeId: string,
  phone: string,
  message: string
): Promise<void> {
  try {
    if (!evolutionApi.isConfigured()) {
      console.warn('[MessageProcessor] Evolution API not configured, skipping WhatsApp send')
      return
    }

    // testMode guard: only send to whitelisted phone numbers
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { testMode: true, testPhones: true },
    })
    if (store?.testMode) {
      const whitelisted = (store.testPhones ?? []) as string[]
      if (!whitelisted.includes(phone)) {
        console.warn(`[MessageProcessor] testMode: blocked send to non-whitelisted phone ${phone}`)
        return
      }
    }

    const instanceName = `recupera-${storeId}`
    await evolutionApi.sendText(instanceName, phone, message)
    console.log(`[MessageProcessor] WhatsApp message sent to ${phone}`)
  } catch (error) {
    console.error(
      `[MessageProcessor] Failed to send WhatsApp message to ${phone}:`,
      error instanceof Error ? error.message : error
    )
  }
}

/**
 * Save the AI-generated message to the database.
 */
async function saveAIMessage(
  conversationId: string,
  result: { message: string; tokensUsed: number; model: string }
): Promise<void> {
  await prisma.message.create({
    data: {
      conversationId,
      role: 'AI',
      content: result.message,
      messageStatus: 'SENT',
      tokensUsed: result.tokensUsed,
      modelUsed: result.model,
    },
  })
}
