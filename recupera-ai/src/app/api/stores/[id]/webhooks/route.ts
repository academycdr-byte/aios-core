/**
 * POST /api/stores/[id]/webhooks
 * Register webhooks on the platform (Shopify GraphQL or Nuvemshop REST).
 * Generates a unique webhook secret, stores it on the store record,
 * and registers the webhook endpoint on the platform.
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth-utils'
import { decrypt } from '@/lib/encryption'

interface RouteContext {
  params: Promise<{ id: string }>
}

// Our webhook receive URLs
function getWebhookUrl(platform: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_URL ?? 'http://localhost:3333'
  return platform === 'SHOPIFY'
    ? `${baseUrl}/api/webhooks/shopify`
    : `${baseUrl}/api/webhooks/nuvemshop`
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = await context.params

    // Find the store
    const store = await prisma.store.findFirst({
      where: { id, userId: user.id },
    })

    if (!store) {
      return NextResponse.json(
        { error: 'not_found', message: 'Store not found' },
        { status: 404 }
      )
    }

    if (!store.accessToken) {
      return NextResponse.json(
        { error: 'configuration_error', message: 'Store access token not configured' },
        { status: 400 }
      )
    }

    // Decrypt the access token (stored encrypted in DB)
    let plainAccessToken: string
    try {
      plainAccessToken = decrypt(store.accessToken)
    } catch {
      return NextResponse.json(
        { error: 'configuration_error', message: 'Failed to decrypt access token' },
        { status: 500 }
      )
    }

    // Generate a unique webhook secret for HMAC validation
    const webhookSecret = crypto.randomBytes(32).toString('hex')

    // Route to platform-specific registration
    let result: WebhookRegistrationResult

    if (store.platform === 'SHOPIFY') {
      if (!store.shopifyDomain) {
        return NextResponse.json(
          { error: 'configuration_error', message: 'Shopify domain not configured' },
          { status: 400 }
        )
      }
      result = await registerShopifyWebhooks(
        store.shopifyDomain,
        plainAccessToken,
        webhookSecret
      )
    } else if (store.platform === 'NUVEMSHOP') {
      if (!store.nuvemshopStoreId) {
        return NextResponse.json(
          { error: 'configuration_error', message: 'Nuvemshop store ID not configured' },
          { status: 400 }
        )
      }
      result = await registerNuvemshopWebhooks(
        store.nuvemshopStoreId,
        plainAccessToken
      )
    } else {
      return NextResponse.json(
        { error: 'unsupported', message: `Platform ${store.platform} not supported` },
        { status: 400 }
      )
    }

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'registration_failed',
          message: result.error,
          details: result.details,
        },
        { status: 500 }
      )
    }

    // Save webhook secret and webhook IDs on the store
    await prisma.store.update({
      where: { id },
      data: {
        webhookSecret,
        shopifyWebhookId: store.platform === 'SHOPIFY'
          ? result.webhookIds.join(',')
          : store.shopifyWebhookId,
      },
    })

    return NextResponse.json({
      data: {
        registered: true,
        platform: store.platform,
        webhooksCreated: result.webhookIds.length,
        topics: result.topics,
      },
    })
  } catch (error) {
    console.error('[Webhook Registration] Error:', error)
    return NextResponse.json(
      {
        error: 'internal_error',
        message: `Failed to register webhooks: ${error instanceof Error ? error.message : 'Unknown'}`,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/stores/[id]/webhooks
 * List registered webhooks for a store
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
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
      select: {
        id: true,
        platform: true,
        webhookSecret: true,
        shopifyWebhookId: true,
      },
    })

    if (!store) {
      return NextResponse.json(
        { error: 'not_found', message: 'Store not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: {
        hasWebhookSecret: Boolean(store.webhookSecret),
        shopifyWebhookIds: store.shopifyWebhookId?.split(',') ?? [],
        platform: store.platform,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'internal_error',
        message: `Failed to fetch webhooks: ${error instanceof Error ? error.message : 'Unknown'}`,
      },
      { status: 500 }
    )
  }
}

// ============================================================
// TYPES
// ============================================================

interface WebhookRegistrationResult {
  success: boolean
  webhookIds: string[]
  topics: string[]
  error?: string
  details?: unknown
}

// ============================================================
// SHOPIFY WEBHOOK REGISTRATION
// ============================================================

const SHOPIFY_WEBHOOK_TOPICS = [
  'checkouts/create',
  'checkouts/update',
  'orders/create',
  'orders/paid',
]

async function registerShopifyWebhooks(
  shopifyDomain: string,
  accessToken: string,
  webhookSecret: string
): Promise<WebhookRegistrationResult> {
  const webhookUrl = getWebhookUrl('SHOPIFY')
  const webhookIds: string[] = []
  const registeredTopics: string[] = []
  const errors: string[] = []

  for (const topic of SHOPIFY_WEBHOOK_TOPICS) {
    try {
      const response = await fetch(
        `https://${shopifyDomain}/admin/api/2024-01/webhooks.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken,
          },
          body: JSON.stringify({
            webhook: {
              topic,
              address: webhookUrl,
              format: 'json',
            },
          }),
        }
      )

      if (!response.ok) {
        const errorBody = await response.text()
        errors.push(`Topic ${topic}: HTTP ${response.status} - ${errorBody}`)
        continue
      }

      const data = (await response.json()) as { webhook?: { id?: number } }
      const webhookId = data.webhook?.id?.toString()

      if (webhookId) {
        webhookIds.push(webhookId)
        registeredTopics.push(topic)
      }
    } catch (error) {
      errors.push(
        `Topic ${topic}: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  // Note: Shopify uses a shared secret per app, not per webhook.
  // The webhookSecret we generated is used on our side for HMAC verification.
  // For Shopify, the actual HMAC secret is the app's API secret.
  // Here we store our generated secret; in production, you'd configure
  // the Shopify app secret as the webhook HMAC secret.
  void webhookSecret // Used by the caller to save to store

  if (webhookIds.length === 0) {
    return {
      success: false,
      webhookIds: [],
      topics: [],
      error: 'Failed to register any webhooks',
      details: errors,
    }
  }

  return {
    success: true,
    webhookIds,
    topics: registeredTopics,
    error: errors.length > 0 ? `Partial success: ${errors.join('; ')}` : undefined,
  }
}

// ============================================================
// NUVEMSHOP WEBHOOK REGISTRATION
// ============================================================

const NUVEMSHOP_WEBHOOK_EVENTS = [
  'cart/abandoned',
  'order/paid',
]

async function registerNuvemshopWebhooks(
  nuvemshopStoreId: string,
  accessToken: string
): Promise<WebhookRegistrationResult> {
  const webhookUrl = getWebhookUrl('NUVEMSHOP')
  const webhookIds: string[] = []
  const registeredTopics: string[] = []
  const errors: string[] = []

  for (const event of NUVEMSHOP_WEBHOOK_EVENTS) {
    try {
      const response = await fetch(
        `https://api.tiendanube.com/v1/${nuvemshopStoreId}/webhooks`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authentication': `bearer ${accessToken}`,
            'User-Agent': 'RecuperaAI (contato@recuperaai.com)',
          },
          body: JSON.stringify({
            event,
            url: webhookUrl,
          }),
        }
      )

      if (!response.ok) {
        const errorBody = await response.text()
        errors.push(`Event ${event}: HTTP ${response.status} - ${errorBody}`)
        continue
      }

      const data = (await response.json()) as { id?: number }
      const webhookId = data.id?.toString()

      if (webhookId) {
        webhookIds.push(webhookId)
        registeredTopics.push(event)
      }
    } catch (error) {
      errors.push(
        `Event ${event}: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  if (webhookIds.length === 0) {
    return {
      success: false,
      webhookIds: [],
      topics: [],
      error: 'Failed to register any webhooks',
      details: errors,
    }
  }

  return {
    success: true,
    webhookIds,
    topics: registeredTopics,
    error: errors.length > 0 ? `Partial success: ${errors.join('; ')}` : undefined,
  }
}
