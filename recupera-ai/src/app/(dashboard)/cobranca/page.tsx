'use client'

import { useState, useEffect } from 'react'
import {
  Receipt,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  DollarSign,
  ShoppingCart,
  Percent,
  XCircle,
} from 'lucide-react'
import { Badge, Button, Spinner } from '@/components/ui'
import { cn } from '@/lib/utils'

// ============================================================
// TYPES
// ============================================================

interface Invoice {
  id: string
  periodStart: string
  periodEnd: string
  recoveredValue: number
  commissionRate: number
  amount: number
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  dueDate: string
  paidAt: string | null
  abacateCheckoutUrl: string | null
  paymentMethod: string | null
  createdAt: string
}

interface CurrentMonth {
  periodStart: string
  periodEnd: string
  recoveredValue: number
  estimatedCommission: number
  recoveredCount: number
}

interface BillingData {
  invoices: Invoice[]
  currentMonth: CurrentMonth
  billingActive: boolean
}

// ============================================================
// HELPERS
// ============================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatMonth(dateStr: string): string {
  const date = new Date(dateStr)
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ]
  return `${months[date.getMonth()]}/${date.getFullYear()}`
}

function getStatusConfig(status: Invoice['status']) {
  switch (status) {
    case 'PAID':
      return { label: 'Pago', variant: 'success' as const, icon: CheckCircle }
    case 'PENDING':
      return { label: 'Pendente', variant: 'warning' as const, icon: Clock }
    case 'OVERDUE':
      return { label: 'Atrasado', variant: 'danger' as const, icon: AlertTriangle }
    case 'CANCELLED':
      return { label: 'Cancelado', variant: 'default' as const, icon: XCircle }
  }
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchBilling() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/billing/invoices')
      if (!res.ok) throw new Error('Erro ao carregar dados de cobrança')
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBilling()
  }, [])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <AlertTriangle className="h-12 w-12 text-text-tertiary" />
        <p className="text-text-secondary">{error}</p>
        <Button onClick={fetchBilling} variant="secondary" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Tentar Novamente
        </Button>
      </div>
    )
  }

  if (!data) return null

  const { invoices, currentMonth, billingActive } = data

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[30px] font-bold text-text-primary" style={{ letterSpacing: '-0.02em' }}>Cobrança</h1>
          <p className="text-[14px] text-text-tertiary">
            Comissão de 10% sobre o valor dos carrinhos recuperados
          </p>
        </div>
        <Button onClick={fetchBilling} variant="ghost" size="sm">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Billing Status Banner */}
      {!billingActive && (
        <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border-2 border-red-500/30 bg-red-500/10 p-4">
          <AlertTriangle className="h-6 w-6 shrink-0 text-red-500" />
          <div>
            <p className="font-semibold text-red-400">Serviço Suspenso</p>
            <p className="text-sm text-red-300/80">
              Você possui uma fatura em atraso. A IA de recuperação está pausada
              e não está enviando mensagens. Pague a fatura pendente para reativar.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards — Current Month */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          icon={ShoppingCart}
          label="Recuperados Este Mês"
          value={currentMonth.recoveredCount.toString()}
          accent="emerald"
        />
        <KpiCard
          icon={DollarSign}
          label="Valor Recuperado"
          value={formatCurrency(currentMonth.recoveredValue)}
          accent="blue"
        />
        <KpiCard
          icon={Percent}
          label="Comissão Estimada"
          value={formatCurrency(currentMonth.estimatedCommission)}
          subtitle="10% do valor recuperado"
          accent="violet"
        />
      </div>

      {/* How it works */}
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
          <Receipt className="h-4 w-4 text-accent" />
          Como Funciona
        </h3>
        <div className="grid grid-cols-1 gap-3 text-sm text-text-secondary sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">1</span>
            <span>A IA recupera carrinhos durante o mês</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">2</span>
            <span>No dia 1º, calculamos 10% do total recuperado</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">3</span>
            <span>Você recebe a fatura com link de pagamento via PIX</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">4</span>
            <span>Pagou? Tudo certo. Não pagou em 6 dias? IA pausa</span>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="rounded-[var(--radius-lg)] border border-border bg-bg-secondary">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <TrendingUp className="h-4 w-4 text-accent" />
            Histórico de Faturas
          </h3>
          <Badge variant="neutral">
            {invoices.length} fatura{invoices.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Receipt className="mb-3 h-10 w-10 text-text-tertiary" />
            <p className="text-sm font-medium text-text-secondary">Nenhuma fatura ainda</p>
            <p className="mt-1 text-xs text-text-tertiary">
              A primeira fatura será gerada no dia 1º do próximo mês
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-text-tertiary">
                  <th className="px-5 py-3 font-medium">Período</th>
                  <th className="px-5 py-3 font-medium">Recuperado</th>
                  <th className="px-5 py-3 font-medium">Comissão</th>
                  <th className="px-5 py-3 font-medium">Vencimento</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => {
                  const statusConfig = getStatusConfig(invoice.status)
                  const StatusIcon = statusConfig.icon
                  return (
                    <tr
                      key={invoice.id}
                      className="border-b border-border/50 last:border-0 hover:bg-surface-hover/50"
                    >
                      <td className="px-5 py-3.5 font-medium text-text-primary">
                        {formatMonth(invoice.periodStart)}
                      </td>
                      <td className="px-5 py-3.5 text-text-secondary">
                        {formatCurrency(invoice.recoveredValue)}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-text-primary">
                        {formatCurrency(invoice.amount)}
                      </td>
                      <td className="px-5 py-3.5 text-text-secondary">
                        {formatDate(invoice.dueDate)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                            invoice.status === 'PAID' && 'bg-emerald-500/15 text-emerald-400',
                            invoice.status === 'PENDING' && 'bg-amber-500/15 text-amber-400',
                            invoice.status === 'OVERDUE' && 'bg-red-500/15 text-red-400',
                            invoice.status === 'CANCELLED' && 'bg-zinc-500/15 text-zinc-400'
                          )}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {invoice.status === 'PAID' && invoice.paidAt && (
                          <span className="text-xs text-text-tertiary">
                            Pago em {formatDate(invoice.paidAt)}
                          </span>
                        )}
                        {(invoice.status === 'PENDING' || invoice.status === 'OVERDUE') &&
                          invoice.abacateCheckoutUrl && (
                            <a
                              href={invoice.abacateCheckoutUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-accent px-3 py-1.5 text-xs font-medium text-text-inverse transition-opacity hover:opacity-90"
                            >
                              Pagar
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// KPI CARD
// ============================================================

function KpiCard({
  icon: Icon,
  label,
  value,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  subtitle?: string
  accent?: string
}) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        padding: '24px',
      }}
    >
      <div className="mb-3 flex items-center gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center"
          style={{
            background: 'var(--accent-surface)',
            borderRadius: '12px',
          }}
        >
          <div style={{ color: 'var(--accent)' }}><Icon className="h-5 w-5" /></div>
        </div>
        <span className="text-[14px] font-medium" style={{ color: 'var(--text-tertiary)' }}>{label}</span>
      </div>
      <p className="text-[28px] font-bold" style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{value}</p>
      {subtitle && (
        <p className="mt-1 text-[13px]" style={{ color: 'var(--text-tertiary)' }}>{subtitle}</p>
      )}
    </div>
  )
}
