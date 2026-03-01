import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth-utils'
import type { Prisma } from '@/generated/prisma/client'

/**
 * GET /api/carts
 * List abandoned carts with filters and pagination
 * Query params:
 *   - storeId (optional): filter by store
 *   - status (optional): PENDING | CONTACTING | RECOVERED | PAID | LOST | EXPIRED
 *   - type (optional): ABANDONED_CART | PIX_PENDING | CARD_DECLINED
 *   - period (optional): today | 7d | 30d | all (default: all)
 *   - page (optional): page number (default: 1)
 *   - limit (optional): items per page (default: 20)
 *   - search (optional): search by name or phone
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
    const storeId = searchParams.get('storeId')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const period = searchParams.get('period') ?? 'all'
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))
    const search = searchParams.get('search')

    // Validate status
    if (status) {
      const validStatuses = ['PENDING', 'CONTACTING', 'RECOVERED', 'PAID', 'LOST', 'EXPIRED']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'validation_error', message: `Invalid status: ${status}` },
          { status: 400 }
        )
      }
    }

    // Validate type
    if (type) {
      const validTypes = ['ABANDONED_CART', 'PIX_PENDING', 'CARD_DECLINED']
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          { error: 'validation_error', message: `Invalid type: ${type}` },
          { status: 400 }
        )
      }
    }

    // Get user store IDs for scoping
    const userStores = await prisma.store.findMany({
      where: { userId: user.id },
      select: { id: true },
    })
    const userStoreIds = userStores.map((s) => s.id)

    // Build where clause
    const where: Prisma.AbandonedCartWhereInput = {
      storeId: storeId && userStoreIds.includes(storeId)
        ? storeId
        : { in: userStoreIds },
    }

    if (status) {
      where.status = status as Prisma.EnumCartStatusFilter
    }

    if (type) {
      where.type = type as Prisma.EnumCartTypeFilter
    }

    // Period filter
    if (period !== 'all') {
      const now = new Date()
      let sinceDate: Date
      if (period === 'today') {
        sinceDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      } else if (period === '7d') {
        sinceDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      } else {
        sinceDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      }
      where.abandonedAt = { gte: sinceDate }
    }

    // Search filter
    if (search?.trim()) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Count total
    const total = await prisma.abandonedCart.count({ where })

    // Get paginated data
    const carts = await prisma.abandonedCart.findMany({
      where,
      include: {
        store: { select: { name: true } },
        conversation: {
          select: { id: true },
        },
      },
      orderBy: { abandonedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    // Map to include storeName and conversationId for frontend
    const data = carts.map((cart) => ({
      ...cart,
      storeName: cart.store.name,
      conversationId: cart.conversation?.id ?? null,
      store: undefined,
      conversation: undefined,
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
        message: `Failed to fetch carts: ${error instanceof Error ? error.message : 'Unknown'}`,
      },
      { status: 500 }
    )
  }
}
