import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth-utils'
import { evolutionApi } from '@/lib/evolution-api'

/**
 * POST /api/whatsapp/connect
 * Creates an Evolution API instance for the store and returns the QR code.
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

    // 5. Create instance on Evolution API
    const instanceName = `recupera-${storeId}`

    let result: Awaited<ReturnType<typeof evolutionApi.createInstance>>
    try {
      result = await evolutionApi.createInstance(instanceName)
    } catch (error) {
      // If instance already exists, try to get QR code
      const errorMessage = error instanceof Error ? error.message : ''
      if (errorMessage.includes('already') || errorMessage.includes('exists')) {
        try {
          const qrcode = await evolutionApi.getQRCode(instanceName)
          return NextResponse.json({
            data: {
              instanceName,
              qrcode: qrcode.base64 ?? qrcode.code ?? null,
              pairingCode: qrcode.pairingCode ?? null,
            },
          })
        } catch {
          // Instance exists but may already be connected
          const status = await evolutionApi.getInstanceStatus(instanceName)
          if (status.state === 'open') {
            // Already connected, update DB
            await prisma.store.update({
              where: { id: storeId },
              data: { whatsappConnected: true },
            })
            return NextResponse.json({
              data: {
                instanceName,
                connected: true,
                state: 'open',
              },
            })
          }
          throw error
        }
      }
      throw error
    }

    // 6. Extract QR code from response
    const qrBase64 = result.qrcode?.base64 ?? null
    const pairingCode = result.qrcode?.pairingCode ?? null

    return NextResponse.json({
      data: {
        instanceName,
        qrcode: qrBase64,
        pairingCode,
      },
    })
  } catch (error) {
    console.error('[WhatsApp Connect] Error:', error)
    return NextResponse.json(
      {
        error: 'internal_error',
        message: `Failed to connect WhatsApp: ${error instanceof Error ? error.message : 'Unknown'}`,
      },
      { status: 500 }
    )
  }
}
