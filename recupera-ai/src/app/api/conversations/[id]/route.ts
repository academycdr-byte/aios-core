import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth-utils'
import { processIncomingMessage } from '@/lib/ai/message-processor'
import { evolutionApi } from '@/lib/evolution-api'
import { recoveryEngine } from '@/lib/ai/recovery-engine'
import type { StoreSettings, AbandonedCart, Message } from '@/types'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/conversations/[id]
 * Get conversation detail with messages and cart info
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = await context.params

    // Get conversation with all related data
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        store: { select: { id: true, name: true, userId: true } },
        messages: {
          orderBy: { sentAt: 'asc' },
        },
        abandonedCart: true,
      },
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'not_found', message: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Verify user owns the store this conversation belongs to
    if (conversation.store.userId !== user.id) {
      return NextResponse.json(
        { error: 'not_found', message: 'Conversation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: {
        id: conversation.id,
        storeId: conversation.storeId,
        storeName: conversation.store.name,
        abandonedCartId: conversation.abandonedCartId,
        customerPhone: conversation.customerPhone,
        customerName: conversation.customerName,
        status: conversation.status,
        aiModel: conversation.aiModel,
        totalTokens: conversation.totalTokens,
        estimatedCost: conversation.estimatedCost,
        startedAt: conversation.startedAt,
        lastMessageAt: conversation.lastMessageAt,
        closedAt: conversation.closedAt,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        messages: conversation.messages,
        cart: conversation.abandonedCart,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'internal_error',
        message: `Failed to fetch conversation: ${error instanceof Error ? error.message : 'Unknown'}`,
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/conversations/[id]
 * Send a reply in a conversation.
 *
 * Body:
 *   message: string  - The message content to send
 *   mode: 'ai' | 'manual' (default: 'ai')
 *     - 'ai': Treat as customer message, generate AI reply and send via WhatsApp
 *     - 'manual': Send the message directly as-is via WhatsApp (human takeover)
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = await context.params
    const body = await request.json()
    const { message, mode = 'ai' } = body as {
      message: string
      mode?: 'ai' | 'manual'
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'bad_request', message: 'Message content is required' },
        { status: 400 }
      )
    }

    // Load conversation with store ownership check
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        store: {
          include: {
            settings: true,
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
      return NextResponse.json(
        { error: 'not_found', message: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (conversation.store.userId !== user.id) {
      return NextResponse.json(
        { error: 'not_found', message: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Check conversation is still active
    if (conversation.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'bad_request', message: `Conversation is ${conversation.status}, cannot send messages` },
        { status: 400 }
      )
    }

    const instanceName = `recupera-${conversation.storeId}`

    if (mode === 'manual') {
      // ========================================
      // MANUAL MODE: Send message directly as operator
      // ========================================

      // Save the manual message
      const savedMessage = await prisma.message.create({
        data: {
          conversationId: id,
          role: 'AI', // From the customer's perspective, it's from the bot/operator
          content: message.trim(),
          messageStatus: 'SENT',
          modelUsed: 'manual',
        },
      })

      // Send via WhatsApp
      try {
        if (evolutionApi.isConfigured()) {
          await evolutionApi.sendText(instanceName, conversation.customerPhone, message.trim())
        }
      } catch (sendError) {
        console.error(`[Conversation Reply] WhatsApp send failed:`, sendError)
        // Update message status to FAILED but don't error the API
        await prisma.message.update({
          where: { id: savedMessage.id },
          data: { messageStatus: 'FAILED' },
        })
      }

      // Update conversation timestamp
      await prisma.conversation.update({
        where: { id },
        data: { lastMessageAt: new Date() },
      })

      return NextResponse.json({
        data: {
          mode: 'manual',
          messageId: savedMessage.id,
          message: message.trim(),
          sentViaWhatsApp: evolutionApi.isConfigured(),
        },
      })
    }

    // ========================================
    // AI MODE: Process as customer message, generate AI reply
    // ========================================

    // Save the simulated customer message (for testing from UI)
    await prisma.message.create({
      data: {
        conversationId: id,
        role: 'CUSTOMER',
        content: message.trim(),
        messageStatus: 'DELIVERED',
      },
    })

    // Process with AI (classify intent, generate reply, send WhatsApp)
    const result = await processIncomingMessage(id, message.trim())

    return NextResponse.json({
      data: {
        mode: 'ai',
        action: result.action,
        intent: result.intent,
        aiMessage: result.aiMessage,
        tokensUsed: result.tokensUsed,
        estimatedCost: result.estimatedCost,
        error: result.error,
      },
    })
  } catch (error) {
    console.error('[Conversation Reply] Error:', error)
    return NextResponse.json(
      {
        error: 'internal_error',
        message: `Failed to send reply: ${error instanceof Error ? error.message : 'Unknown'}`,
      },
      { status: 500 }
    )
  }
}
