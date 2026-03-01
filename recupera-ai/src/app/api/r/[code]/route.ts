/**
 * GET /api/r/[code]
 * Tracked link redirect: registers click and redirects to target URL.
 * Used to track checkout link clicks from WhatsApp messages.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteContext {
  params: Promise<{ code: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { code } = await context.params

    const link = await prisma.trackedLink.findUnique({
      where: { code },
    })

    if (!link) {
      return NextResponse.json(
        { error: 'not_found', message: 'Link not found' },
        { status: 404 }
      )
    }

    // Increment click count (fire-and-forget)
    prisma.trackedLink.update({
      where: { id: link.id },
      data: {
        clicks: { increment: 1 },
        lastClickAt: new Date(),
      },
    }).catch((err) => {
      console.error('[LinkTracking] Failed to update click count:', err)
    })

    // Redirect to target URL
    return NextResponse.redirect(link.targetUrl, 302)
  } catch (error) {
    console.error('[LinkTracking] Error:', error)
    return NextResponse.json(
      { error: 'internal_error', message: 'Failed to process redirect' },
      { status: 500 }
    )
  }
}
