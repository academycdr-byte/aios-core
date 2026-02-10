import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { clienteSchema } from "@/lib/validations"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params

    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        gestor: { select: { id: true, name: true, email: true } },
        campanhas: { orderBy: { createdAt: "desc" } },
        contasReceber: { orderBy: { createdAt: "desc" } },
      },
    })

    if (!cliente) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
    }

    return NextResponse.json(cliente)
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch client: ${error instanceof Error ? error.message : "Unknown"}` },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const data = clienteSchema.parse(body)

    const existing = await prisma.cliente.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
    }

    const cliente = await prisma.cliente.update({
      where: { id },
      data: {
        nome: data.nome,
        cnpj: data.cnpj ?? null,
        segmento: data.segmento ?? null,
        contato: data.contato ?? null,
        email: data.email ?? null,
        telefone: data.telefone ?? null,
        plataforma: data.plataforma ?? null,
        urlLoja: data.urlLoja || null,
        status: data.status,
        feeMensal: data.feeMensal ?? null,
        modeloCobranca: data.modeloCobranca,
        gestorId: data.gestorId ?? null,
      },
      include: { gestor: { select: { id: true, name: true, email: true } } },
    })

    return NextResponse.json(cliente)
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }
    return NextResponse.json(
      { error: `Failed to update client: ${error instanceof Error ? error.message : "Unknown"}` },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params

    const existing = await prisma.cliente.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
    }

    await prisma.cliente.delete({ where: { id } })

    return NextResponse.json({ message: "Cliente removido com sucesso" })
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to delete client: ${error instanceof Error ? error.message : "Unknown"}` },
      { status: 500 }
    )
  }
}
