/**
 * Daily Metrics Calculator
 * Aggregates cart, conversation, and cost data into the DailyMetrics table.
 * Called by the cron job after processing recovery jobs.
 */

import { prisma } from '@/lib/prisma'

export interface MetricsStats {
  storesProcessed: number
  metricsUpserted: number
  errors: string[]
}

/**
 * Calculate and upsert daily metrics for all active stores.
 * Aggregates data from abandoned_carts, conversations, and messages
 * for today's date.
 */
export async function calculateDailyMetrics(): Promise<MetricsStats> {
  const stats: MetricsStats = {
    storesProcessed: 0,
    metricsUpserted: 0,
    errors: [],
  }

  try {
    // Get all active stores
    const stores = await prisma.store.findMany({
      where: { isActive: true },
      select: { id: true },
    })

    // Calculate for today (start of day in UTC)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    for (const store of stores) {
      try {
        stats.storesProcessed++

        // Count abandoned carts created today
        const abandonedCarts = await prisma.abandonedCart.findMany({
          where: {
            storeId: store.id,
            abandonedAt: { gte: today, lt: tomorrow },
          },
          select: { cartTotal: true, status: true, recoveredValue: true, paidValue: true },
        })

        const abandonedCount = abandonedCarts.length
        const abandonedValue = abandonedCarts.reduce((sum, c) => sum + c.cartTotal, 0)

        // Count carts that were contacted today
        const contactedCount = await prisma.abandonedCart.count({
          where: {
            storeId: store.id,
            status: { in: ['CONTACTING', 'RECOVERED', 'PAID', 'LOST'] },
            lastAttemptAt: { gte: today, lt: tomorrow },
          },
        })

        // Count recovered carts today
        const recoveredCarts = await prisma.abandonedCart.findMany({
          where: {
            storeId: store.id,
            status: { in: ['RECOVERED', 'PAID'] },
            recoveredAt: { gte: today, lt: tomorrow },
          },
          select: { recoveredValue: true },
        })
        const recoveredCount = recoveredCarts.length
        const recoveredValue = recoveredCarts.reduce((sum, c) => sum + (c.recoveredValue ?? 0), 0)

        // Count paid carts today
        const paidCarts = await prisma.abandonedCart.findMany({
          where: {
            storeId: store.id,
            status: 'PAID',
            paidAt: { gte: today, lt: tomorrow },
          },
          select: { paidValue: true },
        })
        const paidCount = paidCarts.length
        const paidValue = paidCarts.reduce((sum, c) => sum + (c.paidValue ?? 0), 0)

        // Conversation metrics for today
        const conversations = await prisma.conversation.findMany({
          where: {
            storeId: store.id,
            startedAt: { gte: today, lt: tomorrow },
          },
          select: {
            id: true,
            estimatedCost: true,
            _count: { select: { messages: true } },
          },
        })

        const totalConversations = conversations.length
        const aiCost = conversations.reduce((sum, c) => sum + c.estimatedCost, 0)
        const totalMessages = conversations.reduce((sum, c) => sum + c._count.messages, 0)
        const avgMessagesPerConv = totalConversations > 0
          ? totalMessages / totalConversations
          : 0

        // Calculated metrics
        const avgTicket = recoveredCount > 0 ? recoveredValue / recoveredCount : 0
        const recoveryRate = contactedCount > 0 ? (recoveredCount / contactedCount) * 100 : 0

        // Upsert daily metrics
        await prisma.dailyMetrics.upsert({
          where: {
            storeId_date: { storeId: store.id, date: today },
          },
          update: {
            abandonedCount,
            abandonedValue,
            contactedCount,
            recoveredCount,
            recoveredValue,
            paidCount,
            paidValue,
            avgTicket,
            recoveryRate,
            totalConversations,
            avgMessagesPerConv,
            aiCost,
          },
          create: {
            storeId: store.id,
            date: today,
            abandonedCount,
            abandonedValue,
            contactedCount,
            recoveredCount,
            recoveredValue,
            paidCount,
            paidValue,
            avgTicket,
            recoveryRate,
            totalConversations,
            avgMessagesPerConv,
            aiCost,
          },
        })

        stats.metricsUpserted++
      } catch (error) {
        const errMsg = `Store ${store.id}: ${error instanceof Error ? error.message : 'Unknown'}`
        stats.errors.push(errMsg)
        console.error(`[Metrics] Error calculating metrics for store ${store.id}:`, error)
      }
    }
  } catch (error) {
    console.error('[Metrics] Fatal error in calculateDailyMetrics:', error)
    stats.errors.push(`Fatal: ${error instanceof Error ? error.message : 'Unknown'}`)
  }

  return stats
}
