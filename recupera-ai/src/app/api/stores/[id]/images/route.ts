import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth-utils'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/stores/[id]/images
 * List all images for a store
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
    })
    if (!store) {
      return NextResponse.json(
        { error: 'not_found', message: 'Store not found' },
        { status: 404 }
      )
    }

    const images = await prisma.storeImage.findMany({
      where: { storeId: id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: images })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'internal_error',
        message: `Failed to fetch images: ${error instanceof Error ? error.message : 'Unknown'}`,
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/stores/[id]/images
 * Create a new store image
 */
export async function POST(request: NextRequest, context: RouteContext) {
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
    })
    if (!store) {
      return NextResponse.json(
        { error: 'not_found', message: 'Store not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { name, description, triggerContext, category, imageUrl } = body

    if (!name || !imageUrl || !triggerContext) {
      return NextResponse.json(
        { error: 'validation', message: 'name, imageUrl, and triggerContext are required' },
        { status: 400 }
      )
    }

    const image = await prisma.storeImage.create({
      data: {
        storeId: id,
        name,
        description: description ?? '',
        triggerContext,
        category: category ?? 'general',
        imageUrl,
      },
    })

    return NextResponse.json({ data: image }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'internal_error',
        message: `Failed to create image: ${error instanceof Error ? error.message : 'Unknown'}`,
      },
      { status: 500 }
    )
  }
}
