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
 * Temporary fallback: get the first user in the database.
 * Used when auth is not yet fully integrated on the frontend.
 */
export async function getFirstUser() {
  const user = await prisma.user.findFirst({
    select: { id: true, email: true, name: true },
  })
  return user
}

/**
 * Get the authenticated user, falling back to the first user in DB.
 * This allows the API to work before the frontend is fully wired to NextAuth.
 */
export async function getAuthenticatedUser() {
  const sessionUser = await getCurrentUser()
  if (sessionUser) return sessionUser
  return getFirstUser()
}
