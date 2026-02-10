import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { clienteSchema } from "@/lib/validations"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const where = status ? { status } : {}

    const clientes = await prisma.cliente.findMany({
      where,
      include: { gestor: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(clientes)
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch clients: ${error instanceof Error ? error.message : "Unknown"}` },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = clienteSchema.parse(body)

    const cliente = await prisma.cliente.create({
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

    return NextResponse.json(cliente, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }
    return NextResponse.json(
      { error: `Failed to create client: ${error instanceof Error ? error.message : "Unknown"}` },
      { status: 500 }
    )
  }
}
