import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth-utils'
import { recoveryEngine, isAIConfigured } from '@/lib/ai/recovery-engine'
import type { StoreSettings, RecoveryConfig, AbandonedCart, Message } from '@/types'

/**
 * POST /api/ai/generate
 * Generate an AI message manually (for testing / preview).
 *
 * Body:
 *   cartId: string            - The abandoned cart ID
 *   type: 'first' | 'followup' | 'reply'
 *   messageNumber?: number    - Required for 'followup' (2, 3, 4)
 *   customerMessage?: string  - Required for 'reply'
 *
 * Returns the generated message WITHOUT sending it via WhatsApp.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { cartId, type, messageNumber, customerMessage } = body as {
      cartId: string
      type: 'first' | 'followup' | 'reply'
      messageNumber?: number
      customerMessage?: string
    }

    // Validate required fields
    if (!cartId || !type) {
      return NextResponse.json(
        { error: 'bad_request', message: 'cartId and type are required' },
        { status: 400 }
      )
    }

    if (type === 'followup' && !messageNumber) {
      return NextResponse.json(
        { error: 'bad_request', message: 'messageNumber is required for followup type' },
        { status: 400 }
      )
    }

    if (type === 'reply' && !customerMessage) {
      return NextResponse.json(
        { error: 'bad_request', message: 'customerMessage is required for reply type' },
        { status: 400 }
      )
    }

    // Load cart with store data
    const cart = await prisma.abandonedCart.findUnique({
      where: { id: cartId },
      include: {
        store: {
          include: {
            settings: true,
            recoveryConfig: true,
          },
        },
        conversation: {
          include: {
            messages: {
              orderBy: { sentAt: 'asc' },
              take: 50,
            },
          },
        },
      },
    })

    if (!cart) {
      return NextResponse.json(
        { error: 'not_found', message: 'Cart not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (cart.store.userId !== user.id) {
      return NextResponse.json(
        { error: 'not_found', message: 'Cart not found' },
        { status: 404 }
      )
    }

    const settings = cart.store.settings as unknown as StoreSettings | null
    if (!settings) {
      return NextResponse.json(
        { error: 'bad_request', message: 'Store settings not configured. Configure your store settings first.' },
        { status: 400 }
      )
    }

    const config = cart.store.recoveryConfig as unknown as RecoveryConfig | null
    const cartData = cart as unknown as AbandonedCart

    // Generate based on type
    let result

    switch (type) {
      case 'first':
        result = await recoveryEngine.generateFirstMessage(cartData, settings, config)
        break

      case 'followup':
        result = await recoveryEngine.generateFollowUp(
          cartData,
          settings,
          config,
          messageNumber ?? 2
        )
        break

      case 'reply': {
        const conversationMessages = (cart.conversation?.messages ?? []) as unknown as Message[]
        result = await recoveryEngine.generateReply(
          cartData,
          settings,
          conversationMessages,
          customerMessage!
        )
        break
      }

      default:
        return NextResponse.json(
          { error: 'bad_request', message: 'Invalid type. Use first, followup, or reply.' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      data: {
        message: result.message,
        tokensUsed: result.tokensUsed,
        model: result.model,
        estimatedCost: result.estimatedCost,
        aiConfigured: isAIConfigured(),
      },
    })
  } catch (error) {
    console.error('[AI Generate] Error:', error)
    return NextResponse.json(
      {
        error: 'internal_error',
        message: `Failed to generate AI message: ${error instanceof Error ? error.message : 'Unknown'}`,
      },
      { status: 500 }
    )
  }
}
