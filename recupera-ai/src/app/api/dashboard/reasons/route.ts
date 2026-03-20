import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth-utils'

const REASON_LABELS: Record<string, string> = {
  PRICE: 'Preco alto',
  SHIPPING: 'Frete caro/demorado',
  PRODUCT_DOUBT: 'Duvida sobre produto',
  FOUND_ELSEWHERE: 'Comprou em outro lugar',
  CHANGED_MIND: 'Desistiu da compra',
  PAYMENT_ISSUE: 'Problema no pagamento',
  NO_RESPONSE: 'Sem resposta',
  OTHER: 'Outros',
}

const REASON_COLORS: Record<string, string> = {
  PRICE: '#F59E0B',
  SHIPPING: '#3B82F6',
  PRODUCT_DOUBT: '#06B6D4',
  FOUND_ELSEWHERE: '#10B981',
  CHANGED_MIND: '#8B5CF6',
  PAYMENT_ISSUE: '#EF4444',
  NO_RESPONSE: '#6B7280',
  OTHER: '#A3A3A3',
}

export async function GET() {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get the user's single store
    const store = await prisma.store.findFirst({
      where: { userId: user.id },
      select: { id: true },
    })

    if (!store) {
      return NextResponse.json({ data: [] })
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const grouped = await prisma.conversation.groupBy({
      by: ['abandonmentReason'],
      _count: { id: true },
      where: {
        abandonmentReason: { not: null },
        closedAt: { gte: thirtyDaysAgo },
        storeId: store.id,
      },
      orderBy: { _count: { id: 'desc' } },
    })

    const reasons = grouped.map((g) => {
      const reason = g.abandonmentReason as string
      return {
        reason,
        label: REASON_LABELS[reason] ?? reason,
        count: g._count.id,
        color: REASON_COLORS[reason] ?? '#A3A3A3',
      }
    })

    return NextResponse.json({ data: reasons })
  } catch (error) {
    console.error('[API] Failed to fetch abandonment reasons:', error)
    return NextResponse.json(
      { error: 'internal_error', message: 'Failed to fetch abandonment reasons' },
      { status: 500 }
    )
  }
}
