'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { AbandonmentReasonData } from '@/types/charts'
import { formatNumber } from '@/lib/format'

interface AbandonmentReasonsChartProps {
  data: AbandonmentReasonData[]
}

interface TooltipPayloadItem {
  name: string
  value: number
  payload: AbandonmentReasonData
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
        <span style={{ color: 'var(--text-secondary)' }}>{item.payload.label}:</span>
        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
          {formatNumber(item.value)}
        </span>
      </div>
    </div>
  )
}

export function AbandonmentReasonsChart({ data }: AbandonmentReasonsChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0)

  return (
    <div
      className="rounded-[var(--radius-lg)] border border-[var(--border)] p-5"
      style={{ background: 'var(--surface)' }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3
          className="text-sm font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          Motivos de Abandono
        </h3>
        <span
          className="text-xs"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {formatNumber(total)} conversas
        </span>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 8, bottom: 0, left: 0 }}
          >
            <XAxis
              type="number"
              tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={140}
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'var(--surface-hover)', opacity: 0.5 }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={24}>
              {data.map((entry) => (
                <Cell key={entry.reason} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary row */}
      <div
        className="mt-3 flex items-center justify-between border-t pt-3"
        style={{ borderColor: 'var(--border)' }}
      >
        <span
          className="text-xs"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Top motivo
        </span>
        {data.length > 0 && (
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: data[0].color }}
            />
            <span
              className="text-xs font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              {data[0].label} ({Math.round((data[0].count / total) * 100)}%)
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
