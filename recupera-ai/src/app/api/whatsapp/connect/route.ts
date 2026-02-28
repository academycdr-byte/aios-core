import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth-utils'
import { evolutionApi } from '@/lib/evolution-api'

/**
 * POST /api/whatsapp/connect
 * Creates an Evolution API instance for the store and returns QR code + pairing code.
 * Body: { storeId: string, phone?: string }
 *
 * When `phone` is provided (e.g. "5511999999999"), the API returns a pairing code
 * that the user types in WhatsApp instead of scanning a QR code.
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
    const { storeId, phone } = body as { storeId?: string; phone?: string }

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

    // 5. Normalize phone: remove non-digits, ensure country code
    let normalizedPhone: string | undefined
    if (phone) {
      normalizedPhone = phone.replace(/\D/g, '')
      // Add Brazil country code if missing
      if (normalizedPhone.length === 10 || normalizedPhone.length === 11) {
        normalizedPhone = `55${normalizedPhone}`
      }
    }

    // 6. Instance name for this store
    const instanceName = `recupera-${storeId}`

    // 7. Strategy: reuse existing instance, only create if it doesn't exist.
    //    Evolution API v2.3.7 + PostgreSQL has FK constraints that break on delete+recreate.

    // Try to reconnect existing instance first (generates fresh QR code)
    try {
      const qrcode = await evolutionApi.getQRCode(instanceName)
      if (qrcode.base64 || qrcode.code || qrcode.pairingCode) {
        if (normalizedPhone && !store.whatsappPhone) {
          await prisma.store.update({
            where: { id: storeId },
            data: { whatsappPhone: normalizedPhone },
          })
        }
        return NextResponse.json({
          data: {
            instanceName,
            qrcode: qrcode.base64 ?? null,
            pairingCode: qrcode.pairingCode ?? null,
          },
        })
      }
    } catch {
      // Instance might not exist or might already be connected — check status
      try {
        const status = await evolutionApi.getInstanceStatus(instanceName)
        if (status.instance?.state === 'open') {
          await prisma.store.update({
            where: { id: storeId },
            data: { whatsappConnected: true },
          })
          return NextResponse.json({
            data: { instanceName, connected: true, state: 'open' },
          })
        }
        // Instance exists but is in 'close' state — restart it to get a new QR
        try {
          const qrcode = await evolutionApi.getQRCode(instanceName)
          if (qrcode.base64 || qrcode.code) {
            return NextResponse.json({
              data: {
                instanceName,
                qrcode: qrcode.base64 ?? null,
                pairingCode: qrcode.pairingCode ?? null,
              },
            })
          }
        } catch {
          // Could not get QR from existing instance — will create new below
        }
      } catch {
        // Instance truly doesn't exist — will create new below
      }
    }

    // 8. Create new instance (only reached if instance doesn't exist)
    const result = await evolutionApi.createInstance(instanceName, normalizedPhone)

    // 9. Save phone to store if provided
    if (normalizedPhone && !store.whatsappPhone) {
      await prisma.store.update({
        where: { id: storeId },
        data: { whatsappPhone: normalizedPhone },
      })
    }

    // 10. Extract QR code and pairing code from response
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
