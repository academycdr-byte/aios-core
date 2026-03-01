/**
 * GET/PUT /api/stores/[id]/stages
 * Manage recovery stages for a store.
 * GET: Returns all stages ordered by `order`.
 * PUT: Replaces all stages (bulk update).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth-utils'

interface RouteContext {
  params: Promise<{ id: string }>
}

/** Default stages created for new stores */
const DEFAULT_STAGES = [
  {
    name: 'Gerar Resposta',
    order: 1,
    objective: 'Conseguir que o cliente responda a primeira mensagem',
    aiInstructions:
      'Seja natural e amigavel. Gere curiosidade sobre os produtos abandonados. Faca uma pergunta aberta para incentivar resposta. NAO ofereca desconto nesta etapa.',
    discountEnabled: false,
    discountPercent: null,
    firstMessageTone: 'amigavel',
    firstMessageElements: 'nome do cliente, produto principal, pergunta aberta',
    isDefault: true,
  },
  {
    name: 'Identificar Objecao',
    order: 2,
    objective: 'Descobrir qual e a objecao ou duvida do cliente',
    aiInstructions:
      'O cliente respondeu. Agora identifique a objecao (preco, frete, duvida, timing). Faca perguntas direcionadas para entender o motivo da hesitacao. NAO ofereca desconto ainda.',
    discountEnabled: false,
    discountPercent: null,
    firstMessageTone: null,
    firstMessageElements: null,
    isDefault: true,
  },
  {
    name: 'Estrategia de Conversao',
    order: 3,
    objective: 'Aplicar estrategia para superar a objecao identificada',
    aiInstructions:
      'Voce ja sabe a objecao do cliente. Aplique a estrategia adequada: se preco, destaque custo-beneficio e diferenciais; se frete, explique opcoes; se duvida, esclareca com detalhes. Envie o link de checkout se o cliente demonstrar interesse.',
    discountEnabled: false,
    discountPercent: null,
    firstMessageTone: null,
    firstMessageElements: null,
    isDefault: true,
  },
  {
    name: 'Ofertar Desconto',
    order: 4,
    objective: 'Ofertar desconto como ultimo recurso para fechar a venda',
    aiInstructions:
      'O cliente ainda nao comprou apos a estrategia de conversao. Agora voce pode ofertar o desconto configurado. Apresente como beneficio exclusivo e temporario. Envie o link de checkout com o cupom.',
    discountEnabled: true,
    discountPercent: 10,
    firstMessageTone: null,
    firstMessageElements: null,
    isDefault: true,
  },
]

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
      select: { id: true },
    })

    if (!store) {
      return NextResponse.json(
        { error: 'not_found', message: 'Store not found' },
        { status: 404 }
      )
    }

    let stages = await prisma.recoveryStage.findMany({
      where: { storeId: id },
      orderBy: { order: 'asc' },
    })

    // Auto-create default stages if none exist
    if (stages.length === 0) {
      await prisma.recoveryStage.createMany({
        data: DEFAULT_STAGES.map((s) => ({ ...s, storeId: id })),
      })
      stages = await prisma.recoveryStage.findMany({
        where: { storeId: id },
        orderBy: { order: 'asc' },
      })
    }

    return NextResponse.json({ data: stages })
  } catch (error) {
    console.error('[Stages API] GET error:', error)
    return NextResponse.json(
      { error: 'internal_error', message: 'Failed to fetch stages' },
      { status: 500 }
    )
  }
}

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

    const store = await prisma.store.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    })

    if (!store) {
      return NextResponse.json(
        { error: 'not_found', message: 'Store not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { stages } = body as {
      stages: Array<{
        name: string
        order: number
        objective: string
        aiInstructions: string
        discountEnabled: boolean
        discountPercent: number | null
        firstMessageTone: string | null
        firstMessageElements: string | null
      }>
    }

    if (!stages || !Array.isArray(stages) || stages.length === 0) {
      return NextResponse.json(
        { error: 'validation_error', message: 'At least one stage is required' },
        { status: 400 }
      )
    }

    // Replace all stages in a transaction
    const result = await prisma.$transaction(async (tx) => {
      await tx.recoveryStage.deleteMany({ where: { storeId: id } })

      await tx.recoveryStage.createMany({
        data: stages.map((s, idx) => ({
          storeId: id,
          name: s.name,
          order: s.order ?? idx + 1,
          objective: s.objective,
          aiInstructions: s.aiInstructions,
          discountEnabled: s.discountEnabled ?? false,
          discountPercent: s.discountPercent ?? null,
          firstMessageTone: s.firstMessageTone ?? null,
          firstMessageElements: s.firstMessageElements ?? null,
          isDefault: false,
        })),
      })

      return tx.recoveryStage.findMany({
        where: { storeId: id },
        orderBy: { order: 'asc' },
      })
    })

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('[Stages API] PUT error:', error)
    return NextResponse.json(
      { error: 'internal_error', message: 'Failed to update stages' },
      { status: 500 }
    )
  }
}
