import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { contaReceberSchema } from "@/lib/validations"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dashboard = searchParams.get("dashboard")
    const pl = searchParams.get("pl")

    // ==================== DASHBOARD ====================
    if (dashboard === "true") {
      const contasPagas = await prisma.contaReceber.findMany({ where: { status: "PAGO" } })
      const clientesAtivos = await prisma.cliente.count({ where: { status: "ATIVO" } })
      const campanhas = await prisma.campanha.findMany({
        include: { cliente: { select: { id: true, nome: true } } },
      })
      const todasContas = await prisma.contaReceber.findMany({
        include: { cliente: { select: { id: true, nome: true } } },
      })

      const receitaTotal = contasPagas.reduce((sum: number, c) => sum + c.valor, 0)
      const gastoMidiaTotal = campanhas.reduce((sum: number, c) => sum + c.gastoReal, 0)

      const campanhasComGasto = campanhas.filter((c) => c.gastoReal > 0)
      const roasMedio =
        campanhasComGasto.length > 0
          ? campanhasComGasto.reduce(
              (sum: number, c) => sum + (c.gastoReal > 0 ? c.receita / c.gastoReal : 0),
              0
            ) / campanhasComGasto.length
          : 0

      // Receita mensal (last 6 months)
      const now = new Date()
      const last6Months: string[] = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        last6Months.push(mes)
      }

      const receitaMensal = last6Months.map((mes) => {
        const receita = todasContas
          .filter((c) => c.mes === mes && c.status === "PAGO")
          .reduce((sum: number, c) => sum + c.valor, 0)
        const custos = campanhas
          .filter((c) => c.mes === mes)
          .reduce((sum: number, c) => sum + c.gastoReal, 0)
        return { mes, receita, custos }
      })

      // Top 5 clientes by receita from campanhas
      const clienteReceitaMap: Record<string, { nome: string; receita: number; gasto: number }> = {}
      for (const c of campanhas) {
        if (!c.cliente) continue
        if (!clienteReceitaMap[c.cliente.id]) {
          clienteReceitaMap[c.cliente.id] = { nome: c.cliente.nome, receita: 0, gasto: 0 }
        }
        clienteReceitaMap[c.cliente.id].receita += c.receita
        clienteReceitaMap[c.cliente.id].gasto += c.gastoReal
      }
      const topClientes = Object.entries(clienteReceitaMap)
        .map(([id, data]) => ({
          id,
          nome: data.nome,
          receita: data.receita,
          roas: data.gasto > 0 ? data.receita / data.gasto : 0,
        }))
        .sort((a, b) => b.receita - a.receita)
        .slice(0, 5)

      // Alerts
      const clienteRoasMap: Record<string, { nome: string; totalReceita: number; totalGasto: number }> = {}
      for (const c of campanhas) {
        if (!c.cliente) continue
        if (!clienteRoasMap[c.cliente.id]) {
          clienteRoasMap[c.cliente.id] = { nome: c.cliente.nome, totalReceita: 0, totalGasto: 0 }
        }
        clienteRoasMap[c.cliente.id].totalReceita += c.receita
        clienteRoasMap[c.cliente.id].totalGasto += c.gastoReal
      }

      const alerts: { tipo: string; mensagem: string }[] = []

      for (const [, data] of Object.entries(clienteRoasMap)) {
        if (data.totalGasto > 0) {
          const roas = data.totalReceita / data.totalGasto
          if (roas < 2) {
            alerts.push({
              tipo: "ROAS_BAIXO",
              mensagem: `${data.nome} com ROAS ${roas.toFixed(1)}x (abaixo de 2x)`,
            })
          }
        }
      }

      for (const c of campanhas) {
        if (c.budgetPlanejado > 0 && c.gastoReal > c.budgetPlanejado * 0.9) {
          alerts.push({
            tipo: "BUDGET_ALTO",
            mensagem: `${c.nome} gastou ${((c.gastoReal / c.budgetPlanejado) * 100).toFixed(0)}% do budget`,
          })
        }
      }

      return NextResponse.json({
        receitaTotal,
        clientesAtivos,
        gastoMidiaTotal,
        roasMedio,
        receitaMensal,
        topClientes,
        alerts,
      })
    }

    // ==================== P&L ====================
    if (pl === "true") {
      const clientes = await prisma.cliente.findMany({ where: { status: "ATIVO" } })
      const campanhas = await prisma.campanha.findMany()
      const contas = await prisma.contaReceber.findMany({ where: { status: "PAGO" } })

      const plData = clientes.map((cliente) => {
        const receitaFees = contas
          .filter((c) => c.clienteId === cliente.id)
          .reduce((sum: number, c) => sum + c.valor, 0)
        const custoMidia = campanhas
          .filter((c) => c.clienteId === cliente.id)
          .reduce((sum: number, c) => sum + c.gastoReal, 0)
        const lucro = receitaFees - custoMidia
        const margem = receitaFees > 0 ? (lucro / receitaFees) * 100 : 0

        return {
          id: cliente.id,
          nome: cliente.nome,
          receitaFees,
          custoMidia,
          lucro,
          margem,
        }
      })

      const totals = {
        receitaFees: plData.reduce((sum: number, c) => sum + c.receitaFees, 0),
        custoMidia: plData.reduce((sum: number, c) => sum + c.custoMidia, 0),
        lucro: plData.reduce((sum: number, c) => sum + c.lucro, 0),
        margem: 0,
      }
      totals.margem = totals.receitaFees > 0 ? (totals.lucro / totals.receitaFees) * 100 : 0

      return NextResponse.json({ clientes: plData, totals })
    }

    // ==================== DEFAULT: List ContaReceber ====================
    const status = searchParams.get("status")
    const where = status ? { status } : {}

    const contas = await prisma.contaReceber.findMany({
      where,
      include: { cliente: { select: { id: true, nome: true } } },
      orderBy: { mes: "desc" },
    })

    return NextResponse.json(contas)
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch financial data: ${error instanceof Error ? error.message : "Unknown"}` },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = contaReceberSchema.parse(body)

    const conta = await prisma.contaReceber.create({
      data: {
        clienteId: data.clienteId,
        descricao: data.descricao ?? null,
        valor: data.valor,
        mes: data.mes,
        status: data.status,
        dataPagamento: data.dataPagamento ? new Date(data.dataPagamento) : null,
      },
      include: { cliente: { select: { id: true, nome: true } } },
    })

    return NextResponse.json(conta, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }
    return NextResponse.json(
      { error: `Failed to create conta: ${error instanceof Error ? error.message : "Unknown"}` },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    const body = await request.json()
    const data = contaReceberSchema.partial().parse(body)

    const conta = await prisma.contaReceber.update({
      where: { id },
      data: {
        ...(data.clienteId !== undefined && { clienteId: data.clienteId }),
        ...(data.descricao !== undefined && { descricao: data.descricao ?? null }),
        ...(data.valor !== undefined && { valor: data.valor }),
        ...(data.mes !== undefined && { mes: data.mes }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.dataPagamento !== undefined && {
          dataPagamento: data.dataPagamento ? new Date(data.dataPagamento) : null,
        }),
      },
      include: { cliente: { select: { id: true, nome: true } } },
    })

    return NextResponse.json(conta)
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to update conta: ${error instanceof Error ? error.message : "Unknown"}` },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    await prisma.contaReceber.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to delete conta: ${error instanceof Error ? error.message : "Unknown"}` },
      { status: 500 }
    )
  }
}
