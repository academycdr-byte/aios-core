'use client'

import type { LucideIcon } from 'lucide-react'

export interface KpiCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: string // kept for backward compat but IGNORED — all accent
}

export function KpiCard({ title, value, subtitle, icon: Icon, trend }: KpiCardProps) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        padding: '28px',
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <p
            className="text-[16px] font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            {title}
          </p>

          {/* KPI Value — 48px bold */}
          <p
            className="mt-3 text-[48px] font-bold leading-none"
            style={{
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {value}
          </p>

          {/* Trend + Subtitle */}
          <div className="mt-3 flex items-center gap-2">
            {trend && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[14px] font-semibold"
                style={{
                  borderRadius: '6px',
                  background: trend.isPositive
                    ? 'var(--success-surface)'
                    : 'var(--danger-surface)',
                  color: trend.isPositive
                    ? 'var(--success)'
                    : 'var(--danger)',
                }}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
            )}

            {subtitle && (
              <span
                className="text-[14px]"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {subtitle}
              </span>
            )}
          </div>
        </div>

        {/* Icon — ALL accent, rounded-square 44px */}
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center"
          style={{
            background: 'var(--accent-surface)',
            borderRadius: '12px',
          }}
        >
          <Icon
            className="h-5 w-5"
            style={{ color: 'var(--accent)' }}
          />
        </div>
      </div>
    </div>
  )
}
