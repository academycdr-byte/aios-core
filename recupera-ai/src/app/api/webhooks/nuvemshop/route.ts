/**
 * POST /api/webhooks/nuvemshop
 * Receive Nuvemshop (Tiendanube) webhook events: cart/abandoned, order/paid
 * Validates HMAC-SHA256 signature (x-linkedstore-hmac-sha256 header).
 * Creates AbandonedCart records or marks existing carts as PAID.
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import {
  parseAbandonedCart,
  parseOrderPaid,
  type NuvemshopAbandonedCartPayload,
  type NuvemshopOrderPayload,
} from '@/lib/webhooks/nuvemshop-parser'
import { normalizeBrazilPhone } from '@/lib/evolution-api'

export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    // 1. Read raw body for HMAC verification
    const rawBody = await request.text()

    // 2. Extract Nuvemshop headers
    const hmacHeader = request.headers.get('x-linkedstore-hmac-sha256')
    const nuvemshopStoreId = request.headers.get('x-linkedstore-id')

    if (!nuvemshopStoreId) {
      return NextResponse.json(
        { error: 'bad_request', message: 'Missing store ID header' },
        { status: 400 }
      )
    }

    // 3. Find the store by nuvemshopStoreId to get its webhookSecret
    const store = await prisma.store.findFirst({
      where: {
        platform: 'NUVEMSHOP',
        nuvemshopStoreId: nuvemshopStoreId,
        isActive: true,
      },
      select: {
        id: true,
        webhookSecret: true,
      },
    })

    if (!store) {
      console.warn(`[Nuvemshop Webhook] No active store found for ID: ${nuvemshopStoreId}`)
      return NextResponse.json(
        { error: 'not_found', message: 'Store not registered' },
        { status: 404 }
      )
    }

    // 4. Verify HMAC signature (Nuvemshop uses hex digest)
    if (store.webhookSecret) {
      if (!hmacHeader) {
        console.warn(`[Nuvemshop Webhook] Missing HMAC header for store ${nuvemshopStoreId} (secret configured)`)
        return NextResponse.json(
          { error: 'unauthorized', message: 'Missing HMAC signature' },
          { status: 401 }
        )
      }

      const computedHmac = crypto
        .createHmac('sha256', store.webhookSecret)
        .update(rawBody, 'utf8')
        .digest('hex')

      if (hmacHeader !== computedHmac) {
        console.warn(`[Nuvemshop Webhook] HMAC mismatch for store ${nuvemshopStoreId}`)
        return NextResponse.json(
          { error: 'unauthorized', message: 'Invalid HMAC signature' },
          { status: 401 }
        )
      }
    } else {
      console.warn(`[Nuvemshop Webhook] No webhook secret configured for store ${nuvemshopStoreId} - rejecting`)
      return NextResponse.json(
        { error: 'configuration_error', message: 'Webhook secret not configured' },
        { status: 500 }
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

    // 6. Determine event type
    const eventType = (payload.event as string) ?? detectEventType(payload)

    // 7. Route by event type
    switch (eventType) {
      case 'cart/abandoned':
      case 'abandoned_checkout': {
        await handleAbandonedCart(store.id, payload as unknown as NuvemshopAbandonedCartPayload)
        break
      }

      case 'order/paid':
      case 'order/created': {
        await handleOrderPaid(store.id, payload as unknown as NuvemshopOrderPayload)
        break
      }

      default: {
        console.log(`[Nuvemshop Webhook] Unhandled event: ${eventType} from store ${nuvemshopStoreId}`)
      }
    }

    // 8. Always return 200
    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('[Nuvemshop Webhook] Error:', error)
    return NextResponse.json({ received: true, error: true }, { status: 200 })
  }
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Detect event type from payload structure when event header is missing.
 */
function detectEventType(payload: Record<string, unknown>): string {
  if (payload.checkout_url || payload.recovery_url) {
    return 'cart/abandoned'
  }
  if (payload.payment_status === 'paid') {
    return 'order/paid'
  }
  return 'unknown'
}

// ============================================================
// HANDLERS
// ============================================================

async function handleAbandonedCart(
  storeId: string,
  payload: NuvemshopAbandonedCartPayload
): Promise<void> {
  const parsed = parseAbandonedCart(payload)

  console.log(
    `[Nuvemshop Webhook] Abandoned cart for store ${storeId}:`,
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
      console.log(`[Nuvemshop Webhook] Updated existing cart ${existing.id}`)
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

  console.log(`[Nuvemshop Webhook] Created AbandonedCart ${newCart.id} for store ${storeId}`)
}

async function handleOrderPaid(
  storeId: string,
  payload: NuvemshopOrderPayload
): Promise<void> {
  const parsed = parseOrderPaid(payload)

  console.log(
    `[Nuvemshop Webhook] Order paid for store ${storeId}:`,
    {
      orderId: parsed.platformOrderId,
      cartId: parsed.platformCartId,
      value: parsed.paidValue,
    }
  )

  // Try to find the matching abandoned cart
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
    await prisma.abandonedCart.update({
      where: { id: cart.id },
      data: {
        status: 'PAID',
        platformOrderId: parsed.platformOrderId,
        paidAt: new Date(),
        paidValue: parsed.paidValue,
        recoveredAt: cart.recoveredAt ?? new Date(),
        recoveredValue: cart.recoveredValue ?? parsed.paidValue,
      },
    })

    // Close active conversation
    const conversation = await prisma.conversation.findFirst({
      where: { abandonedCartId: cart.id, status: 'ACTIVE' },
    })

    if (conversation) {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          status: 'RECOVERED',
          closedAt: new Date(),
        },
      })
    }

    console.log(`[Nuvemshop Webhook] Cart ${cart.id} marked as PAID (order ${parsed.platformOrderId})`)
  } else {
    console.log(`[Nuvemshop Webhook] No matching cart found for order ${parsed.platformOrderId}`)
  }
}
