import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { compare, hash } from 'bcryptjs'
import { getAuthenticatedUser } from '@/lib/auth-utils'

/**
 * POST /api/auth/change-password
 * Change the authenticated user's password
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Autenticação necessária' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'validation', message: 'Senha atual e nova senha são obrigatórias' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'validation', message: 'A nova senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Fetch user with password
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    })

    if (!dbUser) {
      return NextResponse.json(
        { error: 'not_found', message: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Verify current password
    const isValid = await compare(currentPassword, dbUser.password)
    if (!isValid) {
      return NextResponse.json(
        { error: 'invalid_password', message: 'Senha atual incorreta' },
        { status: 400 }
      )
    }

    // Hash and update new password
    const hashedPassword = await hash(newPassword, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    return NextResponse.json({ data: { success: true, message: 'Senha alterada com sucesso' } })
  } catch (error) {
    return NextResponse.json(
      { error: 'internal_error', message: `Erro ao alterar senha: ${error instanceof Error ? error.message : 'Desconhecido'}` },
      { status: 500 }
    )
  }
}
