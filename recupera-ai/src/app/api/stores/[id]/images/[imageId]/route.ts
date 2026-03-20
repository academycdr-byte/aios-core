import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth-utils'

interface RouteContext {
  params: Promise<{ id: string; imageId: string }>
}

/**
 * PUT /api/stores/[id]/images/[imageId]
 * Update a store image
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

    const { id, imageId } = await context.params

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
    const { name, description, triggerContext, category, imageUrl, isActive } = body

    const image = await prisma.storeImage.update({
      where: { id: imageId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(triggerContext !== undefined && { triggerContext }),
        ...(category !== undefined && { category }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json({ data: image })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'internal_error',
        message: `Failed to update image: ${error instanceof Error ? error.message : 'Unknown'}`,
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/stores/[id]/images/[imageId]
 * Delete a store image
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id, imageId } = await context.params

    const store = await prisma.store.findFirst({
      where: { id, userId: user.id },
    })
    if (!store) {
      return NextResponse.json(
        { error: 'not_found', message: 'Store not found' },
        { status: 404 }
      )
    }

    await prisma.storeImage.delete({ where: { id: imageId } })

    return NextResponse.json({ data: { deleted: true } })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'internal_error',
        message: `Failed to delete image: ${error instanceof Error ? error.message : 'Unknown'}`,
      },
      { status: 500 }
    )
  }
}
