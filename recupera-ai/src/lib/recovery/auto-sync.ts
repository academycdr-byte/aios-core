/**
 * Auto-Sync — Periodic catch-up for abandoned carts via Shopify REST API.
 * Called by the Vercel Cron job every 5 minutes.
 * Only syncs stores that haven't been synced in the last 30 minutes.
 * Limits to 3 stores per cycle to stay within the 60s timeout.
 */

import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { fetchAbandonedCheckouts } from '@/lib/integrations/shopify'
import {
  parseAbandonedCheckout,
  type ShopifyCheckoutPayload,
} from '@/lib/webhooks/shopify-parser'

export interface AutoSyncStats {
  storesSynced: number
  totalImported: number
  totalUpdated: number
  totalSkipped: number
  errors: string[]
}

const SYNC_INTERVAL_MS = 30 * 60 * 1000 // 30 minutes
const MAX_STORES_PER_CYCLE = 3

export async function autoSyncStores(): Promise<AutoSyncStats> {
  const stats: AutoSyncStats = {
    storesSynced: 0,
    totalImported: 0,
    totalUpdated: 0,
    totalSkipped: 0,
    errors: [],
  }

  try {
    const cutoff = new Date(Date.now() - SYNC_INTERVAL_MS)

    // Find Shopify stores that need sync
    const stores = await prisma.store.findMany({
      where: {
        platform: 'SHOPIFY',
        isActive: true,
        accessToken: { not: null },
        shopifyDomain: { not: null },
        OR: [
          { lastSyncAt: null },
          { lastSyncAt: { lt: cutoff } },
        ],
      },
      select: {
        id: true,
        shopifyDomain: true,
        accessToken: true,
      },
      take: MAX_STORES_PER_CYCLE,
      orderBy: { lastSyncAt: 'asc' }, // oldest sync first
    })

    if (stores.length === 0) return stats

    for (const store of stores) {
      try {
        if (!store.accessToken || !store.shopifyDomain) continue

        let plainToken: string
        try {
          plainToken = decrypt(store.accessToken)
        } catch {
          stats.errors.push(`Store ${store.id}: failed to decrypt token`)
          continue
        }

        const checkouts = await fetchAbandonedCheckouts(store.shopifyDomain, plainToken)

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
            where: { storeId: store.id, platformCartId: parsed.platformCartId },
          })

          if (existing) {
            // Only update if cart is still pending (don't overwrite CONTACTING/PAID/etc)
            if (existing.status === 'PENDING') {
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
              skipped++
            }
          } else {
            await prisma.abandonedCart.create({
              data: {
                storeId: store.id,
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

        // Update lastSyncAt
        await prisma.store.update({
          where: { id: store.id },
          data: { lastSyncAt: new Date() },
        })

        stats.storesSynced++
        stats.totalImported += imported
        stats.totalUpdated += updated
        stats.totalSkipped += skipped

        console.log(
          `[AutoSync] Store ${store.id}: fetched=${checkouts.length}, imported=${imported}, updated=${updated}, skipped=${skipped}`
        )
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error'
        stats.errors.push(`Store ${store.id}: ${msg}`)
        console.error(`[AutoSync] Error syncing store ${store.id}:`, error)
      }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    stats.errors.push(`Global: ${msg}`)
    console.error('[AutoSync] Global error:', error)
  }

  return stats
}
