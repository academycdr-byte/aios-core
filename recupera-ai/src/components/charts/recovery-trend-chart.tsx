'use client'

import { useEffect, useRef, useState } from 'react'
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

interface RecoveryTrendChartProps {
  data: DailyMetric[]
}

/** Resolve a CSS custom property from :root */
function resolveCssVar(varName: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim()
  return value || fallback
}

export function RecoveryTrendChart({ data }: RecoveryTrendChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [tokens, setTokens] = useState({
    chart100: 'rgba(168, 214, 0, 0.08)',
    chart200: 'rgba(168, 214, 0, 0.20)',
    chart400: 'rgba(168, 214, 0, 0.75)',
    chart500: '#A8D600',
    border: '#222228',
    textTertiary: '#71717A',
    textSecondary: '#A1A1AA',
    bgCard: '#0F0F12',
  })

  useEffect(() => {
    setTokens({
      chart100: resolveCssVar('--chart-100', 'rgba(168, 214, 0, 0.08)'),
      chart200: resolveCssVar('--chart-200', 'rgba(168, 214, 0, 0.20)'),
      chart400: resolveCssVar('--chart-400', 'rgba(168, 214, 0, 0.75)'),
      chart500: resolveCssVar('--chart-500', '#A8D600'),
      border: resolveCssVar('--border', '#222228'),
      textTertiary: resolveCssVar('--text-tertiary', '#71717A'),
      textSecondary: resolveCssVar('--text-secondary', '#A1A1AA'),
      bgCard: resolveCssVar('--bg-card', '#0F0F12'),
    })
  }, [])

  return (
    <div
      ref={containerRef}
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
        Abandonos vs Recuperações (30 dias)
      </h3>

      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="gradientRecovered" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={tokens.chart100} stopOpacity={1} />
                <stop offset="100%" stopColor={tokens.chart100} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradientAbandoned" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={tokens.chart100} stopOpacity={1} />
                <stop offset="100%" stopColor={tokens.chart100} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="4 4"
              stroke={tokens.border}
              vertical={false}
            />

            <XAxis
              dataKey="dateLabel"
              tick={{ fill: tokens.textTertiary, fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />

            <YAxis
              tick={{ fill: tokens.textTertiary, fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />

            <Tooltip content={<ChartTooltip />} />

            <Legend
              wrapperStyle={{ paddingTop: 12 }}
              iconType="circle"
              iconSize={8}
              formatter={(value: string) => (
                <span
                  style={{
                    color: tokens.textSecondary,
                    fontSize: '13px',
                  }}
                >
                  {value}
                </span>
              )}
            />

            <Area
              type="monotone"
              dataKey="abandonedCount"
              name="Abandonos"
              stroke={tokens.chart200}
              strokeWidth={2}
              fill="url(#gradientAbandoned)"
              dot={false}
              activeDot={{
                r: 6,
                fill: tokens.chart500,
                stroke: tokens.bgCard,
                strokeWidth: 2,
              }}
            />

            <Area
              type="monotone"
              dataKey="recoveredCount"
              name="Recuperados"
              stroke={tokens.chart400}
              strokeWidth={2}
              fill="url(#gradientRecovered)"
              dot={false}
              activeDot={{
                r: 6,
                fill: tokens.chart500,
                stroke: tokens.bgCard,
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
