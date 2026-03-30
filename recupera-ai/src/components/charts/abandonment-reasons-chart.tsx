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

const MONOCHROMATIC_SCALE = [
  'var(--chart-400)',
  'var(--chart-300)',
  'var(--chart-200)',
  'var(--chart-100)',
]

function getBarFill(index: number): string {
  if (index < MONOCHROMATIC_SCALE.length) return MONOCHROMATIC_SCALE[index]
  return MONOCHROMATIC_SCALE[MONOCHROMATIC_SCALE.length - 1]
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  const item = payload[0]

  return (
    <div
      style={{
        background: '#1F2937',
        color: '#FFFFFF',
        borderRadius: 8,
        padding: '8px 12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        fontSize: 13,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>{item.payload.label}:</span>
        <span style={{ fontWeight: 600 }}>{formatNumber(item.value)}</span>
      </div>
    </div>
  )
}

export function AbandonmentReasonsChart({ data }: AbandonmentReasonsChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0)

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: 28,
      }}
    >
      {/* Title */}
      <h3
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
          margin: 0,
          marginBottom: 20,
        }}
      >
        Motivos de Abandono
      </h3>

      {/* Chart */}
      <div style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 8, bottom: 0, left: 0 }}
          >
            <XAxis
              type="number"
              tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
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
              cursor={{ fill: 'var(--bg-card)', opacity: 0.5 }}
            />
            <Bar
              dataKey="count"
              radius={[0, 6, 6, 0]}
              maxBarSize={24}
            >
              {data.map((entry, index) => (
                <Cell key={entry.reason} fill={getBarFill(index)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary row */}
      <div
        style={{
          marginTop: 16,
          paddingTop: 16,
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: 'var(--text-tertiary)',
          }}
        >
          Top motivo
        </span>
        {data.length > 0 && (
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            {data[0].label} ({Math.round((data[0].count / total) * 100)}%)
          </span>
        )}
      </div>
    </div>
  )
}
