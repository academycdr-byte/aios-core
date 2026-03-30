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
import { formatNumber } from '@/lib/format'

interface StepFunnelChartProps {
  data: StepMetric[]
}

export function StepFunnelChart({ data }: StepFunnelChartProps) {
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
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: 28,
      }}
    >
      <h3
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
          margin: '0 0 20px 0',
        }}
      >
        Funil por Etapa
      </h3>

      {isEmpty ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: 300,
            gap: 12,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'var(--accent-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 3h14v2.5L12 10v5l-4 2V10L3 5.5V3z"
                stroke="var(--text-tertiary)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span
            style={{
              fontSize: 14,
              color: 'var(--text-tertiary)',
            }}
          >
            Nenhum dado disponível
          </span>
        </div>
      ) : (
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 5, left: -10, bottom: 0 }}
              barCategoryGap="20%"
            >
              <CartesianGrid
                strokeDasharray="4 4"
                stroke="var(--border)"
                vertical={false}
              />

              <XAxis
                dataKey="name"
                tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
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
                wrapperStyle={{ paddingTop: 16 }}
                iconType="circle"
                iconSize={8}
                formatter={(value: string) => (
                  <span
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: '13px',
                    }}
                  >
                    {value}
                  </span>
                )}
              />

              <Bar
                dataKey="Enviadas"
                fill="var(--chart-100)"
                radius={[6, 6, 0, 0]}
              />

              <Bar
                dataKey="Lidas"
                fill="var(--chart-200)"
                radius={[6, 6, 0, 0]}
              />

              <Bar
                dataKey="Cliques"
                fill="var(--chart-300)"
                radius={[6, 6, 0, 0]}
              />

              <Bar
                dataKey="Conversões"
                fill="var(--chart-400)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
