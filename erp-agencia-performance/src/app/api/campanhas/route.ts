import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { campanhaSchema } from "@/lib/validations"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get("clienteId")
    const mes = searchParams.get("mes")
    const stats = searchParams.get("stats")

    const where: Record<string, unknown> = {}
    if (clienteId) where.clienteId = clienteId
    if (mes) where.mes = mes

    if (stats === "true") {
      const campanhas = await prisma.campanha.findMany({ where })

      const aggregated = {
        totalImpressions: 0,
        totalCliques: 0,
        totalConversoes: 0,
        totalReceita: 0,
        totalGasto: 0,
        count: campanhas.length,
      }

      for (const c of campanhas) {
        aggregated.totalImpressions += c.impressoes
        aggregated.totalCliques += c.cliques
        aggregated.totalConversoes += c.conversoes
        aggregated.totalReceita += c.receita
        aggregated.totalGasto += c.gastoReal
      }

      return NextResponse.json(aggregated)
    }

    const campanhas = await prisma.campanha.findMany({
      where,
      include: {
        cliente: { select: { id: true, nome: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(campanhas)
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch campaigns: ${error instanceof Error ? error.message : "Unknown"}` },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = campanhaSchema.parse(body)

    const cliente = await prisma.cliente.findUnique({ where: { id: data.clienteId } })
    if (!cliente) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 400 })
    }

    const campanha = await prisma.campanha.create({
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

    return NextResponse.json(campanha, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }
    return NextResponse.json(
      { error: `Failed to create campaign: ${error instanceof Error ? error.message : "Unknown"}` },
      { status: 500 }
    )
  }
}
