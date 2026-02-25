'use client'

import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'

export interface KpiCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  color: 'yellow' | 'green' | 'blue' | 'emerald' | 'red' | 'purple'
}

const colorMap: Record<KpiCardProps['color'], { bg: string; text: string; iconBg: string }> = {
  yellow: {
    bg: 'rgba(245, 158, 11, 0.10)',
    text: '#F59E0B',
    iconBg: 'rgba(245, 158, 11, 0.15)',
  },
  green: {
    bg: 'rgba(16, 185, 129, 0.10)',
    text: '#10B981',
    iconBg: 'rgba(16, 185, 129, 0.15)',
  },
  blue: {
    bg: 'rgba(59, 130, 246, 0.10)',
    text: '#3B82F6',
    iconBg: 'rgba(59, 130, 246, 0.15)',
  },
  emerald: {
    bg: 'rgba(5, 150, 105, 0.10)',
    text: '#059669',
    iconBg: 'rgba(5, 150, 105, 0.15)',
  },
  red: {
    bg: 'rgba(239, 68, 68, 0.10)',
    text: '#EF4444',
    iconBg: 'rgba(239, 68, 68, 0.15)',
  },
  purple: {
    bg: 'rgba(139, 92, 246, 0.10)',
    text: '#8B5CF6',
    iconBg: 'rgba(139, 92, 246, 0.15)',
  },
}

export function KpiCard({ title, value, subtitle, icon: Icon, trend, color }: KpiCardProps) {
  const colors = colorMap[color]

  return (
    <div
      className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] p-5 transition-all hover:border-[var(--border-hover)]"
      style={{ background: 'var(--surface)' }}
    >
      {/* Background accent glow */}
      <div
        className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-30 blur-2xl"
        style={{ background: colors.text }}
      />

      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p
            className="text-xs font-medium uppercase tracking-wider"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {title}
          </p>

          <p
            className="mt-2 text-2xl font-bold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            {value}
          </p>

          <div className="mt-2 flex items-center gap-2">
            {trend && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                style={{
                  background: trend.isPositive
                    ? 'rgba(16, 185, 129, 0.12)'
                    : 'rgba(239, 68, 68, 0.12)',
                  color: trend.isPositive ? '#10B981' : '#EF4444',
                }}
              >
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {trend.value}%
              </span>
            )}

            {subtitle && (
              <span
                className="text-xs"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {subtitle}
              </span>
            )}
          </div>
        </div>

        {/* Icon */}
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)]"
          style={{ background: colors.iconBg }}
        >
          <Icon className="h-5 w-5" style={{ color: colors.text }} />
        </div>
      </div>
    </div>
  )
}
