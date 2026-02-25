import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth-utils'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/stores/[id]/recovery-config
 * Get recovery configuration for a store
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

    // Verify store ownership
    const store = await prisma.store.findFirst({
      where: { id, userId: user.id },
    })

    if (!store) {
      return NextResponse.json(
        { error: 'not_found', message: 'Store not found' },
        { status: 404 }
      )
    }

    const config = await prisma.recoveryConfig.findUnique({
      where: { storeId: id },
    })

    return NextResponse.json({ data: config })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'internal_error',
        message: `Failed to fetch recovery config: ${error instanceof Error ? error.message : 'Unknown'}`,
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/stores/[id]/recovery-config
 * Update recovery configuration (upsert)
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

    // Verify store ownership
    const store = await prisma.store.findFirst({
      where: { id, userId: user.id },
    })

    if (!store) {
      return NextResponse.json(
        { error: 'not_found', message: 'Store not found' },
        { status: 404 }
      )
    }

    const body = await request.json()

    // Remove fields that should not be overwritten by client
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, storeId: _storeId, createdAt: _createdAt, updatedAt: _updatedAt, ...updateData } = body

    const config = await prisma.recoveryConfig.upsert({
      where: { storeId: id },
      update: updateData,
      create: {
        storeId: id,
        isActive: updateData.isActive ?? true,
        firstMessageDelay: updateData.firstMessageDelay ?? 30,
        followUp1Delay: updateData.followUp1Delay ?? 360,
        followUp2Delay: updateData.followUp2Delay ?? 1440,
        followUp3Delay: updateData.followUp3Delay ?? null,
        maxAttempts: updateData.maxAttempts ?? 3,
        firstMessageTemplate: updateData.firstMessageTemplate ?? null,
        followUp1Template: updateData.followUp1Template ?? null,
        followUp2Template: updateData.followUp2Template ?? null,
        followUp3Template: updateData.followUp3Template ?? null,
        minCartValue: updateData.minCartValue ?? 0,
        excludeReturning: updateData.excludeReturning ?? false,
        pixRecoveryEnabled: updateData.pixRecoveryEnabled ?? true,
        pixFirstDelay: updateData.pixFirstDelay ?? 15,
        pixFollowUpDelay: updateData.pixFollowUpDelay ?? 120,
        pixMaxAttempts: updateData.pixMaxAttempts ?? 2,
        cardRecoveryEnabled: updateData.cardRecoveryEnabled ?? true,
        cardFirstDelay: updateData.cardFirstDelay ?? 10,
        cardMaxAttempts: updateData.cardMaxAttempts ?? 2,
      },
    })

    return NextResponse.json({ data: config })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'internal_error',
        message: `Failed to update recovery config: ${error instanceof Error ? error.message : 'Unknown'}`,
      },
      { status: 500 }
    )
  }
}
