/**
 * Auth utilities - helper to get current user from session
 * Used by API routes to scope data to the authenticated user
 */

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function getCurrentUser() {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true },
  })

  return user
}

/**
 * Get the authenticated user from session.
 * Returns null if not authenticated.
 */
export async function getAuthenticatedUser() {
  return getCurrentUser()
}
