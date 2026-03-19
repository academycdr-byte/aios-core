/**
 * Link Tracking Utilities
 * Creates tracked links that redirect through /api/r/[code] for click tracking.
 * Includes UTM parameter injection for attribution.
 */

import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

/**
 * Create a tracked link that wraps a target URL.
 * Appends UTM parameters for attribution and stores step metadata.
 * Returns the tracking URL (e.g., https://domain.com/api/r/abc123).
 */
export async function createTrackedLink(options: {
  storeId: string
  targetUrl: string
  conversationId?: string
  cartId?: string
  stepNumber?: number
}): Promise<string> {
  const code = crypto.randomBytes(6).toString('base64url')

  // Build UTM params
  const utmSource = 'recupera-ai'
  const utmMedium = 'whatsapp'
  const utmCampaign = 'recovery'
  const utmContent = options.stepNumber != null ? `step-${options.stepNumber}` : undefined

  // Append UTMs to target URL
  const url = new URL(options.targetUrl)
  url.searchParams.set('utm_source', utmSource)
  url.searchParams.set('utm_medium', utmMedium)
  url.searchParams.set('utm_campaign', utmCampaign)
  if (utmContent) url.searchParams.set('utm_content', utmContent)
  if (options.cartId) url.searchParams.set('utm_term', options.cartId)

  const targetUrlWithUtm = url.toString()

  await prisma.trackedLink.create({
    data: {
      storeId: options.storeId,
      code,
      targetUrl: targetUrlWithUtm,
      conversationId: options.conversationId ?? null,
      cartId: options.cartId ?? null,
      stepNumber: options.stepNumber ?? null,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent: utmContent ?? null,
    },
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://recupera-ai-five.vercel.app'
  return `${appUrl}/api/r/${code}`
}

/**
 * Replace a checkout URL in message text with a tracked version.
 * If the message contains the checkoutUrl, replaces it with the tracked link.
 */
export async function wrapCheckoutLink(
  message: string,
  checkoutUrl: string | null | undefined,
  storeId: string,
  conversationId?: string,
  cartId?: string,
  stepNumber?: number
): Promise<string> {
  if (!checkoutUrl || !message.includes(checkoutUrl)) {
    return message
  }

  const trackedUrl = await createTrackedLink({
    storeId,
    targetUrl: checkoutUrl,
    conversationId,
    cartId,
    stepNumber,
  })

  return message.replace(checkoutUrl, trackedUrl)
}
