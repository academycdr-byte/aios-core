'use client'

import { BarChart3 } from 'lucide-react'
import type { StepMetric } from '@/types/charts'
import { formatCurrency, formatPercent, formatNumber } from '@/lib/format'

interface StepMetricsCardProps {
  data: StepMetric[]
  loading?: boolean
}

function ConversionRateBadge({ rate }: { rate: number }) {
  let bg: string
  let color: string

  if (rate > 10) {
    bg = 'rgba(16, 185, 129, 0.12)'
    color = '#10B981'
  } else if (rate >= 5) {
    bg = 'rgba(245, 158, 11, 0.12)'
    color = '#F59E0B'
  } else {
    bg = 'rgba(239, 68, 68, 0.12)'
    color = '#EF4444'
  }

  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{ background: bg, color }}
    >
      {formatPercent(rate)}
    </span>
  )
}

function SkeletonRow() {
  return (
    <tr
      className="border-b"
      style={{ borderColor: 'var(--border)' }}
    >
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-5 py-3.5">
          <div
            className="h-4 w-16 animate-pulse rounded"
            style={{ background: 'var(--border)' }}
          />
        </td>
      ))}
    </tr>
  )
}

export function StepMetricsCard({ data, loading }: StepMetricsCardProps) {
  const isEmpty = !loading && data.length === 0

  return (
    <div
      className="rounded-[var(--radius-lg)] border border-[var(--border)]"
      style={{ background: 'var(--surface)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-5 py-4">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ background: 'rgba(59, 130, 246, 0.15)' }}
        >
          <BarChart3 className="h-4 w-4" style={{ color: '#3B82F6' }} />
        </div>
        <h3
          className="text-sm font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          Métricas por Etapa
        </h3>
      </div>

      {/* Table */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center px-5 py-12">
          <BarChart3
            className="mb-3 h-10 w-10"
            style={{ color: 'var(--text-tertiary)', opacity: 0.4 }}
          />
          <p
            className="text-sm font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            Nenhuma métrica de etapa disponível
          </p>
          <p
            className="mt-1 text-xs"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Os dados aparecerão quando mensagens forem enviadas
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr
                className="border-b text-left text-xs font-medium uppercase tracking-wider"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--text-tertiary)',
                }}
              >
                <th className="px-5 py-3">Etapa</th>
                <th className="px-5 py-3">Enviadas</th>
                <th className="px-5 py-3">Abertura</th>
                <th className="px-5 py-3">Cliques</th>
                <th className="px-5 py-3">Respostas</th>
                <th className="px-5 py-3">Conversões</th>
                <th className="px-5 py-3 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : (
                data.map((step) => (
                  <tr
                    key={step.stepNumber}
                    className="border-b transition-colors last:border-b-0"
                    style={{ borderColor: 'var(--border)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--surface-hover)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    {/* Etapa */}
                    <td className="px-5 py-3.5">
                      <span
                        className="text-sm font-medium"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {step.stepLabel}
                      </span>
                    </td>

                    {/* Enviadas */}
                    <td className="px-5 py-3.5">
                      <span
                        className="text-sm font-medium"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {formatNumber(step.messagesSent)}
                      </span>
                    </td>

                    {/* Abertura */}
                    <td className="px-5 py-3.5">
                      <div>
                        <span
                          className="text-sm font-medium"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {formatNumber(step.messagesRead)}
                        </span>
                        <p
                          className="mt-0.5 text-xs"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          {formatPercent(step.openRate)}
                        </p>
                      </div>
                    </td>

                    {/* Cliques */}
                    <td className="px-5 py-3.5">
                      <div>
                        <span
                          className="text-sm font-medium"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {formatNumber(step.linkClicks)}
                        </span>
                        <p
                          className="mt-0.5 text-xs"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          {formatPercent(step.clickRate)}
                        </p>
                      </div>
                    </td>

                    {/* Respostas */}
                    <td className="px-5 py-3.5">
                      <div>
                        <span
                          className="text-sm font-medium"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {formatNumber(step.messagesReplied)}
                        </span>
                        <p
                          className="mt-0.5 text-xs"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          {formatPercent(step.responseRate)}
                        </p>
                      </div>
                    </td>

                    {/* Conversões */}
                    <td className="px-5 py-3.5">
                      <div>
                        <span
                          className="text-sm font-medium"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {formatNumber(step.conversions)}
                        </span>
                        <div className="mt-1">
                          <ConversionRateBadge rate={step.conversionRate} />
                        </div>
                      </div>
                    </td>

                    {/* Valor */}
                    <td className="px-5 py-3.5 text-right">
                      <span
                        className="text-sm font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {formatCurrency(step.conversionValue)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
