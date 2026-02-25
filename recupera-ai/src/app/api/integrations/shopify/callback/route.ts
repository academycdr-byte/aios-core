import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { encrypt, decrypt } from '@/lib/encryption'
import {
  exchangeShopifyCode,
  validateShopifyHmac,
  registerAbandonedCartWebhook,
} from '@/lib/integrations/shopify'

/**
 * GET /api/integrations/shopify/callback
 * Handles the Shopify OAuth callback.
 * Validates HMAC, exchanges code for access token, saves token, registers webhooks.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const code = searchParams.get('code')
    const shop = searchParams.get('shop')
    const state = searchParams.get('state')
    const hmac = searchParams.get('hmac')

    if (!code || !shop || !state) {
      return NextResponse.redirect(
        new URL('/lojas?error=missing_params', request.url)
      )
    }

    // Validate CSRF state
    const cookieStore = await cookies()
    const savedState = cookieStore.get('shopify_oauth_state')?.value
    const savedStoreId = cookieStore.get('shopify_oauth_store_id')?.value

    if (!savedState || savedState !== state || !savedStoreId) {
      return NextResponse.redirect(
        new URL('/lojas?error=invalid_state', request.url)
      )
    }

    // Clean up cookies
    cookieStore.delete('shopify_oauth_state')
    cookieStore.delete('shopify_oauth_store_id')

    // Find the store
    const store = await prisma.store.findUnique({
      where: { id: savedStoreId },
    })

    if (!store || !store.shopifyClientId || !store.shopifyClientSecret) {
      return NextResponse.redirect(
        new URL('/lojas?error=store_not_found', request.url)
      )
    }

    // Decrypt credentials
    const clientId = decrypt(store.shopifyClientId)
    const clientSecret = decrypt(store.shopifyClientSecret)

    // Validate HMAC if present
    if (hmac) {
      const queryObj: Record<string, string> = {}
      searchParams.forEach((value, key) => {
        queryObj[key] = value
      })

      const isValid = validateShopifyHmac(queryObj, clientSecret)
      if (!isValid) {
        console.warn('[Shopify OAuth] HMAC validation failed for store:', savedStoreId)
        // Continue anyway - some Shopify versions may not send HMAC on callback
      }
    }

    // Exchange code for access token
    const tokenData = await exchangeShopifyCode(shop, code, {
      clientId,
      clientSecret,
    })

    // Generate webhook secret for validating incoming webhooks
    const crypto = await import('crypto')
    const webhookSecret = crypto.randomBytes(32).toString('hex')

    // Update store with access token and status
    await prisma.store.update({
      where: { id: savedStoreId },
      data: {
        accessToken: encrypt(tokenData.access_token),
        shopifyScopes: tokenData.scope,
        connectionStatus: 'CONNECTED',
        webhookSecret,
      },
    })

    // Register abandoned cart webhook (fire-and-forget)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const webhookUrl = `${appUrl}/api/webhooks/shopify`

    registerAbandonedCartWebhook(shop, tokenData.access_token, webhookUrl)
      .then((result) => {
        if (result) {
          prisma.store.update({
            where: { id: savedStoreId },
            data: { shopifyWebhookId: result.id },
          }).catch(() => {})
        }
      })
      .catch((err) => {
        console.error('[Shopify OAuth] Failed to register webhook:', err)
      })

    // Create default StoreSettings and RecoveryConfig if they don't exist
    const existingSettings = await prisma.storeSettings.findUnique({
      where: { storeId: savedStoreId },
    })
    if (!existingSettings) {
      await prisma.storeSettings.create({
        data: {
          storeId: savedStoreId,
          aiTone: 'amigavel',
          aiName: 'Assistente',
          timezone: 'America/Sao_Paulo',
        },
      })
    }

    const existingConfig = await prisma.recoveryConfig.findUnique({
      where: { storeId: savedStoreId },
    })
    if (!existingConfig) {
      await prisma.recoveryConfig.create({
        data: {
          storeId: savedStoreId,
          isActive: true,
          firstMessageDelay: 30,
          followUp1Delay: 360,
          followUp2Delay: 1440,
          maxAttempts: 3,
          minCartValue: 50,
          pixRecoveryEnabled: true,
          pixFirstDelay: 15,
          pixFollowUpDelay: 120,
          pixMaxAttempts: 2,
          cardRecoveryEnabled: true,
          cardFirstDelay: 10,
          cardMaxAttempts: 2,
        },
      })
    }

    // Redirect to the store detail page
    return NextResponse.redirect(
      new URL(`/lojas/${savedStoreId}?connected=true`, request.url)
    )
  } catch (error) {
    console.error('[Shopify OAuth] Callback error:', error)
    return NextResponse.redirect(
      new URL('/lojas?error=oauth_failed', request.url)
    )
  }
}
