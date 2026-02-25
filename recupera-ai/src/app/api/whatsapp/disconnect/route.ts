import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth-utils'
import { evolutionApi } from '@/lib/evolution-api'

/**
 * POST /api/whatsapp/disconnect
 * Disconnects WhatsApp and deletes the Evolution API instance.
 * Body: { storeId: string }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Check if Evolution API is configured
    if (!evolutionApi.isConfigured()) {
      return NextResponse.json(
        {
          error: 'not_configured',
          message:
            'Evolution API nao configurada. Configure EVOLUTION_API_URL e EVOLUTION_API_KEY nas variaveis de ambiente.',
        },
        { status: 503 }
      )
    }

    // 2. Auth
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    // 3. Parse body
    const body = await request.json()
    const { storeId } = body as { storeId?: string }

    if (!storeId) {
      return NextResponse.json(
        { error: 'validation_error', message: 'storeId is required' },
        { status: 400 }
      )
    }

    // 4. Verify store ownership
    const store = await prisma.store.findFirst({
      where: { id: storeId, userId: user.id },
    })

    if (!store) {
      return NextResponse.json(
        { error: 'not_found', message: 'Store not found' },
        { status: 404 }
      )
    }

    // 5. Logout and delete instance on Evolution API
    const instanceName = `recupera-${storeId}`

    try {
      await evolutionApi.logout(instanceName)
    } catch {
      // Ignore logout errors (instance may already be disconnected)
    }

    try {
      await evolutionApi.deleteInstance(instanceName)
    } catch {
      // Ignore delete errors (instance may not exist)
    }

    // 6. Update store in DB
    await prisma.store.update({
      where: { id: storeId },
      data: {
        whatsappConnected: false,
        whatsappPhone: null,
      },
    })

    return NextResponse.json({
      data: {
        storeId,
        disconnected: true,
      },
    })
  } catch (error) {
    console.error('[WhatsApp Disconnect] Error:', error)
    return NextResponse.json(
      {
        error: 'internal_error',
        message: `Failed to disconnect WhatsApp: ${error instanceof Error ? error.message : 'Unknown'}`,
      },
      { status: 500 }
    )
  }
}
