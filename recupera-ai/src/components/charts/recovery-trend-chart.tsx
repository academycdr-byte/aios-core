'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { DailyMetric } from '@/types/charts'

interface RecoveryTrendChartProps {
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
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export function RecoveryTrendChart({ data }: RecoveryTrendChartProps) {
  return (
    <div
      className="rounded-[var(--radius-lg)] border border-[var(--border)] p-5"
      style={{ background: 'var(--surface)' }}
    >
      <h3
        className="mb-4 text-sm font-semibold"
        style={{ color: 'var(--text-primary)' }}
      >
        Abandonos vs Recuperacoes (30 dias)
      </h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="gradientAbandoned" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradientRecovered" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>

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
              interval="preserveStartEnd"
            />

            <YAxis
              tick={{ fill: '#6B7280', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
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

            <Area
              type="monotone"
              dataKey="abandonedCount"
              name="Abandonos"
              stroke="#F59E0B"
              strokeWidth={2}
              fill="url(#gradientAbandoned)"
              dot={false}
              activeDot={{ r: 4, fill: '#F59E0B', stroke: '#0B0F1A', strokeWidth: 2 }}
            />

            <Area
              type="monotone"
              dataKey="recoveredCount"
              name="Recuperados"
              stroke="#10B981"
              strokeWidth={2}
              fill="url(#gradientRecovered)"
              dot={false}
              activeDot={{ r: 4, fill: '#10B981', stroke: '#0B0F1A', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
