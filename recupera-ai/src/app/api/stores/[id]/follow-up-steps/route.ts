import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth-utils'

interface RouteContext {
  params: Promise<{ id: string }>
}

// Default follow-up steps for abandoned cart
const DEFAULT_ABANDONED_STEPS = [
  { stepNumber: 0, delayMinutes: 30, strategy: 'Primeira abordagem: ser amigavel, gerar curiosidade, perguntar se pode ajudar com a compra.' },
  { stepNumber: 1, delayMinutes: 360, strategy: 'Follow-up 1: reforcar beneficios do produto, criar senso de urgencia leve.' },
  { stepNumber: 2, delayMinutes: 1440, strategy: 'Follow-up 2: abordar possiveis objecoes, oferecer ajuda personalizada.' },
  { stepNumber: 3, delayMinutes: 2880, strategy: 'Follow-up 3: ultima tentativa, tom de despedida amigavel, deixar porta aberta.' },
]

const DEFAULT_PIX_STEPS = [
  { stepNumber: 0, delayMinutes: 15, strategy: 'Lembrete gentil de que o PIX esta aguardando pagamento.' },
  { stepNumber: 1, delayMinutes: 120, strategy: 'Follow-up: reforcar que o PIX expira em breve, oferecer ajuda.' },
]

const DEFAULT_CARD_STEPS = [
  { stepNumber: 0, delayMinutes: 10, strategy: 'Informar sobre a recusa do cartao de forma delicada, sugerir alternativas.' },
  { stepNumber: 1, delayMinutes: 60, strategy: 'Follow-up: verificar se conseguiu resolver, oferecer outras formas de pagamento.' },
]

/**
 * GET /api/stores/[id]/follow-up-steps
 * Returns follow-up steps for a store, auto-creating defaults if none exist.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
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
      include: { recoveryConfig: true },
    })

    if (!store) {
      return NextResponse.json(
        { error: 'not_found', message: 'Store not found' },
        { status: 404 }
      )
    }

    if (!store.recoveryConfig) {
      return NextResponse.json({ data: [] })
    }

    let steps = await prisma.followUpStep.findMany({
      where: { configId: store.recoveryConfig.id },
      orderBy: [{ cartType: 'asc' }, { stepNumber: 'asc' }],
    })

    // Auto-create default steps if none exist
    if (steps.length === 0) {
      const configId = store.recoveryConfig.id
      const allDefaults = [
        ...DEFAULT_ABANDONED_STEPS.map((s) => ({
          ...s,
          configId,
          cartType: 'ABANDONED_CART' as const,
          isActive: true,
        })),
        ...DEFAULT_PIX_STEPS.map((s) => ({
          ...s,
          configId,
          cartType: 'PIX_PENDING' as const,
          isActive: true,
        })),
        ...DEFAULT_CARD_STEPS.map((s) => ({
          ...s,
          configId,
          cartType: 'CARD_DECLINED' as const,
          isActive: true,
        })),
      ]

      await prisma.followUpStep.createMany({ data: allDefaults })

      steps = await prisma.followUpStep.findMany({
        where: { configId },
        orderBy: [{ cartType: 'asc' }, { stepNumber: 'asc' }],
      })
    }

    return NextResponse.json({ data: steps })
  } catch (error) {
    console.error('[FollowUpSteps] GET error:', error)
    return NextResponse.json(
      { error: 'internal_error', message: 'Failed to fetch follow-up steps' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/stores/[id]/follow-up-steps
 * Bulk replace follow-up steps for a cart type.
 * Body: { cartType: string, steps: Array<{ stepNumber, delayMinutes, strategy, isActive }> }
 */
export async function PUT(request: NextRequest, context: RouteContext) {
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
      include: { recoveryConfig: true },
    })

    if (!store) {
      return NextResponse.json(
        { error: 'not_found', message: 'Store not found' },
        { status: 404 }
      )
    }

    if (!store.recoveryConfig) {
      return NextResponse.json(
        { error: 'configuration_error', message: 'Recovery config not found' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { cartType, steps } = body as {
      cartType: string
      steps: Array<{
        stepNumber: number
        delayMinutes: number
        strategy: string
        isActive: boolean
      }>
    }

    if (!cartType || !Array.isArray(steps)) {
      return NextResponse.json(
        { error: 'bad_request', message: 'cartType and steps array required' },
        { status: 400 }
      )
    }

    if (steps.length > 8) {
      return NextResponse.json(
        { error: 'bad_request', message: 'Maximum 8 steps allowed (1 first + 7 follow-ups)' },
        { status: 400 }
      )
    }

    const configId = store.recoveryConfig.id

    // Transaction: delete existing steps for this cart type, create new ones
    await prisma.$transaction([
      prisma.followUpStep.deleteMany({
        where: { configId, cartType: cartType as 'ABANDONED_CART' | 'PIX_PENDING' | 'CARD_DECLINED' },
      }),
      prisma.followUpStep.createMany({
        data: steps.map((s, i) => ({
          configId,
          cartType: cartType as 'ABANDONED_CART' | 'PIX_PENDING' | 'CARD_DECLINED',
          stepNumber: i,
          delayMinutes: s.delayMinutes,
          strategy: s.strategy,
          isActive: s.isActive,
        })),
      }),
    ])

    const updated = await prisma.followUpStep.findMany({
      where: { configId, cartType: cartType as 'ABANDONED_CART' | 'PIX_PENDING' | 'CARD_DECLINED' },
      orderBy: { stepNumber: 'asc' },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('[FollowUpSteps] PUT error:', error)
    return NextResponse.json(
      { error: 'internal_error', message: 'Failed to update follow-up steps' },
      { status: 500 }
    )
  }
}
