import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth-utils'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/stores/[id]
 * Get store details by ID
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
      include: {
        settings: true,
        recoveryConfig: true,
        _count: {
          select: {
            abandonedCarts: true,
            conversations: true,
          },
        },
      },
    })

    if (!store) {
      return NextResponse.json(
        { error: 'not_found', message: 'Store not found' },
        { status: 404 }
      )
    }

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
 * PUT /api/stores/[id]
 * Update a store
 */
export async function PUT(
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

    // Verify ownership
    const existing = await prisma.store.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'not_found', message: 'Store not found' },
        { status: 404 }
      )
    }

    const body = await request.json()

    // Only allow updating specific fields
    const updatedStore = await prisma.store.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        domain: body.domain !== undefined ? body.domain : existing.domain,
        accessToken: body.accessToken !== undefined ? body.accessToken : existing.accessToken,
        shopifyDomain: body.shopifyDomain !== undefined ? body.shopifyDomain : existing.shopifyDomain,
        nuvemshopStoreId: body.nuvemshopStoreId !== undefined ? body.nuvemshopStoreId : existing.nuvemshopStoreId,
        whatsappPhone: body.whatsappPhone !== undefined ? body.whatsappPhone : existing.whatsappPhone,
        whatsappConnected: body.whatsappConnected !== undefined ? body.whatsappConnected : existing.whatsappConnected,
        isActive: body.isActive !== undefined ? body.isActive : existing.isActive,
        testMode: body.testMode !== undefined ? body.testMode : existing.testMode,
        testPhones: body.testPhones !== undefined ? body.testPhones : existing.testPhones,
      },
    })

    return NextResponse.json({ data: updatedStore })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'internal_error',
        message: `Failed to update store: ${error instanceof Error ? error.message : 'Unknown'}`,
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/stores/[id]
 * Delete a store (cascades to settings, config, carts, conversations)
 */
export async function DELETE(
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

    // Verify ownership
    const existing = await prisma.store.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'not_found', message: 'Store not found' },
        { status: 404 }
      )
    }

    await prisma.store.delete({ where: { id } })

    return NextResponse.json({ message: 'Store deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'internal_error',
        message: `Failed to delete store: ${error instanceof Error ? error.message : 'Unknown'}`,
      },
      { status: 500 }
    )
  }
}
