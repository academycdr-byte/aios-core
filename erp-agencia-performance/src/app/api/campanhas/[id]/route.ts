import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { campanhaSchema } from "@/lib/validations"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params

    const campanha = await prisma.campanha.findUnique({
      where: { id },
      include: {
        cliente: { select: { id: true, nome: true, segmento: true } },
      },
    })

    if (!campanha) {
      return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 })
    }

    return NextResponse.json(campanha)
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch campaign: ${error instanceof Error ? error.message : "Unknown"}` },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const data = campanhaSchema.parse(body)

    const existing = await prisma.campanha.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 })
    }

    const campanha = await prisma.campanha.update({
      where: { id },
      data: {
        nome: data.nome,
        clienteId: data.clienteId,
        plataforma: data.plataforma,
        budgetPlanejado: data.budgetPlanejado,
        gastoReal: data.gastoReal,
        impressoes: data.impressoes,
        cliques: data.cliques,
        conversoes: data.conversoes,
        receita: data.receita,
        mes: data.mes,
        status: data.status,
      },
      include: {
        cliente: { select: { id: true, nome: true } },
      },
    })

    return NextResponse.json(campanha)
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }
    return NextResponse.json(
      { error: `Failed to update campaign: ${error instanceof Error ? error.message : "Unknown"}` },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params

    const existing = await prisma.campanha.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 })
    }

    await prisma.campanha.delete({ where: { id } })

    return NextResponse.json({ message: "Campanha removida com sucesso" })
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to delete campaign: ${error instanceof Error ? error.message : "Unknown"}` },
      { status: 500 }
    )
  }
}
