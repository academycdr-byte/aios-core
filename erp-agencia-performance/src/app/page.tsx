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
  alerts: Array<{ tipo: string; mensagem: string; clienteNome: string }>
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

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-bg-card p-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-bg-secondary animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-3 w-20 rounded bg-bg-secondary animate-pulse" />
                <div className="h-6 w-28 rounded bg-bg-secondary animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 h-[370px] rounded-xl border border-border bg-bg-card animate-pulse" />
        <div className="lg:col-span-2 h-[370px] rounded-xl border border-border bg-bg-card animate-pulse" />
      </div>
    </div>
  )
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
          setData({
            receitaTotal: finData?.receitaTotal ?? campData?.receitaTotal ?? 0,
            clientesAtivos: finData?.clientesAtivos ?? campData?.clientesAtivos ?? 0,
            roasMedio: campData?.roasMedio ?? 0,
            gastoMidiaTotal: campData?.gastoMidiaTotal ?? 0,
            receitaMensal: finData?.receitaMensal ?? campData?.receitaMensal ?? [],
            topClientes: finData?.topClientes ?? campData?.topClientes ?? [],
            alerts: campData?.alerts ?? finData?.alerts ?? [],
          })
        }
      } catch {
        // APIs not available yet -- keep default data
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  const firstName = session?.user?.name?.split(" ")[0] || ""

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          {getGreeting()}{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Visão geral da performance da agência
        </p>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <StatsCards
            receitaTotal={data.receitaTotal}
            clientesAtivos={data.clientesAtivos}
            roasMedio={data.roasMedio}
            gastoMidiaTotal={data.gastoMidiaTotal}
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <RevenueChart data={data.receitaMensal} />
            </div>
            <div className="lg:col-span-2">
              <TopClients clientes={data.topClientes} />
            </div>
          </div>

          <Alerts alerts={data.alerts} />
        </>
      )}
    </div>
  )
}
