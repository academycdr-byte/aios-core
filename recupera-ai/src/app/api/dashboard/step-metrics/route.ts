import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const period = searchParams.get('period') ?? '30d'

    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
    const sinceDate = new Date()
    sinceDate.setDate(sinceDate.getDate() - days)

    // Get the user's single store
    const store = await prisma.store.findFirst({
      where: { userId: user.id },
      select: { id: true },
    })

    if (!store) {
      return NextResponse.json({ data: [] })
    }

    const stepMetrics = await prisma.stepMetrics.findMany({
      where: {
        storeId: store.id,
        date: { gte: sinceDate },
      },
      orderBy: { stepNumber: 'asc' },
    })

    // Aggregate by stepNumber across all dates
    const aggregated = new Map<number, {
      stepNumber: number
      messagesSent: number
      messagesDelivered: number
      messagesRead: number
      linkClicks: number
      messagesReplied: number
      conversions: number
      conversionValue: number
      aiCost: number
    }>()

    for (const m of stepMetrics) {
      if (!aggregated.has(m.stepNumber)) {
        aggregated.set(m.stepNumber, {
          stepNumber: m.stepNumber,
          messagesSent: 0,
          messagesDelivered: 0,
          messagesRead: 0,
          linkClicks: 0,
          messagesReplied: 0,
          conversions: 0,
          conversionValue: 0,
          aiCost: 0,
        })
      }
      const agg = aggregated.get(m.stepNumber)!
      agg.messagesSent += m.messagesSent
      agg.messagesDelivered += m.messagesDelivered
      agg.messagesRead += m.messagesRead
      agg.linkClicks += m.linkClicks
      agg.messagesReplied += m.messagesReplied
      agg.conversions += m.conversions
      agg.conversionValue += m.conversionValue
      agg.aiCost += m.aiCost
    }

    // Calculate rates and format
    const result = Array.from(aggregated.values()).map(s => ({
      ...s,
      stepLabel: s.stepNumber === 0 ? 'Primeira Mensagem' : `Follow-up ${s.stepNumber}`,
      openRate: s.messagesDelivered > 0 ? (s.messagesRead / s.messagesDelivered) * 100 : 0,
      clickRate: s.messagesRead > 0 ? (s.linkClicks / s.messagesRead) * 100 : 0,
      responseRate: s.messagesDelivered > 0 ? (s.messagesReplied / s.messagesDelivered) * 100 : 0,
      conversionRate: s.messagesSent > 0 ? (s.conversions / s.messagesSent) * 100 : 0,
      costPerConversion: s.conversions > 0 ? s.aiCost / s.conversions : 0,
    }))

    return NextResponse.json({ data: result })
  } catch (error) {
    return NextResponse.json(
      { error: 'internal_error', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}
