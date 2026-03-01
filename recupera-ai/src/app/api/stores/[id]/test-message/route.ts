import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth-utils'
import { recoveryEngine } from '@/lib/ai/recovery-engine'
import { evolutionApi, normalizeBrazilPhone } from '@/lib/evolution-api'
import type { AbandonedCart, StoreSettings, RecoveryConfig } from '@/types'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * POST /api/stores/[id]/test-message
 * Generate an AI recovery message and optionally send via WhatsApp.
 *
 * Body: { phone: string, cartId?: string, sendWhatsApp?: boolean }
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = await context.params
    const store = await prisma.store.findFirst({
      where: { id, userId: user.id },
      include: {
        settings: true,
        recoveryConfig: true,
      },
    })

    if (!store) {
      return NextResponse.json(
        { error: 'not_found', message: 'Store not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { phone, cartId, sendWhatsApp = true } = body as {
      phone: string
      cartId?: string
      sendWhatsApp?: boolean
    }

    if (!phone || phone.replace(/\D/g, '').length < 8) {
      return NextResponse.json(
        { error: 'bad_request', message: 'A valid phone number is required' },
        { status: 400 }
      )
    }

    const cleanPhone = normalizeBrazilPhone(phone)

    // testMode guard: only allow whitelisted phone numbers
    if (store.testMode) {
      const whitelisted = (store.testPhones ?? []) as string[]
      if (!whitelisted.includes(cleanPhone)) {
        return NextResponse.json(
          {
            error: 'test_mode_restricted',
            message: `Modo de teste ativo. Adicione ${cleanPhone} na lista de telefones permitidos nas configuracoes da loja.`,
          },
          { status: 403 }
        )
      }
    }

    // Build cart context
    let cart: AbandonedCart

    if (cartId) {
      const dbCart = await prisma.abandonedCart.findFirst({
        where: { id: cartId, storeId: id },
      })
      if (!dbCart) {
        return NextResponse.json(
          { error: 'not_found', message: 'Cart not found' },
          { status: 404 }
        )
      }
      cart = {
        ...dbCart,
        cartItems: dbCart.cartItems as unknown as AbandonedCart['cartItems'],
        type: dbCart.type as unknown as AbandonedCart['type'],
        status: dbCart.status as unknown as AbandonedCart['status'],
        abandonedAt: dbCart.abandonedAt.toISOString(),
        createdAt: dbCart.createdAt.toISOString(),
        updatedAt: dbCart.updatedAt.toISOString(),
        lastAttemptAt: dbCart.lastAttemptAt?.toISOString() ?? null,
        recoveredAt: dbCart.recoveredAt?.toISOString() ?? null,
        paidAt: dbCart.paidAt?.toISOString() ?? null,
        expiresAt: dbCart.expiresAt?.toISOString() ?? null,
      }
    } else {
      cart = {
        id: 'test-mock',
        storeId: id,
        customerName: 'Cliente Teste',
        customerEmail: 'teste@exemplo.com',
        customerPhone: cleanPhone,
        cartTotal: 299.90,
        currency: 'BRL',
        cartItems: [
          { id: 'mock-1', name: 'Produto Exemplo', variant: null, quantity: 1, price: 299.90, imageUrl: null },
        ],
        itemCount: 1,
        checkoutUrl: null,
        platformCartId: null,
        platformOrderId: null,
        type: 'ABANDONED_CART',
        status: 'PENDING',
        recoveryAttempts: 0,
        lastAttemptAt: null,
        recoveredAt: null,
        recoveredValue: null,
        paidAt: null,
        paidValue: null,
        recoveredAtStage: null,
        discountUsed: null,
        abandonedAt: new Date().toISOString(),
        expiresAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }

    if (!store.settings) {
      return NextResponse.json(
        { error: 'configuration_error', message: 'Configure a aba Conhecimento da loja primeiro' },
        { status: 400 }
      )
    }

    const settings = store.settings as unknown as StoreSettings
    const config = (store.recoveryConfig ?? null) as unknown as RecoveryConfig | null

    const result = await recoveryEngine.generateFirstMessage(cart, settings, config)

    let whatsAppSent = false
    let whatsAppError: string | null = null
    let conversationId: string | null = null

    if (sendWhatsApp) {
      if (!store.whatsappConnected) {
        whatsAppError = 'WhatsApp nao conectado'
      } else if (!evolutionApi.isConfigured()) {
        whatsAppError = 'Evolution API nao configurada'
      } else {
        try {
          const instanceName = `recupera-${id}`
          await evolutionApi.sendText(instanceName, cleanPhone, result.message)
          whatsAppSent = true

          // Find existing active conversation or create new one
          let conversation = await prisma.conversation.findFirst({
            where: {
              storeId: id,
              customerPhone: cleanPhone,
              status: 'ACTIVE',
            },
            orderBy: { createdAt: 'desc' },
          })

          if (conversation) {
            // Reuse existing conversation
            conversationId = conversation.id
          } else {
            // Create new conversation (without abandonedCartId to avoid unique constraint)
            conversation = await prisma.conversation.create({
              data: {
                storeId: id,
                abandonedCartId: cartId ?? null,
                customerPhone: cleanPhone,
                customerName: cart.customerName,
                status: 'ACTIVE',
                aiModel: result.model,
                totalTokens: result.tokensUsed,
                estimatedCost: result.estimatedCost,
              },
            })
            conversationId = conversation.id
          }

          // Save the AI message in the conversation
          await prisma.message.create({
            data: {
              conversationId: conversation.id,
              role: 'AI',
              content: result.message,
              messageStatus: 'SENT',
              tokensUsed: result.tokensUsed,
              modelUsed: result.model,
            },
          })
        } catch (err) {
          whatsAppError = err instanceof Error ? err.message : 'Falha ao enviar'
        }
      }
    }

    return NextResponse.json({
      data: {
        message: result.message,
        tokensUsed: result.tokensUsed,
        model: result.model,
        estimatedCost: result.estimatedCost,
        whatsAppSent,
        whatsAppError,
        conversationId,
        cartUsed: cartId ? 'real' : 'mock',
      },
    })
  } catch (error) {
    console.error('[Test Message] Error:', error)
    return NextResponse.json(
      {
        error: 'internal_error',
        message: `Failed to generate test message: ${error instanceof Error ? error.message : 'Unknown'}`,
      },
      { status: 500 }
    )
  }
}
