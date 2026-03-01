/**
 * Recovery Scheduler
 * Processes pending abandoned carts and sends recovery messages at the right time.
 * Called by the Vercel Cron job (/api/cron/recovery) every 5 minutes.
 */

import { prisma } from '@/lib/prisma'
import { evolutionApi } from '@/lib/evolution-api'
import { recoveryEngine } from '@/lib/ai/recovery-engine'
import type { StoreSettings, RecoveryConfig, AbandonedCart, FollowUpStep } from '@/types'

// ============================================================
// TYPES
// ============================================================

export interface SchedulerStats {
  processed: number
  sent: number
  skipped: number
  errors: number
  lost: number
  details: string[]
}

// ============================================================
// BUSINESS HOURS
// ============================================================

/**
 * Check if current time is within business hours for the store.
 * If sendOutsideHours is true or no business hours configured, always returns true.
 */
export function shouldSendNow(settings: {
  businessHoursStart: string | null
  businessHoursEnd: string | null
  sendOutsideHours: boolean
  timezone: string
}): boolean {
  // If store allows sending outside hours, always send
  if (settings.sendOutsideHours) return true

  // If no business hours configured, assume always open
  if (!settings.businessHoursStart || !settings.businessHoursEnd) return true

  try {
    // Get current time in the store's timezone
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: settings.timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    const parts = formatter.formatToParts(now)
    const currentHour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10)
    const currentMinute = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10)
    const currentMinutes = currentHour * 60 + currentMinute

    // Parse business hours (format: "09:00", "18:00")
    const [startH, startM] = settings.businessHoursStart.split(':').map(Number)
    const [endH, endM] = settings.businessHoursEnd.split(':').map(Number)
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes
  } catch (error) {
    console.error('[Scheduler] Error checking business hours:', error)
    // On error, default to sending (don't miss recovery opportunities)
    return true
  }
}

// ============================================================
// DELAY CALCULATION
// ============================================================

/**
 * Get the delay in minutes for a given attempt number.
 * Uses FollowUpSteps if available, falls back to hardcoded config fields.
 */
function getDelayForAttempt(
  attemptNumber: number,
  config: RecoveryConfig,
  followUpSteps?: FollowUpStep[],
  cartType: string = 'ABANDONED_CART'
): number | null {
  // Use flexible FollowUpSteps if available
  if (followUpSteps && followUpSteps.length > 0) {
    const stepsForType = followUpSteps
      .filter((s) => s.cartType === cartType && s.isActive)
      .sort((a, b) => a.stepNumber - b.stepNumber)
    const step = stepsForType[attemptNumber]
    return step ? step.delayMinutes : null
  }

  // Fall back to hardcoded config fields
  if (cartType === 'PIX_PENDING') {
    return attemptNumber === 0 ? config.pixFirstDelay
      : attemptNumber === 1 ? config.pixFollowUpDelay
      : null
  }
  if (cartType === 'CARD_DECLINED') {
    return attemptNumber === 0 ? config.cardFirstDelay : null
  }

  // ABANDONED_CART
  switch (attemptNumber) {
    case 0: return config.firstMessageDelay
    case 1: return config.followUp1Delay
    case 2: return config.followUp2Delay
    case 3: return config.followUp3Delay
    default: return null
  }
}

/**
 * Get the strategy text for a given attempt from FollowUpSteps.
 */
function getStepStrategy(
  attemptNumber: number,
  followUpSteps: FollowUpStep[],
  cartType: string = 'ABANDONED_CART'
): string | null {
  const stepsForType = followUpSteps
    .filter((s) => s.cartType === cartType && s.isActive)
    .sort((a, b) => a.stepNumber - b.stepNumber)
  return stepsForType[attemptNumber]?.strategy || null
}

/**
 * Get max attempts from follow-up steps or config.
 */
