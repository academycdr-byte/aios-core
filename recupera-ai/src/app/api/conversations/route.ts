import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth-utils'
import type { Prisma } from '@/generated/prisma/client'

/**
 * GET /api/conversations
 * List conversations with filters and pagination
 * Query params:
 *   - status (optional): ACTIVE | RECOVERED | LOST | ESCALATED | EXPIRED
 *   - page (optional): page number (default: 1)
 *   - limit (optional): items per page (default: 20)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = request.nextUrl
    const status = searchParams.get('status')
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))

    // Validate status
    if (status) {
      const validStatuses = ['ACTIVE', 'RECOVERED', 'LOST', 'ESCALATED', 'EXPIRED']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'validation_error', message: `Invalid status: ${status}` },
          { status: 400 }
        )
      }
    }

    // Get the user's single store
    const store = await prisma.store.findFirst({
      where: { userId: user.id },
      select: { id: true },
    })

    if (!store) {
      return NextResponse.json({ data: [], total: 0, page, limit, totalPages: 0 })
    }

    // Build where clause
    const where: Prisma.ConversationWhereInput = {
      storeId: store.id,
    }

    if (status) {
      where.status = status as Prisma.EnumConversationStatusFilter
    }

    // Count total
    const total = await prisma.conversation.count({ where })

    // Get paginated data with related data
    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        store: { select: { name: true } },
        abandonedCart: {
          select: { cartTotal: true, cartItems: true },
        },
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1,
          select: { content: true },
        },
      },
      orderBy: [
        { lastMessageAt: { sort: 'desc', nulls: 'last' } },
        { createdAt: 'desc' },
      ],
      skip: (page - 1) * limit,
      take: limit,
    })

    // Map to include storeName and lastMessage for frontend compatibility
    const data = conversations.map((conv) => ({
      ...conv,
      storeName: conv.store.name,
      lastMessage: conv.messages[0]?.content ?? null,
      cartTotal: conv.abandonedCart?.cartTotal ?? null,
      store: undefined,
      messages: undefined,
    }))

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      data,
      total,
      page,
      limit,
      totalPages,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'internal_error',
        message: `Failed to fetch conversations: ${error instanceof Error ? error.message : 'Unknown'}`,
      },
      { status: 500 }
    )
  }
}
