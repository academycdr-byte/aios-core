'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { StepMetric } from '@/types/charts'
import { ChartTooltip } from '@/components/patterns'
import { useTheme } from '@/lib/theme-context'
import { formatNumber } from '@/lib/format'

interface StepFunnelChartProps {
  data: StepMetric[]
}

export function StepFunnelChart({ data }: StepFunnelChartProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const tickColor = isDark ? '#8B8B8B' : '#6B7280'
  const legendColor = isDark ? '#8B8B8B' : '#9CA3AF'

  const chartData = data.map((step) => ({
    name: step.stepNumber === 0 ? 'Primeira Msg' : `Follow-up ${step.stepNumber}`,
    Enviadas: step.messagesSent,
    Lidas: step.messagesRead,
    Cliques: step.linkClicks,
    Conversões: step.conversions,
  }))

  const isEmpty = data.length === 0

  return (
    <div
      className="rounded-[var(--radius-lg)] border border-[var(--border)] p-5"
      style={{ background: 'var(--surface)' }}
    >
      <h3
        className="mb-4 text-sm font-semibold"
        style={{ color: 'var(--text-primary)' }}
      >
        Funil por Etapa
      </h3>

      {isEmpty ? (
        <div className="flex h-[300px] items-center justify-center">
          <p
            className="text-sm"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Nenhum dado disponível
          </p>
        </div>
      ) : (
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 5, left: -10, bottom: 0 }}
              barCategoryGap="20%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={gridColor}
                vertical={false}
              />

              <XAxis
                dataKey="name"
                tick={{ fill: tickColor, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                tick={{ fill: tickColor, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => formatNumber(v)}
              />

              <Tooltip
                content={
                  <ChartTooltip
                    formatter={(v: number) => formatNumber(v)}
                  />
                }
              />

              <Legend
                wrapperStyle={{ paddingTop: 12 }}
                iconType="circle"
                iconSize={8}
                formatter={(value: string) => (
                  <span style={{ color: legendColor, fontSize: 12 }}>{value}</span>
                )}
              />

              <Bar
                dataKey="Enviadas"
                fill="#6B7280"
                radius={[4, 4, 0, 0]}
                opacity={0.8}
              />

              <Bar
                dataKey="Lidas"
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
                opacity={0.85}
              />

              <Bar
                dataKey="Cliques"
                fill="#F59E0B"
                radius={[4, 4, 0, 0]}
                opacity={0.9}
              />

              <Bar
                dataKey="Conversões"
                fill="#10B981"
                radius={[4, 4, 0, 0]}
                opacity={0.95}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
