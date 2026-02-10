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
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

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
    <div className="rounded-lg border border-border bg-bg-card px-4 py-3 shadow-lg">
      <p className="mb-2 text-sm font-medium text-text-primary">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-sm text-text-secondary">
          <span className="inline-block h-2 w-2 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
          {entry.name === "receita" ? "Receita" : "Gasto Mídia"}:{" "}
          <span className="font-medium text-text-primary">{formatCurrency(entry.value)}</span>
        </p>
      ))}
    </div>
  )
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Receita vs Gasto de Mídia</CardTitle>
      </CardHeader>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorGasto" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
          <XAxis
            dataKey="mes"
            tick={{ fill: "#71717a", fontSize: 12 }}
            axisLine={{ stroke: "#262626" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#71717a", fontSize: 12 }}
            axisLine={{ stroke: "#262626" }}
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
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#colorReceita)"
          />
          <Area
            type="monotone"
            dataKey="gastoMidia"
            stroke="#f43f5e"
            strokeWidth={2}
            fill="url(#colorGasto)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  )
}
