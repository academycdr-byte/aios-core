'use client'

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { TypeDistribution } from '@/types/charts'
import { formatNumber } from '@/lib/format'

interface TypeDistributionChartProps {
  data: TypeDistribution[]
}

interface TooltipPayloadItem {
  name: string
  value: number
  payload: TypeDistribution
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  const item = payload[0]

  return (
    <div
      className="rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2"
      style={{
        background: 'var(--bg-elevated)',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      <div className="flex items-center gap-2 text-sm">
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ background: item.payload.color }}
        />
        <span style={{ color: 'var(--text-secondary)' }}>{item.name}:</span>
        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
          {formatNumber(item.value)}
        </span>
      </div>
    </div>
  )
}

export function TypeDistributionChart({ data }: TypeDistributionChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div
      className="rounded-[var(--radius-lg)] border border-[var(--border)] p-5"
      style={{ background: 'var(--surface)' }}
    >
      <h3
        className="mb-4 text-sm font-semibold"
        style={{ color: 'var(--text-primary)' }}
      >
        Distribuição por Tipo
      </h3>

      <div className="flex flex-col items-center gap-4 sm:flex-row">
        {/* Pie Chart */}
        <div className="h-[200px] w-[200px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-1 flex-col gap-3">
          {data.map((item) => {
            const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0

            return (
              <div key={item.name} className="flex items-center gap-3">
                <span
                  className="h-3 w-3 flex-shrink-0 rounded-full"
                  style={{ background: item.color }}
                />
                <div className="flex flex-1 items-center justify-between">
                  <span
                    className="text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {item.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {formatNumber(item.count)}
                    </span>
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        background: `${item.color}20`,
                        color: item.color,
                      }}
                    >
                      {percentage}%
                    </span>
                  </div>
                </div>
              </div>
            )
          })}

          <div
            className="mt-1 border-t pt-2"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-sm font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                Total
              </span>
              <span
                className="text-sm font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                {formatNumber(total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
