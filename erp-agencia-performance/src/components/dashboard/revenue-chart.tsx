"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { formatCurrency } from "@/lib/utils"
import { BarChart3 } from "lucide-react"

interface RevenueChartProps {
  data: Array<{ mes: string; receita: number; gastoMidia: number }>
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number; name: string; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-md border border-border bg-bg-elevated px-3 py-2 text-xs shadow-lg">
      <p className="mb-1.5 font-medium text-text-primary">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-text-secondary">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span>{entry.name === "receita" ? "Receita" : "Gasto Midia"}</span>
          <span className="ml-auto font-medium text-text-primary">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="rounded-xl border border-border bg-bg-card p-5 h-full ring-1 ring-white/[0.03]">
      <h3 className="mb-4 text-sm font-medium text-text-secondary">Receita vs Gasto de Midia</h3>
      {data.length === 0 ? (
        <div className="flex h-[280px] flex-col items-center justify-center gap-2 text-text-muted">
          <BarChart3 size={24} />
          <p className="text-xs">Sem dados disponiveis</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c5cfc" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#7c5cfc" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorGasto" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
            <XAxis
              dataKey="mes"
              tick={{ fill: "#666", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#666", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value: number) =>
                new Intl.NumberFormat("pt-BR", {
                  notation: "compact",
                  compactDisplay: "short",
                }).format(value)
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="receita"
              stroke="#7c5cfc"
              strokeWidth={1.5}
              fill="url(#colorReceita)"
            />
            <Area
              type="monotone"
              dataKey="gastoMidia"
              stroke="#ef4444"
              strokeWidth={1.5}
              fill="url(#colorGasto)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