function getMaxAttempts(
  config: RecoveryConfig,
  followUpSteps?: FollowUpStep[],
  cartType: string = 'ABANDONED_CART'
): number {
  if (followUpSteps && followUpSteps.length > 0) {
    return followUpSteps.filter((s) => s.cartType === cartType && s.isActive).length
  }
  if (cartType === 'PIX_PENDING') return config.pixMaxAttempts
  if (cartType === 'CARD_DECLINED') return config.cardMaxAttempts
  return config.maxAttempts
}

/**
 * Check if enough time has passed since the reference timestamp for the given delay.
 */
function hasDelayPassed(referenceTime: Date, delayMinutes: number): boolean {
  const now = new Date()
  const targetTime = new Date(referenceTime.getTime() + delayMinutes * 60 * 1000)
  return now >= targetTime
}

// ============================================================
// SINGLE CART PROCESSOR
// ============================================================

/**
 * Process a single abandoned cart: check timing, generate message, send via WhatsApp.
 */
export async function processSingleCart(
  cartId: string
): Promise<{ action: string; error?: string }> {
  try {
    // Load cart with store, settings, config, follow-up steps, and existing conversation
    const cart = await prisma.abandonedCart.findUnique({
      where: { id: cartId },
      include: {
        store: {
          include: {
            settings: true,
            recoveryConfig: {
              include: {
                followUpSteps: { orderBy: [{ cartType: 'asc' }, { stepNumber: 'asc' }] },
              },
            },
            recoveryStages: { orderBy: { order: 'asc' } },
          },
        },
        conversation: {
          include: {
            messages: {
              orderBy: { sentAt: 'asc' },
              take: 20,
            },
          },
        },
      },
    })

    if (!cart) {
      return { action: 'skipped', error: 'Cart not found' }
    }

    const store = cart.store
    const settings = store.settings as unknown as StoreSettings | null
    const config = store.recoveryConfig as unknown as RecoveryConfig | null

    // Skip if recovery is disabled for this store
    if (!config?.isActive) {
      return { action: 'skipped', error: 'Recovery disabled for store' }
    }

    // Skip if no settings (can't build AI prompt)
    if (!settings) {
      return { action: 'skipped', error: 'No store settings configured' }
    }

    // Skip if cart value below minimum
    if (config.minCartValue > 0 && cart.cartTotal < config.minCartValue) {
      // Mark as expired to avoid reprocessing
      await prisma.abandonedCart.update({
        where: { id: cartId },
        data: { status: 'EXPIRED' },
      })
      return { action: 'skipped', error: 'Below minimum cart value' }
    }

    // Skip if no customer phone (can't send WhatsApp)
    if (!cart.customerPhone) {
      return { action: 'skipped', error: 'No customer phone' }
    }

    // Check if WhatsApp is connected for this store
    if (!store.whatsappConnected) {
      return { action: 'skipped', error: 'WhatsApp not connected' }
    }

    // testMode guard: only send to whitelisted phone numbers
    if (store.testMode) {
      const whitelisted = (store.testPhones ?? []) as string[]
      if (!whitelisted.includes(cart.customerPhone)) {
        return { action: 'skipped', error: `testMode: phone ${cart.customerPhone} not in whitelist` }
      }
    }

    // Check business hours
    if (!shouldSendNow(settings)) {
      return { action: 'skipped', error: 'Outside business hours' }
    }

    const followUpSteps = (store.recoveryConfig?.followUpSteps ?? []) as unknown as FollowUpStep[]
    const cartType = cart.type as string

    // Check cart expiration
    const expirationHours = config.expirationHours ?? 72
    if (expirationHours > 0) {
      const expiresAt = new Date(cart.abandonedAt.getTime() + expirationHours * 60 * 60 * 1000)
      if (new Date() > expiresAt) {
        await prisma.abandonedCart.update({
          where: { id: cartId },
          data: { status: 'EXPIRED' },
        })
        return { action: 'skipped', error: 'Cart expired' }
      }
    }

    // Check opt-out: if last customer message was opt-out intent
    if (config.stopOnOptOut && cart.conversation) {
      const lastCustomerMsg = cart.conversation.messages
        .filter((m) => m.role === 'CUSTOMER')
        .pop()
      if (lastCustomerMsg?.intent === 'OPT_OUT') {
        await prisma.abandonedCart.update({
          where: { id: cartId },
          data: { status: 'LOST' },
        })
        if (cart.conversation) {
          await prisma.conversation.update({
            where: { id: cart.conversation.id },
            data: {
              status: 'LOST',
              closedAt: new Date(),
              closingReason: 'Cliente pediu para parar (opt-out)',
            },
          })
        }
        return { action: 'lost' }
      }
    }

    // Check max attempts (using follow-up steps or config)
    const maxAttempts = getMaxAttempts(config, followUpSteps, cartType)
    if (cart.recoveryAttempts >= maxAttempts) {
      await prisma.abandonedCart.update({
        where: { id: cartId },
        data: { status: 'LOST' },
      })
      return { action: 'lost' }
    }

    // Determine delay for current attempt
    const delayMinutes = getDelayForAttempt(cart.recoveryAttempts, config, followUpSteps, cartType)
    if (delayMinutes === null) {
      // No more follow-ups configured
      await prisma.abandonedCart.update({
        where: { id: cartId },
        data: { status: 'LOST' },
      })
      return { action: 'lost' }
    }

    // Check if enough time has passed
    const referenceTime = cart.lastAttemptAt ?? cart.abandonedAt
    if (!hasDelayPassed(new Date(referenceTime), delayMinutes)) {
      return { action: 'skipped', error: 'Delay not passed yet' }
    }

    // Get step-specific strategy (if using follow-up steps)
    const stepStrategy = getStepStrategy(cart.recoveryAttempts, followUpSteps, cartType)

    // Generate message with stage context + step strategy
    const cartTyped = cart as unknown as AbandonedCart
    const stages = (store.recoveryStages ?? []) as unknown as import('@/types').RecoveryStage[]
    const firstStage = stages[0] ?? null
    let generationResult

    if (cart.recoveryAttempts === 0) {
      // First message — use stage 1
      generationResult = await recoveryEngine.generateFirstMessage(
        cartTyped,
        settings,
        config,
        firstStage,
        stepStrategy
      )
    } else {
      // Follow-up message — use corresponding stage
      const stageForAttempt = stages[cart.recoveryAttempts] ?? stages[stages.length - 1] ?? null
      generationResult = await recoveryEngine.generateFollowUp(
        cartTyped,
        settings,
        config,
        cart.recoveryAttempts + 1,
        stageForAttempt,
        stepStrategy
      )
    }

    // Send via WhatsApp
    const instanceName = `recupera-${store.id}`
    try {
      if (evolutionApi.isConfigured()) {
        await evolutionApi.sendText(instanceName, cart.customerPhone, generationResult.message)
      } else {
        console.warn(`[Scheduler] Evolution API not configured, message not sent for cart ${cartId}`)
      }
    } catch (sendError) {
      console.error(`[Scheduler] WhatsApp send failed for cart ${cartId}:`, sendError)
      // Continue to update DB even if send fails - the message is logged
    }

    // Create or update conversation
    let conversation = cart.conversation
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          storeId: store.id,
          abandonedCartId: cartId,
          customerPhone: cart.customerPhone,
          customerName: cart.customerName,
          status: 'ACTIVE',
          aiModel: generationResult.model,
          totalTokens: generationResult.tokensUsed,
          estimatedCost: generationResult.estimatedCost,
          lastMessageAt: new Date(),
        },
        include: {
          messages: true,
        },
      })
    } else {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          totalTokens: { increment: generationResult.tokensUsed },
          estimatedCost: { increment: generationResult.estimatedCost },
          aiModel: generationResult.model,
          lastMessageAt: new Date(),
        },
      })
    }

    // Save AI message with follow-up step number
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'AI',
        content: generationResult.message,
        messageStatus: 'SENT',
        tokensUsed: generationResult.tokensUsed,
        modelUsed: generationResult.model,
        followUpStep: cart.recoveryAttempts,
      },
    })

    // Update cart: increment attempts, update status, set lastAttemptAt
    const newStatus = cart.status === 'PENDING' ? 'CONTACTING' : cart.status
    await prisma.abandonedCart.update({
      where: { id: cartId },
      data: {
        status: newStatus,
        recoveryAttempts: { increment: 1 },
        lastAttemptAt: new Date(),
      },
    })

    return { action: 'sent' }
  } catch (error) {
    console.error(`[Scheduler] Error processing cart ${cartId}:`, error)
    return {
      action: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================================
// PIX EXPIRATION
// ============================================================

/**
 * Expire PIX_PENDING carts that exceeded their store's pixExpirationMinutes.
 * Runs before processing to avoid sending messages for expired Pix.
 */
async function expirePixPendingCarts(): Promise<number> {
  try {
    const pixCarts = await prisma.abandonedCart.findMany({
      where: {
        type: 'PIX_PENDING',
        status: { in: ['PENDING', 'CONTACTING'] },
        store: {
          isActive: true,
          recoveryConfig: { isActive: true },
        },
      },
      select: {
        id: true,
        abandonedAt: true,
        store: {
          select: {
            recoveryConfig: {
              select: { pixExpirationMinutes: true },
            },
          },
        },
      },
    })

    let expired = 0
    const now = new Date()

    for (const cart of pixCarts) {
      const expirationMinutes = cart.store.recoveryConfig?.pixExpirationMinutes ?? 1440
      const expiresAt = new Date(cart.abandonedAt.getTime() + expirationMinutes * 60 * 1000)

      if (now > expiresAt) {
        await prisma.abandonedCart.update({
          where: { id: cart.id },
          data: { status: 'EXPIRED' },
        })
        expired++
      }
    }

    if (expired > 0) {
      console.log(`[Scheduler] Expired ${expired} PIX_PENDING carts`)
    }

    return expired
  } catch (error) {
    console.error('[Scheduler] Error expiring PIX carts:', error)
    return 0
  }
}

// ============================================================
// BATCH PROCESSOR
// ============================================================

/**
 * Process all pending recovery jobs across all active stores.
 * Called by the cron endpoint every 5 minutes.
 */
export async function processRecoveryJobs(): Promise<SchedulerStats> {
  const stats: SchedulerStats = {
    processed: 0,
    sent: 0,
    skipped: 0,
    errors: 0,
    lost: 0,
    details: [],
  }

  try {
    // 0. Expire PIX_PENDING carts that exceeded their expiration window
    await expirePixPendingCarts()

    // Find all carts that need processing:
    // - Status is PENDING (waiting for first message)
    // - Status is CONTACTING (waiting for follow-up)
    // - Store has recovery enabled and WhatsApp connected
    const carts = await prisma.abandonedCart.findMany({
      where: {
        status: { in: ['PENDING', 'CONTACTING'] },
        store: {
          isActive: true,
          whatsappConnected: true,
          recoveryConfig: {
            isActive: true,
          },
        },
        customerPhone: { not: null },
      },
      select: { id: true },
      orderBy: { abandonedAt: 'asc' },
      take: 100, // Process max 100 carts per run to stay within Vercel limits
    })

    if (carts.length === 0) {
      stats.details.push('No pending carts to process')
      return stats
    }

    stats.details.push(`Found ${carts.length} carts to evaluate`)

    // Process carts sequentially to avoid overwhelming WhatsApp API
    for (const cart of carts) {
      stats.processed++

      const result = await processSingleCart(cart.id)

      switch (result.action) {
        case 'sent':
          stats.sent++
          break
        case 'skipped':
          stats.skipped++
          break
        case 'lost':
          stats.lost++
          break
        case 'error':
          stats.errors++
          stats.details.push(`Error on cart ${cart.id}: ${result.error}`)
          break
      }
    }

    stats.details.push(
      `Completed: ${stats.sent} sent, ${stats.skipped} skipped, ${stats.lost} lost, ${stats.errors} errors`
    )
  } catch (error) {
    console.error('[Scheduler] Fatal error in processRecoveryJobs:', error)
    stats.errors++
    stats.details.push(
      `Fatal error: ${error instanceof Error ? error.message : 'Unknown'}`
    )
  }

  return stats
}
