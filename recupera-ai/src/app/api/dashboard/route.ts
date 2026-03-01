import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth-utils'

/**
 * GET /api/dashboard
 * Returns aggregated dashboard metrics from DailyMetrics table
 * Query params:
 *   - storeId (optional): filter by store
 *   - period: '7d' | '30d' | '90d' (default: '30d')
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
    const period = searchParams.get('period') ?? '30d'
    const storeId = searchParams.get('storeId')

    // Support custom date range or predefined period
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let sinceDate: Date
    let untilDate: Date | undefined

    if (startDate && endDate) {
      sinceDate = new Date(startDate)
      untilDate = new Date(endDate)
      // Set untilDate to end of day
      untilDate.setHours(23, 59, 59, 999)
    } else {
      // Validate period
      if (!['7d', '30d', '90d'].includes(period)) {
        return NextResponse.json(
          { error: 'invalid_period', message: 'Period must be 7d, 30d, or 90d' },
          { status: 400 }
        )
      }

      const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
      sinceDate = new Date()
      sinceDate.setDate(sinceDate.getDate() - days)
    }

    // Get all store IDs for this user (scoping)
    const userStores = await prisma.store.findMany({
      where: { userId: user.id },
      select: { id: true },
    })
    const userStoreIds = userStores.map((s) => s.id)

    if (userStoreIds.length === 0) {
      return NextResponse.json({
        data: {
          totalAbandoned: 0,
          totalAbandonedValue: 0,
          totalContacted: 0,
          totalRecovered: 0,
          totalRecoveredValue: 0,
          totalPaid: 0,
          totalPaidValue: 0,
          recoveryRate: 0,
          avgTicket: 0,
          totalConversations: 0,
          avgMessagesPerConv: 0,
          totalAiCost: 0,
          dailyMetrics: [],
        },
      })
    }

    // Build where clause for DailyMetrics
    const storeFilter = storeId && userStoreIds.includes(storeId)
      ? { storeId }
      : { storeId: { in: userStoreIds } }

    // Get daily metrics for the period
    const dateFilter = untilDate
      ? { gte: sinceDate, lte: untilDate }
      : { gte: sinceDate }

    const dailyMetrics = await prisma.dailyMetrics.findMany({
      where: {
        ...storeFilter,
        date: dateFilter,
      },
      orderBy: { date: 'asc' },
    })

    // Aggregate totals
    const totalAbandoned = dailyMetrics.reduce((sum, m) => sum + m.abandonedCount, 0)
    const totalAbandonedValue = dailyMetrics.reduce((sum, m) => sum + m.abandonedValue, 0)
    const totalContacted = dailyMetrics.reduce((sum, m) => sum + m.contactedCount, 0)
    const totalRecovered = dailyMetrics.reduce((sum, m) => sum + m.recoveredCount, 0)
    const totalRecoveredValue = dailyMetrics.reduce((sum, m) => sum + m.recoveredValue, 0)
    const totalPaid = dailyMetrics.reduce((sum, m) => sum + m.paidCount, 0)
    const totalPaidValue = dailyMetrics.reduce((sum, m) => sum + m.paidValue, 0)
    const totalAiCost = dailyMetrics.reduce((sum, m) => sum + m.aiCost, 0)
    const totalConversations = dailyMetrics.reduce((sum, m) => sum + m.totalConversations, 0)

    // Calculate averages
    const metricsWithMessages = dailyMetrics.filter((m) => m.totalConversations > 0)
    const avgMessagesPerConv = metricsWithMessages.length > 0
      ? metricsWithMessages.reduce((sum, m) => sum + m.avgMessagesPerConv, 0) / metricsWithMessages.length
      : 0

    const recoveryRate = totalContacted > 0
      ? (totalRecovered / totalContacted) * 100
      : 0

    const avgTicket = totalRecovered > 0
      ? totalRecoveredValue / totalRecovered
      : 0

    // New metrics (Story 1.6)
    const totalMessagesSent = dailyMetrics.reduce((sum, m) => sum + m.messagesSent, 0)
    const totalMessagesDelivered = dailyMetrics.reduce((sum, m) => sum + m.messagesDelivered, 0)
    const totalMessagesRead = dailyMetrics.reduce((sum, m) => sum + m.messagesRead, 0)
    const totalMessagesReplied = dailyMetrics.reduce((sum, m) => sum + m.messagesReplied, 0)
    const totalLinkClicks = dailyMetrics.reduce((sum, m) => sum + m.linkClicks, 0)

    const responseRate = totalMessagesSent > 0
      ? (totalMessagesReplied / totalMessagesSent) * 100
      : 0

    const openRate = totalMessagesDelivered > 0
      ? (totalMessagesRead / totalMessagesDelivered) * 100
      : 0

    const clickRate = totalMessagesSent > 0
      ? (totalLinkClicks / totalMessagesSent) * 100
      : 0

    const costPerRecovery = totalRecovered > 0
      ? totalAiCost / totalRecovered
      : 0

    return NextResponse.json({
      data: {
        totalAbandoned,
        totalAbandonedValue,
        totalContacted,
        totalRecovered,
        totalRecoveredValue,
        totalPaid,
        totalPaidValue,
        recoveryRate,
        avgTicket,
        totalConversations,
        avgMessagesPerConv,
        totalAiCost,
        responseRate,
        openRate,
        clickRate,
        costPerRecovery,
        totalMessagesSent,
        totalMessagesDelivered,
        totalMessagesRead,
        totalMessagesReplied,
        totalLinkClicks,
        dailyMetrics,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'internal_error',
        message: `Failed to fetch dashboard data: ${error instanceof Error ? error.message : 'Unknown'}`,
      },
      { status: 500 }
    )
  }
}
