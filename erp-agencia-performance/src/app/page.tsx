"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { TopClients } from "@/components/dashboard/top-clients"
import { Alerts } from "@/components/dashboard/alerts"

interface DashboardData {
  receitaTotal: number
  clientesAtivos: number
  roasMedio: number
  gastoMidiaTotal: number
  receitaMensal: Array<{ mes: string; receita: number; gastoMidia: number }>
  topClientes: Array<{ id: string; nome: string; receita: number; roas: number }>
  alerts: Array<{ tipo: string; mensagem: string; clienteNome?: string }>
}

const defaultData: DashboardData = {
  receitaTotal: 0,
  clientesAtivos: 0,
  roasMedio: 0,
  gastoMidiaTotal: 0,
  receitaMensal: [],
  topClientes: [],
  alerts: [],
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Bom dia"
  if (hour < 18) return "Boa tarde"
  return "Boa noite"
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<DashboardData>(defaultData)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [finRes, campRes] = await Promise.all([
          fetch("/api/financeiro?dashboard=true").catch(() => null),
          fetch("/api/campanhas?stats=true").catch(() => null),
        ])

        const finData = finRes?.ok ? await finRes.json() : null
        const campData = campRes?.ok ? await campRes.json() : null

        if (finData || campData) {
          const rawMensal = finData?.receitaMensal ?? campData?.receitaMensal ?? []
          const receitaMensal = rawMensal.map((item: { mes: string; receita: number; custos?: number; gastoMidia?: number }) => ({
            mes: item.mes,
            receita: item.receita,
            gastoMidia: item.gastoMidia ?? item.custos ?? 0,
          }))

          const rawAlerts = finData?.alerts ?? campData?.alerts ?? []
          const alerts = rawAlerts.map((a: { tipo: string; mensagem: string; clienteNome?: string }) => ({
            tipo: a.tipo,
            mensagem: a.mensagem,
            clienteNome: a.clienteNome ?? "",
          }))

          setData({
            receitaTotal: finData?.receitaTotal ?? campData?.receitaTotal ?? 0,
            clientesAtivos: finData?.clientesAtivos ?? campData?.clientesAtivos ?? 0,
            roasMedio: campData?.roasMedio ?? finData?.roasMedio ?? 0,
            gastoMidiaTotal: campData?.gastoMidiaTotal ?? finData?.gastoMidiaTotal ?? 0,
            receitaMensal,
            topClientes: finData?.topClientes ?? campData?.topClientes ?? [],
            alerts,
          })
        }
      } catch {
        // keep default data
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  const firstName = session?.user?.name?.split(" ")[0] || ""

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded bg-bg-secondary animate-pulse" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[88px] rounded-xl border border-border bg-bg-card animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 h-[360px] rounded-xl border border-border bg-bg-card animate-pulse" />
          <div className="h-[360px] rounded-xl border border-border bg-bg-card animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">
          {getGreeting()}{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="text-[13px] text-text-muted mt-0.5">
          Visao geral da performance da agencia
        </p>
      </div>

      <StatsCards
        receitaTotal={data.receitaTotal}
        clientesAtivos={data.clientesAtivos}
        roasMedio={data.roasMedio}
        gastoMidiaTotal={data.gastoMidiaTotal}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart data={data.receitaMensal} />
        </div>
        <div>
          <TopClients clientes={data.topClientes} />
        </div>
      </div>

      <Alerts alerts={data.alerts} />
    </div>
  )
}
