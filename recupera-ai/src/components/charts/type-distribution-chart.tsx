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

const DONUT_COLORS = ['#A8D600', '#F59E0B', '#F97316']

interface TypeDistributionChartProps {
  data: TypeDistribution[]
}

interface TooltipPayloadItem {
  name: string
  value: number
  payload: TypeDistribution & { fill: string }
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
      style={{
        background: '#1F2937',
        color: '#FFFFFF',
        borderRadius: 8,
        padding: '8px 12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
        <span
          style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: item.payload.fill,
            flexShrink: 0,
          }}
        />
        <span style={{ opacity: 0.7 }}>{item.name}:</span>
        <span style={{ fontWeight: 600 }}>{formatNumber(item.value)}</span>
      </div>
    </div>
  )
}

export function TypeDistributionChart({ data }: TypeDistributionChartProps) {
  const sliced = data.slice(0, 3)
  const total = sliced.reduce((sum, d) => sum + d.value, 0)

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: 28,
        boxShadow: 'none',
      }}
    >
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
        Distribuição por Tipo
      </h3>

      {/* Donut with center text */}
      <div style={{ position: 'relative', width: 220, height: 220, margin: '0 auto' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={sliced}
              cx="50%"
              cy="50%"
              innerRadius="65%"
              outerRadius="90%"
              startAngle={90}
              endAngle={-270}
              paddingAngle={2}
              cornerRadius={4}
              dataKey="value"
              stroke="var(--bg-card)"
              strokeWidth={3}
            >
              {sliced.map((entry, index) => (
                <Cell key={entry.name} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1,
            }}
          >
            {formatNumber(total)}
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 400,
              color: 'var(--text-secondary)',
              marginTop: 4,
            }}
          >
            total
          </div>
        </div>
      </div>

      {/* Legend — horizontal */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginTop: 16,
        }}
      >
        {sliced.map((item, index) => (
          <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                display: 'inline-block',
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: DONUT_COLORS[index % DONUT_COLORS.length],
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 13,
                fontWeight: 400,
                color: 'var(--text-secondary)',
              }}
            >
              {item.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
