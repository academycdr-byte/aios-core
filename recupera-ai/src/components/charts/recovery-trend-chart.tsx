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
import { ChartTooltip } from '@/components/patterns'
import { useTheme } from '@/lib/theme-context'

interface RecoveryTrendChartProps {
  data: DailyMetric[]
}

export function RecoveryTrendChart({ data }: RecoveryTrendChartProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const tickColor = isDark ? '#8B8B8B' : '#6B7280'
  const legendColor = isDark ? '#8B8B8B' : '#9CA3AF'
  const dotStrokeColor = isDark ? '#0F0F0F' : '#FFFFFF'

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
              stroke={gridColor}
              vertical={false}
            />

            <XAxis
              dataKey="dateLabel"
              tick={{ fill: tickColor, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />

            <YAxis
              tick={{ fill: tickColor, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />

            <Tooltip content={<ChartTooltip />} />

            <Legend
              wrapperStyle={{ paddingTop: 12 }}
              iconType="circle"
              iconSize={8}
              formatter={(value: string) => (
                <span style={{ color: legendColor, fontSize: 12 }}>{value}</span>
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
              activeDot={{ r: 4, fill: '#F59E0B', stroke: dotStrokeColor, strokeWidth: 2 }}
            />

            <Area
              type="monotone"
              dataKey="recoveredCount"
              name="Recuperados"
              stroke="#10B981"
              strokeWidth={2}
              fill="url(#gradientRecovered)"
              dot={false}
              activeDot={{ r: 4, fill: '#10B981', stroke: dotStrokeColor, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
