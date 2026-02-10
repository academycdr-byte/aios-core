"use client"

import { DollarSign, Users, TrendingUp, Megaphone } from "lucide-react"
import { formatCurrency, formatNumber } from "@/lib/utils"

interface StatsCardsProps {
  receitaTotal: number
  clientesAtivos: number
  roasMedio: number
  gastoMidiaTotal: number
}

interface StatItem {
  label: string
  value: string
  icon: React.ReactNode
  iconBg: string
}

export function StatsCards({
  receitaTotal,
  clientesAtivos,
  roasMedio,
  gastoMidiaTotal,
}: StatsCardsProps) {
  const stats: StatItem[] = [
    {
      label: "Receita Total",
      value: formatCurrency(receitaTotal),
      icon: <DollarSign className="h-5 w-5 text-emerald-400" />,
      iconBg: "bg-emerald-500/10",
    },
    {
      label: "Clientes Ativos",
      value: formatNumber(clientesAtivos),
      icon: <Users className="h-5 w-5 text-accent" />,
      iconBg: "bg-accent/10",
    },
    {
      label: "ROAS Médio",
      value: roasMedio.toFixed(2) + "x",
      icon: <TrendingUp className="h-5 w-5 text-amber-400" />,
      iconBg: "bg-amber-500/10",
    },
    {
      label: "Gasto Mídia Total",
      value: formatCurrency(gastoMidiaTotal),
      icon: <Megaphone className="h-5 w-5 text-violet-400" />,
      iconBg: "bg-violet-500/10",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className="group rounded-xl border border-border bg-bg-card p-5 transition-all hover:border-border-hover hover:shadow-lg hover:shadow-black/5"
          style={{ animationDelay: `${i * 75}ms` }}
        >
          <div className="flex items-center gap-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.iconBg} transition-transform group-hover:scale-110`}>
              {stat.icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-text-muted">{stat.label}</p>
              <p className="mt-0.5 text-xl font-bold text-text-primary truncate">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
