import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth-utils'
import { evolutionApi } from '@/lib/evolution-api'

/**
 * GET /api/whatsapp/status?storeId=xxx
 * Checks WhatsApp connection status via Evolution API and syncs to DB.
 */
export async function GET(request: NextRequest) {
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

    // 3. Parse query
    const storeId = request.nextUrl.searchParams.get('storeId')

    if (!storeId) {
      return NextResponse.json(
        { error: 'validation_error', message: 'storeId query param is required' },
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

    // 5. Query Evolution API for connection state
    const instanceName = `recupera-${storeId}`

    let state: 'open' | 'close' | 'connecting' = 'close'
    try {
      const connectionState = await evolutionApi.getInstanceStatus(instanceName)
      state = connectionState.state ?? 'close'
    } catch {
      // Instance may not exist yet - that means disconnected
      state = 'close'
    }

    const isConnected = state === 'open'

    // 6. Sync status to DB if changed
    if (store.whatsappConnected !== isConnected) {
      await prisma.store.update({
        where: { id: storeId },
        data: { whatsappConnected: isConnected },
      })
    }

    return NextResponse.json({
      data: {
        storeId,
        instanceName,
        state,
        connected: isConnected,
      },
    })
  } catch (error) {
    console.error('[WhatsApp Status] Error:', error)
    return NextResponse.json(
      {
        error: 'internal_error',
        message: `Failed to check WhatsApp status: ${error instanceof Error ? error.message : 'Unknown'}`,
      },
      { status: 500 }
    )
  }
}
