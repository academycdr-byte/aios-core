import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const membro = await prisma.membroEquipe.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            clientesGerenciados: {
              select: { id: true, nome: true, status: true },
            },
          },
        },
      },
    })

    if (!membro) {
      return NextResponse.json({ error: "Membro não encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      id: membro.id,
      userId: membro.userId,
      cargo: membro.cargo,
      name: membro.user.name,
      email: membro.user.email,
      role: membro.user.role,
      createdAt: membro.createdAt,
      clientesGerenciados: membro.user.clientesGerenciados,
      totalClientes: membro.user.clientesGerenciados.length,
    })
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch member: ${error instanceof Error ? error.message : "Unknown"}` },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const membro = await prisma.membroEquipe.update({
      where: { id },
      data: { cargo: body.cargo },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    })

    return NextResponse.json(membro)
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to update member: ${error instanceof Error ? error.message : "Unknown"}` },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const membro = await prisma.membroEquipe.findUnique({ where: { id } })
    if (!membro) {
      return NextResponse.json({ error: "Membro não encontrado" }, { status: 404 })
    }

    // Delete both the team member and associated user
    await prisma.$transaction([
      prisma.membroEquipe.delete({ where: { id } }),
      prisma.user.delete({ where: { id: membro.userId } }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to delete member: ${error instanceof Error ? error.message : "Unknown"}` },
      { status: 500 }
    )
  }
}
