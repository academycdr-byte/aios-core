'use client'

import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

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

const colorConfig: Record<KpiCardProps['color'], {
  border: string
  gradient: string
  iconBg: string
  iconColor: string
  iconRing: string
}> = {
  yellow: {
    border: '#F59E0B',
    gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.06) 0%, transparent 60%)',
    iconBg: 'rgba(245, 158, 11, 0.12)',
    iconColor: '#F59E0B',
    iconRing: 'rgba(245, 158, 11, 0.06)',
  },
  green: {
    border: '#10B981',
    gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, transparent 60%)',
    iconBg: 'rgba(16, 185, 129, 0.12)',
    iconColor: '#10B981',
    iconRing: 'rgba(16, 185, 129, 0.06)',
  },
  blue: {
    border: '#3B82F6',
    gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.06) 0%, transparent 60%)',
    iconBg: 'rgba(59, 130, 246, 0.12)',
    iconColor: '#3B82F6',
    iconRing: 'rgba(59, 130, 246, 0.06)',
  },
  emerald: {
    border: '#059669',
    gradient: 'linear-gradient(135deg, rgba(5, 150, 105, 0.06) 0%, transparent 60%)',
    iconBg: 'rgba(5, 150, 105, 0.12)',
    iconColor: '#059669',
    iconRing: 'rgba(5, 150, 105, 0.06)',
  },
  red: {
    border: '#EF4444',
    gradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.06) 0%, transparent 60%)',
    iconBg: 'rgba(239, 68, 68, 0.12)',
    iconColor: '#EF4444',
    iconRing: 'rgba(239, 68, 68, 0.06)',
  },
  purple: {
    border: '#8B5CF6',
    gradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.06) 0%, transparent 60%)',
    iconBg: 'rgba(139, 92, 246, 0.12)',
    iconColor: '#8B5CF6',
    iconRing: 'rgba(139, 92, 246, 0.06)',
  },
}

export function KpiCard({ title, value, subtitle, icon: Icon, trend, color }: KpiCardProps) {
  const config = colorConfig[color]

  return (
    <div
      className={cn(
        'kpi-card-wrapper group relative overflow-hidden rounded-[var(--radius-lg)]',
        'border border-[var(--border)] transition-all duration-200',
        'hover:border-[var(--border-hover)] hover:shadow-[var(--shadow-md)] hover:-translate-y-[1px]'
      )}
      style={{
        background: 'var(--surface)',
        borderLeft: `3px solid ${config.border}`,
      }}
    >
      {/* Subtle gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: config.gradient }}
      />

      <div className="relative p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
              {title}
            </p>

            <p className="mt-2 text-3xl font-bold tracking-tight text-value text-text-primary">
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
                <span className="text-xs text-text-tertiary">
                  {subtitle}
                </span>
              )}
            </div>
          </div>

          {/* Icon with ring effect */}
          <div
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105"
            style={{
              background: config.iconBg,
              boxShadow: `0 0 0 4px ${config.iconRing}`,
            }}
          >
            <Icon className="h-5 w-5" style={{ color: config.iconColor }} />
          </div>
        </div>
      </div>
    </div>
  )
}
