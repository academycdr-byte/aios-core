"use client"

import { DollarSign, Users, TrendingUp, Megaphone } from "lucide-react"
import { formatCurrency, formatNumber } from "@/lib/utils"

interface StatsCardsProps {
  receitaTotal: number
  clientesAtivos: number
  roasMedio: number
  gastoMidiaTotal: number
}

export function StatsCards({
  receitaTotal,
  clientesAtivos,
  roasMedio,
  gastoMidiaTotal,
}: StatsCardsProps) {
  const stats = [
    {
      label: "Receita Total",
      value: formatCurrency(receitaTotal),
      icon: DollarSign,
      color: "text-emerald-400",
    },
    {
      label: "Clientes Ativos",
      value: formatNumber(clientesAtivos),
      icon: Users,
      color: "text-blue-400",
    },
    {
      label: "ROAS Medio",
      value: roasMedio.toFixed(2) + "x",
      icon: TrendingUp,
      color: "text-amber-400",
    },
    {
      label: "Gasto Midia Total",
      value: formatCurrency(gastoMidiaTotal),
      icon: Megaphone,
      color: "text-violet-400",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-border bg-bg-card p-4 ring-1 ring-white/[0.03]"
        >
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-text-muted">{stat.label}</p>
            <stat.icon size={16} className={stat.color} />
          </div>
          <p className="mt-2 text-2xl font-semibold text-text-primary tracking-tight">
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  )
}
