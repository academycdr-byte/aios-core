/**
 * Link Tracking Utilities
 * Creates tracked links that redirect through /api/r/[code] for click tracking.
 */

import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

/**
 * Create a tracked link that wraps a target URL.
 * Returns the tracking URL (e.g., https://domain.com/api/r/abc123).
 */
export async function createTrackedLink(options: {
  storeId: string
  targetUrl: string
  conversationId?: string
  cartId?: string
}): Promise<string> {
  const code = crypto.randomBytes(6).toString('base64url')

  await prisma.trackedLink.create({
    data: {
      storeId: options.storeId,
      code,
      targetUrl: options.targetUrl,
      conversationId: options.conversationId ?? null,
      cartId: options.cartId ?? null,
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
  cartId?: string
): Promise<string> {
  if (!checkoutUrl || !message.includes(checkoutUrl)) {
    return message
  }

  const trackedUrl = await createTrackedLink({
    storeId,
    targetUrl: checkoutUrl,
    conversationId,
    cartId,
  })

  return message.replace(checkoutUrl, trackedUrl)
}
