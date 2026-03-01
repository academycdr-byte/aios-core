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
    return `${(value / 1000).toFixed(0)}K`
  }
  return String(value)
}

export function ValueComparisonChart({ data }: ValueComparisonChartProps) {
  // Show last 14 days to keep bars readable
  const chartData = data.slice(-14)

  return (
    <div
      className="rounded-[var(--radius-lg)] border border-[var(--border)] p-5"
      style={{ background: 'var(--surface)' }}
    >
      <h3
        className="mb-4 text-sm font-semibold"
        style={{ color: 'var(--text-primary)' }}
      >
        Valor Abandonado vs Recuperado (14 dias)
      </h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 5, left: -10, bottom: 0 }}
            barCategoryGap="20%"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.06)"
              vertical={false}
            />

            <XAxis
              dataKey="dateLabel"
              tick={{ fill: '#6B7280', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />

            <YAxis
              tick={{ fill: '#6B7280', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatYAxis}
            />

            <Tooltip content={<ChartTooltip formatter={(v) => formatCurrencyShort(v)} />} />

            <Legend
              wrapperStyle={{ paddingTop: 12 }}
              iconType="circle"
              iconSize={8}
              formatter={(value: string) => (
                <span style={{ color: '#9CA3AF', fontSize: 12 }}>{value}</span>
              )}
            />

            <Bar
              dataKey="abandonedValue"
              name="Abandonado"
              fill="#F59E0B"
              radius={[4, 4, 0, 0]}
              opacity={0.8}
            />

            <Bar
              dataKey="recoveredValue"
              name="Recuperado"
              fill="#10B981"
              radius={[4, 4, 0, 0]}
              opacity={0.9}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
