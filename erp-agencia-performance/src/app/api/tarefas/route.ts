import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { tarefaSchema } from "@/lib/validations"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const clienteId = searchParams.get("clienteId")
    const responsavelId = searchParams.get("responsavelId")

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (clienteId) where.clienteId = clienteId
    if (responsavelId) where.responsavelId = responsavelId

    const tarefas = await prisma.tarefa.findMany({
      where,
      include: {
        cliente: { select: { id: true, nome: true } },
        responsavel: { select: { id: true, name: true, email: true } },
      },
      orderBy: [
        {
          prioridade: "asc",
        },
        { createdAt: "desc" },
      ],
    })

    // Custom sort: URGENTE first, then ALTA, MEDIA, BAIXA
    const prioridadeOrder: Record<string, number> = {
      URGENTE: 0,
      ALTA: 1,
      MEDIA: 2,
      BAIXA: 3,
    }

    tarefas.sort((a, b) => {
      const prioA = prioridadeOrder[a.prioridade] ?? 99
      const prioB = prioridadeOrder[b.prioridade] ?? 99
      if (prioA !== prioB) return prioA - prioB
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return NextResponse.json(tarefas)
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch tasks: ${error instanceof Error ? error.message : "Unknown"}` },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = tarefaSchema.parse(body)

    const tarefa = await prisma.tarefa.create({
      data: {
        titulo: data.titulo,
        descricao: data.descricao ?? null,
        status: data.status,
        prioridade: data.prioridade,
        clienteId: data.clienteId ?? null,
        responsavelId: data.responsavelId ?? null,
        prazo: data.prazo ? new Date(data.prazo) : null,
      },
      include: {
        cliente: { select: { id: true, nome: true } },
        responsavel: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json(tarefa, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }
    return NextResponse.json(
      { error: `Failed to create task: ${error instanceof Error ? error.message : "Unknown"}` },
      { status: 500 }
    )
  }
}
