import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth-utils'
import { decrypt } from '@/lib/encryption'
import { getShopifyAuthUrl } from '@/lib/integrations/shopify'

/**
 * GET /api/integrations/shopify?storeId=xxx
 * Initiates the Shopify OAuth flow by redirecting to Shopify's authorization page.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const storeId = request.nextUrl.searchParams.get('storeId')
    if (!storeId) {
      return NextResponse.json(
        { error: 'validation_error', message: 'storeId is required' },
        { status: 400 }
      )
    }

    // Find the PENDING store
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        userId: user.id,
        platform: 'SHOPIFY',
      },
    })

    if (!store || !store.shopifyDomain || !store.shopifyClientId) {
      return NextResponse.json(
        { error: 'not_found', message: 'Store not found or missing credentials' },
        { status: 404 }
      )
    }

    // Decrypt client ID
    const clientId = decrypt(store.shopifyClientId)

    // Generate CSRF state
    const state = crypto.randomBytes(16).toString('hex')

    // Determine callback URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const redirectUri = `${appUrl}/api/integrations/shopify/callback`

    // Save state in cookies for CSRF validation
    const cookieStore = await cookies()
    cookieStore.set('shopify_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    })
    cookieStore.set('shopify_oauth_store_id', storeId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
      path: '/',
    })

    // Build OAuth URL and redirect
    const authUrl = getShopifyAuthUrl(
      store.shopifyDomain,
      redirectUri,
      state,
      clientId,
    )

    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('[Shopify OAuth] Error initiating flow:', error)
    return NextResponse.redirect(
      new URL('/lojas?error=oauth_init_failed', request.url)
    )
  }
}
