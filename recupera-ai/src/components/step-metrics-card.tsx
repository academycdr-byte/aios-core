'use client'

import { BarChart3 } from 'lucide-react'
import type { StepMetric } from '@/types/charts'
import { formatCurrency, formatPercent, formatNumber } from '@/lib/format'

interface StepMetricsCardProps {
  data: StepMetric[]
  loading?: boolean
}

function ConversionRateBadge({ rate }: { rate: number }) {
  const isGood = rate > 10
  const isMedium = rate >= 5

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-[14px] font-semibold"
      style={{
        borderRadius: '6px',
        background: isGood
          ? 'var(--success-surface)'
          : isMedium
            ? 'var(--warning-surface)'
            : 'var(--danger-surface)',
        color: isGood
          ? 'var(--success)'
          : isMedium
            ? 'var(--warning)'
            : 'var(--danger)',
      }}
    >
      {isGood ? '↑' : isMedium ? '→' : '↓'} {formatPercent(rate)}
    </span>
  )
}

function SkeletonRow() {
  return (
    <tr style={{ borderBottom: '1px solid var(--border)' }}>
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div
            className="skeleton h-4 w-16"
            style={{ borderRadius: '6px' }}
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
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-7 py-5"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div
          className="flex h-11 w-11 items-center justify-center"
          style={{
            background: 'var(--accent-surface)',
            borderRadius: '12px',
          }}
        >
          <BarChart3 className="h-5 w-5" style={{ color: 'var(--accent)' }} />
        </div>
        <h3
          className="text-[20px] font-bold"
          style={{
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
          }}
        >
          Métricas por Etapa
        </h3>
      </div>

      {/* Content */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center px-7 py-16">
          <div
            className="mb-4 flex h-16 w-16 items-center justify-center"
            style={{
              background: 'var(--accent-surface)',
              borderRadius: '50%',
            }}
          >
            <BarChart3
              className="h-7 w-7"
              style={{ color: 'var(--accent)' }}
            />
          </div>
          <p
            className="text-[20px] font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            Nenhuma métrica disponível
          </p>
          <p
            className="mt-1 text-[14px]"
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
                style={{
                  background: 'var(--bg-primary)',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <th
                  className="px-4 py-3 text-left text-[13px] font-medium uppercase tracking-wider"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Etapa
                </th>
                <th
                  className="px-4 py-3 text-left text-[13px] font-medium uppercase tracking-wider"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Enviadas
                </th>
                <th
                  className="px-4 py-3 text-left text-[13px] font-medium uppercase tracking-wider"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Abertura
                </th>
                <th
                  className="px-4 py-3 text-left text-[13px] font-medium uppercase tracking-wider"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Cliques
                </th>
                <th
                  className="px-4 py-3 text-left text-[13px] font-medium uppercase tracking-wider"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Respostas
                </th>
                <th
                  className="px-4 py-3 text-left text-[13px] font-medium uppercase tracking-wider"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Conversões
                </th>
                <th
                  className="px-4 py-3 text-right text-[13px] font-medium uppercase tracking-wider"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Valor
                </th>
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
                    className="transition-colors last:border-b-0"
                    style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-hover)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <td className="px-4 py-3">
                      <span
                        className="text-[14px] font-medium"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {step.stepLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-[14px]"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {formatNumber(step.messagesSent)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-[14px]"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {formatNumber(step.messagesRead)}
                      </span>
                      <p
                        className="text-[12px]"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        {formatPercent(step.openRate)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-[14px]"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {formatNumber(step.linkClicks)}
                      </span>
                      <p
                        className="text-[12px]"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        {formatPercent(step.clickRate)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-[14px]"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {formatNumber(step.messagesReplied)}
                      </span>
                      <p
                        className="text-[12px]"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        {formatPercent(step.responseRate)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-[14px]"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {formatNumber(step.conversions)}
                      </span>
                      <div className="mt-1">
                        <ConversionRateBadge rate={step.conversionRate} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className="text-[14px] font-semibold"
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
