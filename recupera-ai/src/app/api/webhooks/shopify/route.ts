/**
 * POST /api/webhooks/shopify
 * Receive Shopify webhook events: checkouts/create, checkouts/update, orders/paid
 * Validates HMAC-SHA256 signature using the store's webhookSecret.
 * Creates AbandonedCart records or marks existing carts as PAID.
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import {
  parseAbandonedCheckout,
  parseOrderPaid,
  parseOrderCreated,
  detectPaymentType,
  type ShopifyCheckoutPayload,
  type ShopifyOrderPayload,
} from '@/lib/webhooks/shopify-parser'
import { normalizeBrazilPhone } from '@/lib/evolution-api'

export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    // 1. Read raw body for HMAC verification
    const rawBody = await request.text()

    // 2. Extract Shopify headers
    const hmacHeader = request.headers.get('x-shopify-hmac-sha256')
    const shopifyTopic = request.headers.get('x-shopify-topic')
    const shopifyDomain = request.headers.get('x-shopify-shop-domain')

    if (!hmacHeader) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Missing HMAC signature' },
        { status: 401 }
      )
    }

    if (!shopifyDomain) {
      return NextResponse.json(
        { error: 'bad_request', message: 'Missing shop domain header' },
        { status: 400 }
      )
    }

    // 3. Find the store by shopifyDomain to get its webhookSecret
    const store = await prisma.store.findFirst({
      where: {
        platform: 'SHOPIFY',
        shopifyDomain: shopifyDomain,
        isActive: true,
      },
      select: {
        id: true,
        webhookSecret: true,
      },
    })

    if (!store) {
      console.warn(`[Shopify Webhook] No active store found for domain: ${shopifyDomain}`)
      return NextResponse.json(
        { error: 'not_found', message: 'Store not registered' },
        { status: 404 }
      )
    }

    // 4. Verify HMAC signature
    const webhookSecret = store.webhookSecret
    if (!webhookSecret) {
      console.warn(`[Shopify Webhook] No webhook secret for store ${store.id} (${shopifyDomain})`)
      return NextResponse.json(
        { error: 'configuration_error', message: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    const computedHmac = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody, 'utf8')
      .digest('base64')

    // Constant-time comparison to prevent timing attacks
    const isValid =
      hmacHeader.length === computedHmac.length &&
      crypto.timingSafeEqual(
        Buffer.from(hmacHeader),
        Buffer.from(computedHmac)
      )

    if (!isValid) {
      console.warn(`[Shopify Webhook] HMAC mismatch for ${shopifyDomain}. Topic: ${shopifyTopic}`)
      return NextResponse.json(
        { error: 'unauthorized', message: 'Invalid HMAC signature' },
        { status: 401 }
      )
    }

    // 5. Parse body
    let payload: Record<string, unknown>
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json(
        { error: 'bad_request', message: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    // 6. Route by topic
    switch (shopifyTopic) {
      case 'checkouts/create':
      case 'checkouts/update': {
        await handleAbandonedCheckout(store.id, payload as unknown as ShopifyCheckoutPayload)
        break
      }

      case 'orders/paid': {
        await handleOrderPaid(store.id, payload as unknown as ShopifyOrderPayload)
        break
      }

      case 'orders/create': {
        await handleOrderCreated(store.id, payload as unknown as ShopifyOrderPayload)
        break
      }

      default: {
        console.log(`[Shopify Webhook] Unhandled topic: ${shopifyTopic} from ${shopifyDomain}`)
      }
    }

    // 7. Always return 200 (Shopify requires quick acknowledgment)
    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('[Shopify Webhook] Error:', error)
    // Still return 200 to prevent Shopify from retrying on our app errors
    return NextResponse.json({ received: true, error: true }, { status: 200 })
  }
}

// ============================================================
// HANDLERS
// ============================================================

async function handleAbandonedCheckout(
  storeId: string,
  payload: ShopifyCheckoutPayload
): Promise<void> {
  // Skip completed checkouts — they are paid, not abandoned
  if (payload.completed_at) {
    console.log('[Shopify Webhook] Checkout completed, not abandoned - skipping')
    return
  }

  const parsed = parseAbandonedCheckout(payload)

  console.log(
    `[Shopify Webhook] Abandoned checkout for store ${storeId}:`,
    {
      cartId: parsed.platformCartId,
      customer: parsed.customerName,
      total: parsed.cartTotal,
      items: parsed.itemCount,
    }
  )

  // Check if this cart already exists (by platformCartId)
  if (parsed.platformCartId) {
    const existing = await prisma.abandonedCart.findFirst({
      where: {
        storeId,
        platformCartId: parsed.platformCartId,
      },
    })

    if (existing) {
      // Update existing cart with latest data
      await prisma.abandonedCart.update({
        where: { id: existing.id },
        data: {
          customerName: parsed.customerName ?? existing.customerName,
          customerEmail: parsed.customerEmail ?? existing.customerEmail,
          customerPhone: parsed.customerPhone ?? existing.customerPhone,
          cartTotal: parsed.cartTotal || existing.cartTotal,
          cartItems: JSON.parse(JSON.stringify(parsed.cartItems)),
          itemCount: parsed.itemCount || existing.itemCount,
          checkoutUrl: parsed.checkoutUrl ?? existing.checkoutUrl,
        },
      })
      console.log(`[Shopify Webhook] Updated existing cart ${existing.id}`)
      return
    }
  }

  // Create new AbandonedCart
  const newCart = await prisma.abandonedCart.create({
    data: {
      storeId,
      customerName: parsed.customerName,
      customerEmail: parsed.customerEmail,
      customerPhone: parsed.customerPhone,
      cartTotal: parsed.cartTotal,
      currency: parsed.currency,
      cartItems: JSON.parse(JSON.stringify(parsed.cartItems)),
      itemCount: parsed.itemCount,
      checkoutUrl: parsed.checkoutUrl,
      platformCartId: parsed.platformCartId,
      type: 'ABANDONED_CART',
      status: 'PENDING',
      abandonedAt: parsed.abandonedAt,
    },
  })

  console.log(`[Shopify Webhook] Created AbandonedCart ${newCart.id} for store ${storeId}`)
}

async function handleOrderPaid(
  storeId: string,
  payload: ShopifyOrderPayload
): Promise<void> {
  const parsed = parseOrderPaid(payload)

  console.log(
    `[Shopify Webhook] Order paid for store ${storeId}:`,
    {
      orderId: parsed.platformOrderId,
      cartId: parsed.platformCartId,
      value: parsed.paidValue,
    }
  )

  // Try to find the matching abandoned cart
  // First by checkout ID (most reliable), then by customer email
  let cart = null

  if (parsed.platformCartId) {
    cart = await prisma.abandonedCart.findFirst({
      where: {
        storeId,
        platformCartId: parsed.platformCartId,
        status: { in: ['PENDING', 'CONTACTING', 'RECOVERED'] },
      },
    })
  }

  if (!cart && parsed.customerEmail) {
    // Fallback: find by email within the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    cart = await prisma.abandonedCart.findFirst({
      where: {
        storeId,
        customerEmail: parsed.customerEmail,
        status: { in: ['PENDING', 'CONTACTING', 'RECOVERED'] },
        abandonedAt: { gte: sevenDaysAgo },
      },
      orderBy: { abandonedAt: 'desc' },
    })
  }

  if (!cart && parsed.customerPhone) {
    // Fallback: find by phone within the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const normalizedPhone = normalizeBrazilPhone(parsed.customerPhone)

    cart = await prisma.abandonedCart.findFirst({
      where: {
        storeId,
        customerPhone: normalizedPhone,
        status: { in: ['PENDING', 'CONTACTING', 'RECOVERED'] },
        abandonedAt: { gte: sevenDaysAgo },
      },
      orderBy: { abandonedAt: 'desc' },
    })
  }

  if (cart) {
    // Step attribution: find which step led to conversion
    // Priority: 1) Last clicked tracked link, 2) Last AI message sent
    let convertedAtStep: number | null = null

    // Check tracked link clicks for this cart
    const lastClickedLink = await prisma.trackedLink.findFirst({
      where: {
        cartId: cart.id,
        clicks: { gt: 0 },
        stepNumber: { not: null },
      },
      orderBy: { lastClickAt: 'desc' },
    })

    if (lastClickedLink?.stepNumber != null) {
      convertedAtStep = lastClickedLink.stepNumber
    } else {
      // Fallback: last AI message's followUpStep
      const conversation = await prisma.conversation.findFirst({
        where: { abandonedCartId: cart.id },
        select: {
          messages: {
            where: { role: 'AI', followUpStep: { not: null } },
            orderBy: { sentAt: 'desc' },
            take: 1,
            select: { followUpStep: true },
          },
        },
      })
      if (conversation?.messages[0]?.followUpStep != null) {
        convertedAtStep = conversation.messages[0].followUpStep
      }
    }

    await prisma.abandonedCart.update({
      where: { id: cart.id },
      data: {
        status: 'PAID',
        platformOrderId: parsed.platformOrderId,
        paidAt: new Date(),
        paidValue: parsed.paidValue,
        // If not yet marked as recovered, also set recoveredAt
        recoveredAt: cart.recoveredAt ?? new Date(),
        recoveredValue: cart.recoveredValue ?? parsed.paidValue,
        // Step attribution
        recoveredAtStage: cart.recoveredAtStage ?? convertedAtStep,
      },
    })

    // Also close the conversation if active
    const conversationToClose = await prisma.conversation.findFirst({
      where: { abandonedCartId: cart.id, status: 'ACTIVE' },
    })

    if (conversationToClose) {
      await prisma.conversation.update({
        where: { id: conversationToClose.id },
        data: {
          status: 'RECOVERED',
          closedAt: new Date(),
        },
      })
    }

    console.log(`[Shopify Webhook] Cart ${cart.id} marked as PAID (order ${parsed.platformOrderId}, step=${convertedAtStep})`)
  } else {
    console.log(`[Shopify Webhook] No matching cart found for order ${parsed.platformOrderId}`)
  }
}

async function handleOrderCreated(
  storeId: string,
  payload: ShopifyOrderPayload
): Promise<void> {
  const paymentType = detectPaymentType(payload)

  if (!paymentType) {
    console.log(`[Shopify Webhook] orders/create ignored: financial_status=${payload.financial_status}`)
    return
  }

  // If already paid, delegate to handleOrderPaid
  if (paymentType === 'PAID') {
    await handleOrderPaid(storeId, payload)
    return
  }

  const parsed = parseOrderCreated(payload)

  console.log(
    `[Shopify Webhook] Order created (${paymentType}) for store ${storeId}:`,
    {
      orderId: parsed.platformOrderId,
      cartId: parsed.platformCartId,
      total: parsed.cartTotal,
      gateway: payload.gateway,
    }
  )

  // Check if a cart already exists for this checkout (might have been created by checkouts/create)
  if (parsed.platformCartId) {
    const existing = await prisma.abandonedCart.findFirst({
      where: { storeId, platformCartId: parsed.platformCartId },
    })

    if (existing) {
      // Update the existing cart type to PIX_PENDING or CARD_DECLINED
      await prisma.abandonedCart.update({
        where: { id: existing.id },
        data: {
          type: paymentType,
          platformOrderId: parsed.platformOrderId,
          customerName: parsed.customerName ?? existing.customerName,
          customerEmail: parsed.customerEmail ?? existing.customerEmail,
          customerPhone: parsed.customerPhone ?? existing.customerPhone,
        },
      })
      console.log(`[Shopify Webhook] Updated cart ${existing.id} to ${paymentType}`)
      return
    }
  }

  // Create new cart with the detected type
  const newCart = await prisma.abandonedCart.create({
    data: {
      storeId,
      customerName: parsed.customerName,
      customerEmail: parsed.customerEmail,
      customerPhone: parsed.customerPhone,
      cartTotal: parsed.cartTotal,
      currency: parsed.currency,
      cartItems: JSON.parse(JSON.stringify(parsed.cartItems)),
      itemCount: parsed.itemCount,
      checkoutUrl: parsed.checkoutUrl,
      platformCartId: parsed.platformCartId,
      platformOrderId: parsed.platformOrderId,
      type: paymentType,
      status: 'PENDING',
      abandonedAt: new Date(),
    },
  })

  console.log(`[Shopify Webhook] Created ${paymentType} cart ${newCart.id} for store ${storeId}`)
}
