import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth-utils'
import { decrypt } from '@/lib/encryption'
import { fetchAbandonedCheckouts } from '@/lib/integrations/shopify'
import {
  parseAbandonedCheckout,
  type ShopifyCheckoutPayload,
} from '@/lib/webhooks/shopify-parser'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * POST /api/stores/[id]/sync
 * Pull abandoned checkouts from Shopify API and upsert into abandoned_carts table.
 */
export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = await context.params
    const store = await prisma.store.findFirst({
      where: { id, userId: user.id },
    })

    if (!store) {
      return NextResponse.json(
        { error: 'not_found', message: 'Store not found' },
        { status: 404 }
      )
    }

    if (store.platform !== 'SHOPIFY') {
      return NextResponse.json(
        { error: 'unsupported', message: 'Sync is only available for Shopify stores' },
        { status: 400 }
      )
    }

    if (!store.accessToken || !store.shopifyDomain) {
      return NextResponse.json(
        { error: 'configuration_error', message: 'Shopify not connected' },
        { status: 400 }
      )
    }

    let plainAccessToken: string
    try {
      plainAccessToken = decrypt(store.accessToken)
    } catch {
      return NextResponse.json(
        { error: 'configuration_error', message: 'Failed to decrypt access token' },
        { status: 500 }
      )
    }

    const checkouts = await fetchAbandonedCheckouts(
      store.shopifyDomain,
      plainAccessToken
    )

    let imported = 0
    let updated = 0
    let skipped = 0

    for (const checkout of checkouts) {
      const parsed = parseAbandonedCheckout(checkout as unknown as ShopifyCheckoutPayload)

      if (!parsed.platformCartId) {
        skipped++
        continue
      }

      const existing = await prisma.abandonedCart.findFirst({
        where: { storeId: id, platformCartId: parsed.platformCartId },
      })

      if (existing) {
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
        updated++
      } else {
        await prisma.abandonedCart.create({
          data: {
            storeId: id,
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
        imported++
      }
    }

    await prisma.store.update({
      where: { id },
      data: { lastSyncAt: new Date() },
    })

    return NextResponse.json({
      data: {
        totalFetched: checkouts.length,
        imported,
        updated,
        skipped,
        lastSyncAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('[Store Sync] Error:', error)
    return NextResponse.json(
      {
        error: 'internal_error',
        message: `Failed to sync: ${error instanceof Error ? error.message : 'Unknown'}`,
      },
      { status: 500 }
    )
  }
}
