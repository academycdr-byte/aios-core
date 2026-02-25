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

interface ValueComparisonChartProps {
  data: DailyMetric[]
}

interface TooltipPayloadItem {
  dataKey: string
  name: string
  value: number
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  return (
    <div
      className="rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2"
      style={{
        background: 'var(--bg-elevated)',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      <p
        className="mb-1.5 text-xs font-medium"
        style={{ color: 'var(--text-tertiary)' }}
      >
        {label}
      </p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: entry.color }}
          />
          <span style={{ color: 'var(--text-secondary)' }}>{entry.name}:</span>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {formatCurrencyShort(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
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

            <Tooltip content={<CustomTooltip />} />

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
