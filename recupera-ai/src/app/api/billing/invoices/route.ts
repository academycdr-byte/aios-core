/**
 * GET /api/billing/invoices
 * Lista faturas da loja do usuário logado.
 * Query params: ?status=PENDING&limit=20
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    // Get user's store
    const store = await prisma.store.findFirst({
      where: { userId: user.id },
      select: { id: true },
    })

    if (!store) {
      return NextResponse.json({ error: 'store_not_found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const invoices = await prisma.billingInvoice.findMany({
      where: {
        storeId: store.id,
        ...(status ? { status: status as 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' } : {}),
      },
      orderBy: { periodEnd: 'desc' },
      take: limit,
    })

    // Also get current month summary (recovered value so far)
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const currentMonthRecoveries = await prisma.abandonedCart.aggregate({
      where: {
        storeId: store.id,
        status: { in: ['RECOVERED', 'PAID'] },
        recoveredAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      _sum: { recoveredValue: true },
      _count: true,
    })

    const recoveredThisMonth = currentMonthRecoveries._sum.recoveredValue || 0
    const estimatedCommission = Math.round(recoveredThisMonth * 0.10 * 100) / 100

    return NextResponse.json({
      invoices,
      currentMonth: {
        periodStart: monthStart.toISOString(),
        periodEnd: monthEnd.toISOString(),
        recoveredValue: recoveredThisMonth,
        estimatedCommission,
        recoveredCount: currentMonthRecoveries._count,
      },
      billingActive: (await prisma.store.findUnique({
        where: { id: store.id },
        select: { billingActive: true },
      }))?.billingActive ?? true,
    })
  } catch (error) {
    console.error('[Billing] Error listing invoices:', error)
    return NextResponse.json(
      { error: 'internal_error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
