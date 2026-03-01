'use client'

import { useEffect, useState } from 'react'
import {
  ShoppingCart,
  TrendingUp,
  Target,
  CheckCircle,
  DollarSign,
  MessageSquare,
  Loader2,
} from 'lucide-react'
import { KpiCard } from '@/components/kpi-card'
import { RecoveryTrendChart } from '@/components/charts/recovery-trend-chart'
import { ValueComparisonChart } from '@/components/charts/value-comparison-chart'
import { TypeDistributionChart } from '@/components/charts/type-distribution-chart'
import { AbandonmentReasonsChart } from '@/components/charts/abandonment-reasons-chart'
import { RecentCartsTable } from '@/components/recent-carts-table'
import {
  formatCurrencyShort,
  formatPercent,
  formatNumber,
  formatCurrency,
  formatDateChart,
} from '@/lib/format'

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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [reasons, setReasons] = useState<ReasonData[]>([])
  const [recentCarts, setRecentCarts] = useState<RecentCartData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashRes, reasonsRes, cartsRes] = await Promise.all([
          fetch('/api/dashboard?period=30d'),
          fetch('/api/dashboard/reasons'),
          fetch('/api/carts?limit=10&period=7d'),
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
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-text-secondary" />
      </div>
    )
  }

  // Format daily metrics for charts
  const chartMetrics = (data?.dailyMetrics ?? []).map((m) => ({
    ...m,
    dateLabel: formatDateChart(new Date(m.date)),
  }))

  // Build type distribution from cart data (aggregate from daily metrics)
  const typeDistribution = [
    { name: 'Carrinho Abandonado', value: data?.totalAbandonedValue ?? 0, count: data?.totalAbandoned ?? 0, color: '#F59E0B' },
    { name: 'Recuperado', value: data?.totalRecoveredValue ?? 0, count: data?.totalRecovered ?? 0, color: '#10B981' },
    { name: 'Pago', value: data?.totalPaidValue ?? 0, count: data?.totalPaid ?? 0, color: '#3B82F6' },
  ]

  // Active conversations (from current totals)
  const activeConversations = data?.totalConversations ?? 0

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-semibold text-text-primary">
          Dashboard
        </h2>
        <p className="mt-1 text-text-secondary">
          Visao geral da recuperacao de carrinhos nos ultimos 30 dias
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          title="Valor Abandonado"
          value={formatCurrencyShort(data?.totalAbandonedValue ?? 0)}
          subtitle="ultimos 30 dias"
          icon={ShoppingCart}
          color="yellow"
        />
        <KpiCard
          title="Valor Recuperado"
          value={formatCurrencyShort(data?.totalRecoveredValue ?? 0)}
          subtitle="ultimos 30 dias"
          icon={TrendingUp}
          color="green"
        />
        <KpiCard
          title="Taxa de Recuperacao"
          value={formatPercent(data?.recoveryRate ?? 0)}
          subtitle="media do periodo"
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
          title="Ticket Medio"
          value={formatCurrency(data?.avgTicket ?? 0)}
          subtitle="por recuperacao"
          icon={DollarSign}
          color="emerald"
        />
        <KpiCard
          title="Conversas Ativas"
          value={String(activeConversations)}
          subtitle="no periodo"
          icon={MessageSquare}
          color="blue"
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

      {/* Recent Carts Table */}
      <RecentCartsTable carts={recentCarts} limit={10} />
    </div>
  )
}
