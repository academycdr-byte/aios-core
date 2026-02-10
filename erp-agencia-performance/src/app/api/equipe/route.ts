import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { membroEquipeSchema } from "@/lib/validations"

export async function GET() {
  try {
    const membros = await prisma.membroEquipe.findMany({
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
      orderBy: { createdAt: "desc" },
    })

    const result = membros.map((m) => ({
      id: m.id,
      userId: m.userId,
      cargo: m.cargo,
      name: m.user.name,
      email: m.user.email,
      role: m.user.role,
      createdAt: m.createdAt,
      clientesGerenciados: m.user.clientesGerenciados,
      totalClientes: m.user.clientesGerenciados.length,
    }))

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch team: ${error instanceof Error ? error.message : "Unknown"}` },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // If name/email/password provided, create User + MembroEquipe together
    if (body.name && body.email && body.password) {
      const existingUser = await prisma.user.findUnique({
        where: { email: body.email },
      })

      if (existingUser) {
        return NextResponse.json({ error: "Email ja cadastrado" }, { status: 400 })
      }

      const hashedPassword = await bcrypt.hash(body.password, 10)

      const user = await prisma.user.create({
        data: {
          name: body.name,
          email: body.email,
          password: hashedPassword,
          role: "ANALISTA",
        },
      })

      const membro = await prisma.membroEquipe.create({
        data: {
          userId: user.id,
          cargo: body.cargo,
        },
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

      return NextResponse.json(membro, { status: 201 })
    }

    // Otherwise, link existing user via userId
    const data = membroEquipeSchema.parse(body)

    const membro = await prisma.membroEquipe.create({
      data: {
        userId: data.userId,
        cargo: data.cargo,
      },
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

    return NextResponse.json(membro, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }
    return NextResponse.json(
      { error: `Failed to create team member: ${error instanceof Error ? error.message : "Unknown"}` },
      { status: 500 }
    )
  }
}
