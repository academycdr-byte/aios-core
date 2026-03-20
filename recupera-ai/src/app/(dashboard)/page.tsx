'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  ShoppingCart,
  TrendingUp,
  Target,
  CheckCircle,
  DollarSign,
  MessageSquare,
  Reply,
  Eye,
  MousePointerClick,
  Calendar,
} from 'lucide-react'
import { KpiCard } from '@/components/kpi-card'
import { RecoveryTrendChart } from '@/components/charts/recovery-trend-chart'
import { ValueComparisonChart } from '@/components/charts/value-comparison-chart'
import { TypeDistributionChart } from '@/components/charts/type-distribution-chart'
import { AbandonmentReasonsChart } from '@/components/charts/abandonment-reasons-chart'
import { StepFunnelChart } from '@/components/charts/step-funnel-chart'
import { StepMetricsCard } from '@/components/step-metrics-card'
import { RecentCartsTable } from '@/components/recent-carts-table'
import { PageSpinner } from '@/components/ui'
import {
  formatCurrencyShort,
  formatPercent,
  formatNumber,
  formatCurrency,
  formatDateChart,
} from '@/lib/format'
import { cn } from '@/lib/utils'
import type { StepMetric } from '@/types/charts'

interface DashboardData {
  totalAbandoned: number
  totalAbandonedValue: number
  totalContacted: number
  totalRecovered: number
  totalRecoveredValue: number
  totalPaid: number
  totalPaidValue: number
  recoveryRate: number
  avgTicket: number
  totalConversations: number
  avgMessagesPerConv: number
  totalAiCost: number
  responseRate: number
  openRate: number
  clickRate: number
  costPerRecovery: number
  dailyMetrics: DailyMetricRow[]
}

interface DailyMetricRow {
  date: string
  abandonedCount: number
  abandonedValue: number
  contactedCount: number
  recoveredCount: number
  recoveredValue: number
  paidCount: number
  paidValue: number
  recoveryRate: number
  totalConversations: number
}

interface ReasonData {
  reason: string
  label: string
  count: number
  color: string
}

interface RecentCartData {
  id: string
  customerName: string
  customerPhone: string
  cartTotal: number
  cartItems: { name: string; quantity: number; price: number }[]
  itemCount: number
  type: 'ABANDONED_CART' | 'PIX_PENDING' | 'CARD_DECLINED'
  status: 'PENDING' | 'CONTACTING' | 'RECOVERED' | 'PAID' | 'LOST' | 'EXPIRED'
  abandonedAt: Date
  recoveryAttempts: number
}

