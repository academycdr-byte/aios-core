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
import type { DailyMetric } from '@/types/charts'
import { formatCurrencyShort } from '@/lib/format'
import { ChartTooltip } from '@/components/patterns'

interface ValueComparisonChartProps {
  data: DailyMetric[]
}

function formatYAxis(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}k`
  }
  return String(value)
}

export function ValueComparisonChart({ data }: ValueComparisonChartProps) {
  // Show last 14 days to keep bars readable
  const chartData = data.slice(-14)

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        padding: '28px',
      }}
    >
      <h3
        style={{
          fontSize: '20px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
          margin: '0 0 20px 0',
        }}
      >
        Valor Abandonado vs Recuperado
      </h3>

      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 5, left: -10, bottom: 0 }}
            barCategoryGap="35%"
            barGap={0}
          >
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="var(--border)"
              vertical={false}
            />

            <XAxis
              dataKey="dateLabel"
              tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />

            <YAxis
              tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatYAxis}
            />

            <Tooltip
              content={
                <ChartTooltip
                  formatter={(v) => formatCurrencyShort(v)}
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

            {/* Background bar — full abandoned value (max height reference) */}
            <Bar
              dataKey="abandonedValue"
              name="Abandonado"
              fill="var(--chart-100)"
              radius={[6, 6, 0, 0]}
            />

            {/* Foreground bar — recovered value (proportional) */}
            <Bar
              dataKey="recoveredValue"
              name="Recuperado"
              fill="var(--chart-400)"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
