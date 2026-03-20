import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth-utils'
import { encrypt } from '@/lib/encryption'
import { normalizeShopDomain } from '@/lib/integrations/shopify'

/**
 * GET /api/stores
 * Get the authenticated user's store (single-store model)
 */
export async function GET() {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    const store = await prisma.store.findFirst({
      where: { userId: user.id },
    })

    return NextResponse.json({ data: store })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'internal_error',
        message: `Failed to fetch store: ${error instanceof Error ? error.message : 'Unknown'}`,
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/stores
 * Create a new store (Shopify OAuth or Nuvemshop direct)
 *
 * Shopify body: { name, platform: "SHOPIFY", domain, clientId, clientSecret }
 * Nuvemshop body: { name, platform: "NUVEMSHOP", nuvemshopStoreId, accessToken }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Single-store model: check if user already has a store
    const existingStore = await prisma.store.findFirst({
      where: { userId: user.id },
      select: { id: true },
    })
    if (existingStore) {
      return NextResponse.json(
        { error: 'store_limit', message: 'Você já possui uma loja cadastrada' },
        { status: 409 }
      )
    }

    const body = await request.json()

    const { name, platform, domain, accessToken, clientId, clientSecret, nuvemshopStoreId } = body as {
      name?: string
      platform?: string
      domain?: string
      accessToken?: string
      clientId?: string
      clientSecret?: string
      nuvemshopStoreId?: string
    }

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'validation_error', message: 'Store name is required' },
        { status: 400 }
      )
    }

    if (!platform || !['SHOPIFY', 'NUVEMSHOP'].includes(platform)) {
      return NextResponse.json(
        { error: 'validation_error', message: 'Platform must be SHOPIFY or NUVEMSHOP' },
        { status: 400 }
      )
    }

    // Shopify: requires domain + clientId + clientSecret for OAuth flow
    if (platform === 'SHOPIFY') {
      if (!domain || !clientId || !clientSecret) {
        return NextResponse.json(
          { error: 'validation_error', message: 'domain, clientId and clientSecret are required for Shopify' },
          { status: 400 }
        )
      }

      const shopDomain = normalizeShopDomain(domain)

      const newStore = await prisma.store.create({
        data: {
          userId: user.id,
          name: name.trim(),
          platform: 'SHOPIFY',
          domain: shopDomain.replace('.myshopify.com', '.com.br'),
          shopifyDomain: shopDomain,
          shopifyClientId: encrypt(clientId.trim()),
          shopifyClientSecret: encrypt(clientSecret.trim()),
          connectionStatus: 'PENDING',
        },
      })

      return NextResponse.json({ data: newStore }, { status: 201 })
    }

    // Nuvemshop: direct token
    const newStore = await prisma.store.create({
      data: {
        userId: user.id,
        name: name.trim(),
        platform: 'NUVEMSHOP',
        domain: domain ?? null,
        accessToken: accessToken ?? null,
        nuvemshopStoreId: nuvemshopStoreId ?? null,
        connectionStatus: 'CONNECTED',
      },
    })

    return NextResponse.json({ data: newStore }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'internal_error',
        message: `Failed to create store: ${error instanceof Error ? error.message : 'Unknown'}`,
      },
      { status: 500 }
    )
  }
}
