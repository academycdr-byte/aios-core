/**
 * Step-level metrics calculation.
 * Aggregates message delivery, engagement, and conversion metrics per follow-up step.
 */

import { prisma } from '@/lib/prisma'

export async function calculateStepMetrics(): Promise<{ storesProcessed: number; metricsUpserted: number; errors: string[] }> {
  const errors: string[] = []
  let metricsUpserted = 0

  try {
    const stores = await prisma.store.findMany({
      where: { isActive: true },
      select: { id: true },
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    for (const store of stores) {
      try {
        // Get all AI messages sent today, grouped by followUpStep
        const messages = await prisma.message.findMany({
          where: {
            conversation: { storeId: store.id },
            role: 'AI',
            followUpStep: { not: null },
            sentAt: { gte: today, lt: tomorrow },
          },
          select: {
            followUpStep: true,
            messageStatus: true,
            readAt: true,
            deliveredAt: true,
            tokensUsed: true,
            conversationId: true,
          },
        })

        // Get customer replies today (to calculate response rate per step)
        const customerMessages = await prisma.message.findMany({
          where: {
            conversation: { storeId: store.id },
            role: 'CUSTOMER',
            sentAt: { gte: today, lt: tomorrow },
          },
          select: {
            conversationId: true,
          },
        })
        const conversationsWithReplies = new Set(customerMessages.map(m => m.conversationId))

        // Get link clicks today per step
        const clickedLinks = await prisma.trackedLink.findMany({
          where: {
            storeId: store.id,
            stepNumber: { not: null },
            lastClickAt: { gte: today, lt: tomorrow },
          },
          select: {
            stepNumber: true,
            clicks: true,
          },
        })

        // Get conversions today (carts that went PAID) with step attribution
        const paidCarts = await prisma.abandonedCart.findMany({
          where: {
            storeId: store.id,
            status: 'PAID',
            paidAt: { gte: today, lt: tomorrow },
          },
          select: {
            id: true,
            paidValue: true,
            type: true,
            conversation: {
              select: {
                messages: {
                  where: { role: 'AI', followUpStep: { not: null } },
                  orderBy: { sentAt: 'desc' },
                  take: 1,
                  select: { followUpStep: true },
                },
              },
            },
          },
        })

        // Group messages by step
        const stepData = new Map<number, {
          sent: number
          delivered: number
          read: number
          replied: number
          clicks: number
          conversions: number
          conversionValue: number
          aiCost: number
          conversationIds: Set<string>
        }>()

        for (const msg of messages) {
          const step = msg.followUpStep!
          if (!stepData.has(step)) {
            stepData.set(step, {
              sent: 0, delivered: 0, read: 0, replied: 0,
              clicks: 0, conversions: 0, conversionValue: 0, aiCost: 0,
              conversationIds: new Set(),
            })
          }
          const data = stepData.get(step)!
          data.sent++
          if (msg.deliveredAt || msg.messageStatus === 'DELIVERED' || msg.messageStatus === 'READ') data.delivered++
          if (msg.readAt || msg.messageStatus === 'READ') data.read++
          data.conversationIds.add(msg.conversationId)
          // Estimate cost: ~$0.0006 per message (rough average)
          if (msg.tokensUsed) {
            data.aiCost += (msg.tokensUsed * 0.001) / 1000 // simplified
          }
        }

        // Add replies
        for (const [, data] of stepData) {
          for (const convId of data.conversationIds) {
            if (conversationsWithReplies.has(convId)) {
              data.replied++
            }
          }
        }

        // Add clicks
        for (const link of clickedLinks) {
          const step = link.stepNumber!
          if (!stepData.has(step)) {
            stepData.set(step, {
              sent: 0, delivered: 0, read: 0, replied: 0,
              clicks: 0, conversions: 0, conversionValue: 0, aiCost: 0,
              conversationIds: new Set(),
            })
          }
          stepData.get(step)!.clicks += link.clicks
        }

        // Add conversions (attribute to last AI message step)
        for (const cart of paidCarts) {
          const lastAiStep = cart.conversation?.messages[0]?.followUpStep
          if (lastAiStep != null && stepData.has(lastAiStep)) {
            stepData.get(lastAiStep)!.conversions++
            stepData.get(lastAiStep)!.conversionValue += cart.paidValue ?? 0
          }
        }

        // Upsert step metrics
        for (const [step, data] of stepData) {
          await prisma.stepMetrics.upsert({
            where: {
              storeId_date_cartType_stepNumber: {
                storeId: store.id,
                date: today,
                cartType: 'ABANDONED_CART',
                stepNumber: step,
              },
            },
            create: {
              storeId: store.id,
              date: today,
              cartType: 'ABANDONED_CART',
              stepNumber: step,
              messagesSent: data.sent,
              messagesDelivered: data.delivered,
              messagesRead: data.read,
              linkClicks: data.clicks,
              messagesReplied: data.replied,
              conversions: data.conversions,
              conversionValue: data.conversionValue,
              aiCost: data.aiCost,
            },
            update: {
              messagesSent: data.sent,
              messagesDelivered: data.delivered,
              messagesRead: data.read,
              linkClicks: data.clicks,
              messagesReplied: data.replied,
              conversions: data.conversions,
              conversionValue: data.conversionValue,
              aiCost: data.aiCost,
            },
          })
          metricsUpserted++
        }
      } catch (err) {
        errors.push(`Store ${store.id}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    return { storesProcessed: stores.length, metricsUpserted, errors }
  } catch (err) {
    errors.push(`Fatal: ${err instanceof Error ? err.message : 'Unknown error'}`)
    return { storesProcessed: 0, metricsUpserted, errors }
  }
}