type PeriodTab = '7d' | '30d' | '90d' | 'custom'

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [reasons, setReasons] = useState<ReasonData[]>([])
  const [recentCarts, setRecentCarts] = useState<RecentCartData[]>([])
  const [stepMetrics, setStepMetrics] = useState<StepMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<PeriodTab>('30d')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      let dashUrl = '/api/dashboard'
      if (period === 'custom' && startDate && endDate) {
        dashUrl += `?startDate=${startDate}&endDate=${endDate}`
      } else if (period !== 'custom') {
        dashUrl += `?period=${period}`
      }

      let stepMetricsUrl = '/api/dashboard/step-metrics'
      if (period === 'custom' && startDate && endDate) {
        stepMetricsUrl += `?startDate=${startDate}&endDate=${endDate}`
      } else if (period !== 'custom') {
        stepMetricsUrl += `?period=${period}`
      }

      const [dashRes, reasonsRes, cartsRes, stepMetricsRes] = await Promise.all([
        fetch(dashUrl),
        fetch('/api/dashboard/reasons'),
        fetch('/api/carts?limit=10&period=7d'),
        fetch(stepMetricsUrl),
      ])

      if (dashRes.ok) {
        const dashJson = await dashRes.json()
        setData(dashJson.data)
      }

      if (reasonsRes.ok) {
        const reasonsJson = await reasonsRes.json()
        setReasons(reasonsJson.data ?? [])
      }

      if (cartsRes.ok) {
        const cartsJson = await cartsRes.json()
        setRecentCarts(
          (cartsJson.data ?? []).map((c: RecentCartData & { abandonedAt: string }) => ({
            ...c,
            abandonedAt: new Date(c.abandonedAt),
          }))
        )
      }

      if (stepMetricsRes.ok) {
        const stepMetricsJson = await stepMetricsRes.json()
        setStepMetrics(stepMetricsJson.data ?? [])
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [period, startDate, endDate])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const periodLabel = period === '7d'
    ? 'últimos 7 dias'
    : period === '30d'
      ? 'últimos 30 dias'
      : period === '90d'
        ? 'últimos 90 dias'
        : startDate && endDate
          ? `${startDate} a ${endDate}`
          : 'período personalizado'

  if (loading && !data) {
    return <PageSpinner message="Carregando dashboard..." />
  }

  // Format daily metrics for charts
  const chartMetrics = (data?.dailyMetrics ?? []).map((m) => ({
    ...m,
    dateLabel: formatDateChart(new Date(m.date)),
  }))

  // Build type distribution from cart data
  const typeDistribution = [
    { name: 'Carrinho Abandonado', value: data?.totalAbandonedValue ?? 0, count: data?.totalAbandoned ?? 0, color: '#F59E0B' },
    { name: 'Recuperado', value: data?.totalRecoveredValue ?? 0, count: data?.totalRecovered ?? 0, color: '#10B981' },
    { name: 'Pago', value: data?.totalPaidValue ?? 0, count: data?.totalPaid ?? 0, color: '#3B82F6' },
  ]

  const activeConversations = data?.totalConversations ?? 0

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Page Header + Date Picker */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl lg:text-3xl font-semibold text-text-primary">
            Dashboard
          </h2>
          <p className="mt-1 text-text-secondary">
            Visão geral da recuperação — {periodLabel}
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {(['7d', '30d', '90d'] as PeriodTab[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={cn(
                'rounded-[var(--radius-md)] border px-3 py-1.5 text-xs font-medium transition-colors',
                period === p
                  ? 'border-accent bg-accent/10 text-accent font-semibold'
                  : 'border-border bg-surface text-text-secondary hover:bg-surface-hover'
              )}
            >
              {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : '90 dias'}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPeriod('custom')}
            className={cn(
              'flex items-center gap-1 rounded-[var(--radius-md)] border px-3 py-1.5 text-xs font-medium transition-colors',
              period === 'custom'
                ? 'border-accent bg-accent/10 text-accent font-semibold'
                : 'border-border bg-surface text-text-secondary hover:bg-surface-hover'
            )}
          >
            <Calendar className="h-3 w-3" />
            Personalizado
          </button>

          {period === 'custom' && (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-[var(--radius-md)] border border-border bg-surface px-2 py-1.5 text-xs text-text-primary"
              />
              <span className="text-xs text-text-tertiary">até</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-[var(--radius-md)] border border-border bg-surface px-2 py-1.5 text-xs text-text-primary"
              />
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards Grid — Row 1: Core Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="Valor Abandonado"
          value={formatCurrencyShort(data?.totalAbandonedValue ?? 0)}
          subtitle={periodLabel}
          icon={ShoppingCart}
          color="yellow"
        />
        <KpiCard
          title="Valor Recuperado"
          value={formatCurrencyShort(data?.totalRecoveredValue ?? 0)}
          subtitle={periodLabel}
          icon={TrendingUp}
          color="green"
        />
        <KpiCard
          title="Taxa de Recuperação"
          value={formatPercent(data?.recoveryRate ?? 0)}
          subtitle="média do período"
          icon={Target}
          color="blue"
        />
        <KpiCard
          title="Pedidos Pagos"
          value={formatNumber(data?.totalPaid ?? 0)}
          subtitle={formatCurrencyShort(data?.totalPaidValue ?? 0)}
          icon={CheckCircle}
          color="green"
        />
        <KpiCard
          title="Ticket Médio"
          value={formatCurrency(data?.avgTicket ?? 0)}
          subtitle="por recuperação"
          icon={DollarSign}
          color="emerald"
        />
        <KpiCard
          title="Conversas"
          value={String(activeConversations)}
          subtitle={`custo/rec: ${formatCurrency(data?.costPerRecovery ?? 0)}`}
          icon={MessageSquare}
          color="blue"
        />
      </div>

      {/* KPI Cards Grid — Row 2: Engagement Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          title="Taxa de Resposta"
          value={formatPercent(data?.responseRate ?? 0)}
          subtitle="mensagens respondidas"
          icon={Reply}
          color="purple"
        />
        <KpiCard
          title="Taxa de Abertura"
          value={formatPercent(data?.openRate ?? 0)}
          subtitle="mensagens lidas"
          icon={Eye}
          color="blue"
        />
        <KpiCard
          title="Taxa de Cliques"
          value={formatPercent(data?.clickRate ?? 0)}
          subtitle="cliques em links"
          icon={MousePointerClick}
          color="emerald"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <RecoveryTrendChart data={chartMetrics} />
        <ValueComparisonChart data={chartMetrics} />
      </div>

      {/* Distribution + Reasons */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <TypeDistributionChart data={typeDistribution} />
        <AbandonmentReasonsChart data={reasons} />
      </div>

      {/* Step Metrics Section */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <StepMetricsCard data={stepMetrics} loading={loading} />
        <StepFunnelChart data={stepMetrics} />
      </div>

      {/* Recent Carts Table */}
      <RecentCartsTable carts={recentCarts} limit={10} />
    </div>
  )
}
