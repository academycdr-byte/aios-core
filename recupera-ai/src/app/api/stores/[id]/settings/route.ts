import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth-utils'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/stores/[id]/settings
 * Get store settings
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

    const settings = await prisma.storeSettings.findUnique({
      where: { storeId: id },
    })

    return NextResponse.json({ data: settings })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'internal_error',
        message: `Failed to fetch settings: ${error instanceof Error ? error.message : 'Unknown'}`,
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/stores/[id]/settings
 * Update store settings (upsert - creates if not exists)
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

    const settings = await prisma.storeSettings.upsert({
      where: { storeId: id },
      update: updateData,
      create: {
        storeId: id,
        storeName: updateData.storeName ?? null,
        storeDescription: updateData.storeDescription ?? null,
        mainProducts: updateData.mainProducts ?? null,
        targetAudience: updateData.targetAudience ?? null,
        shippingPolicy: updateData.shippingPolicy ?? null,
        returnPolicy: updateData.returnPolicy ?? null,
        paymentMethods: updateData.paymentMethods ?? null,
        warrantyPolicy: updateData.warrantyPolicy ?? null,
        faqContent: updateData.faqContent ?? null,
        currentOffers: updateData.currentOffers ?? null,
        canOfferDiscount: updateData.canOfferDiscount ?? false,
        maxDiscountPercent: updateData.maxDiscountPercent ?? null,
        couponCode: updateData.couponCode ?? null,
        couponDiscount: updateData.couponDiscount ?? null,
        aiTone: updateData.aiTone ?? 'profissional',
        aiName: updateData.aiName ?? 'Assistente',
        customInstructions: updateData.customInstructions ?? null,
        businessHoursStart: updateData.businessHoursStart ?? null,
        businessHoursEnd: updateData.businessHoursEnd ?? null,
        sendOutsideHours: updateData.sendOutsideHours ?? false,
        timezone: updateData.timezone ?? 'America/Sao_Paulo',
      },
    })

    return NextResponse.json({ data: settings })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'internal_error',
        message: `Failed to update settings: ${error instanceof Error ? error.message : 'Unknown'}`,
      },
      { status: 500 }
    )
  }
}
