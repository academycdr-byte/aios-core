import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { tarefaSchema } from "@/lib/validations"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params

    const tarefa = await prisma.tarefa.findUnique({
      where: { id },
      include: {
        cliente: { select: { id: true, nome: true } },
        responsavel: { select: { id: true, name: true, email: true } },
      },
    })

    if (!tarefa) {
      return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 })
    }

    return NextResponse.json(tarefa)
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch task: ${error instanceof Error ? error.message : "Unknown"}` },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.tarefa.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 })
    }

    // Support partial updates (especially for status changes via drag/drop)
    const updateData: Record<string, unknown> = {}

    if (body.titulo !== undefined) updateData.titulo = body.titulo
    if (body.descricao !== undefined) updateData.descricao = body.descricao
    if (body.status !== undefined) updateData.status = body.status
    if (body.prioridade !== undefined) updateData.prioridade = body.prioridade
    if (body.clienteId !== undefined) updateData.clienteId = body.clienteId || null
    if (body.responsavelId !== undefined) updateData.responsavelId = body.responsavelId || null
    if (body.prazo !== undefined) updateData.prazo = body.prazo ? new Date(body.prazo) : null

    // If full update, validate with schema
    if (body.titulo !== undefined) {
      tarefaSchema.partial().parse(body)
    }

    const tarefa = await prisma.tarefa.update({
      where: { id },
      data: updateData,
      include: {
        cliente: { select: { id: true, nome: true } },
        responsavel: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json(tarefa)
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }
    return NextResponse.json(
      { error: `Failed to update task: ${error instanceof Error ? error.message : "Unknown"}` },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params

    const existing = await prisma.tarefa.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Tarefa não encontrada" }, { status: 404 })
    }

    await prisma.tarefa.delete({ where: { id } })

    return NextResponse.json({ message: "Tarefa removida com sucesso" })
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to delete task: ${error instanceof Error ? error.message : "Unknown"}` },
      { status: 500 }
    )
  }
}
