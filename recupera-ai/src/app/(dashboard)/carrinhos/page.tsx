'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import Link from 'next/link'
import {
  ShoppingCart,
  Search,
  MessageSquare,
  Clock,
  DollarSign,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency, formatRelativeTime } from '@/lib/format'
import type { AbandonedCart, Store } from '@/types'

// ============================================================
// STATUS CONFIG
// ============================================================

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Pendente', color: 'text-text-secondary', bg: 'bg-surface-active' },
  CONTACTING: { label: 'Contatando', color: 'text-info', bg: 'bg-info-light' },
  RECOVERED: { label: 'Recuperado', color: 'text-success', bg: 'bg-success-light' },
  PAID: { label: 'Pago', color: 'text-accent', bg: 'bg-accent-light' },
  LOST: { label: 'Perdido', color: 'text-error', bg: 'bg-error-light' },
  EXPIRED: { label: 'Expirado', color: 'text-text-tertiary', bg: 'bg-surface-active' },
}

const TYPE_CONFIG: Record<string, { label: string; short: string }> = {
  ABANDONED_CART: { label: 'Carrinho Abandonado', short: 'Carrinho' },
  PIX_PENDING: { label: 'PIX Pendente', short: 'PIX' },
  CARD_DECLINED: { label: 'Cartao Recusado', short: 'Cartao' },
}

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'Todos' },
  { value: 'PENDING', label: 'Pendente' },
  { value: 'CONTACTING', label: 'Contatando' },
  { value: 'RECOVERED', label: 'Recuperado' },
  { value: 'PAID', label: 'Pago' },
  { value: 'LOST', label: 'Perdido' },
]

const TYPE_FILTERS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'Todos os tipos' },
  { value: 'ABANDONED_CART', label: 'Carrinho Abandonado' },
  { value: 'PIX_PENDING', label: 'PIX Pendente' },
  { value: 'CARD_DECLINED', label: 'Cartao Recusado' },
]

const PERIOD_FILTERS: { value: string; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: 'all', label: 'Tudo' },
]

const ITEMS_PER_PAGE = 10

// ============================================================
// PAGE
// ============================================================

export default function CarrinhosPage() {
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [storeFilter, setStoreFilter] = useState<string>('ALL')
  const [periodFilter, setPeriodFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Data state
  const [carts, setCarts] = useState<AbandonedCart[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  // Fetch stores for filter dropdown
  useEffect(() => {
    fetch('/api/stores')
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setStores(json.data)
      })
      .catch(() => { /* silently ignore */ })
  }, [])

  // Fetch carts from API
  useEffect(() => {
    const params = new URLSearchParams()
    if (statusFilter !== 'ALL') params.set('status', statusFilter)
    if (typeFilter !== 'ALL') params.set('type', typeFilter)
    if (storeFilter !== 'ALL') params.set('storeId', storeFilter)
    if (periodFilter !== 'all') params.set('period', periodFilter)
    if (search.trim()) params.set('search', search.trim())
    params.set('page', String(currentPage))
    params.set('limit', String(ITEMS_PER_PAGE))

    const controller = new AbortController()
    let cancelled = false

    fetch(`/api/carts?${params.toString()}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) {
          setCarts(json.data ?? [])
          setTotal(json.total ?? 0)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCarts([])
          setTotal(0)
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [statusFilter, typeFilter, storeFilter, periodFilter, search, currentPage])

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)

  // Stats computed from current page data (approximate)
  const stats = useMemo(() => {
    const totalValue = carts.reduce((sum, c) => sum + c.cartTotal, 0)
    const recovered = carts.filter(
      (c) => c.status === 'RECOVERED' || c.status === 'PAID'
    )
    const recoveryRate =
      carts.length > 0
        ? (recovered.length / carts.length) * 100
        : 0

    return {
      count: total,
      totalValue,
      recoveryRate,
    }
  }, [carts, total])

  // Reset page when filters change
  const handleFilterChange = useCallback(<T,>(setter: (v: T) => void, value: T) => {
    setter(value)
    setCurrentPage(1)
  }, [])

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-semibold text-text-primary">
          Carrinhos Abandonados
        </h2>
        <p className="mt-1 text-text-secondary">
          Acompanhe e recupere vendas perdidas automaticamente.
        </p>
      </div>

      {/* Stats Banner */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
          <div className="rounded-[var(--radius-md)] bg-warning-light p-2.5">
            <ShoppingCart className="h-5 w-5 text-warning" />
          </div>
          <div>
            <p className="text-sm text-text-secondary">Carrinhos no periodo</p>
            <p className="text-xl font-semibold text-text-primary">
              {stats.count}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
          <div className="rounded-[var(--radius-md)] bg-error-light p-2.5">
            <DollarSign className="h-5 w-5 text-error" />
          </div>
          <div>
            <p className="text-sm text-text-secondary">Valor total</p>
            <p className="text-xl font-semibold text-text-primary">
              {formatCurrency(stats.totalValue)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
          <div className="rounded-[var(--radius-md)] bg-success-light p-2.5">
            <TrendingUp className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="text-sm text-text-secondary">Recuperados</p>
            <p className="text-xl font-semibold text-text-primary">
              {stats.recoveryRate.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status tabs */}
        <div className="flex gap-1 rounded-[var(--radius-md)] bg-surface p-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => handleFilterChange(setStatusFilter, f.value)}
              className={cn(
                'rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-medium transition-colors',
                statusFilter === f.value
                  ? 'bg-accent text-text-inverse'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Type select */}
        <select
          value={typeFilter}
          onChange={(e) =>
            handleFilterChange(setTypeFilter, e.target.value)
          }
          className="rounded-[var(--radius-md)] border border-border bg-surface px-3 py-1.5 text-sm text-text-primary"
        >
          {TYPE_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>

        {/* Store select */}
        <select
          value={storeFilter}
          onChange={(e) =>
            handleFilterChange(setStoreFilter, e.target.value)
          }
          className="rounded-[var(--radius-md)] border border-border bg-surface px-3 py-1.5 text-sm text-text-primary"
        >
          <option value="ALL">Todas as lojas</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        {/* Period select */}
        <select
          value={periodFilter}
          onChange={(e) =>
            handleFilterChange(setPeriodFilter, e.target.value)
          }
          className="rounded-[var(--radius-md)] border border-border bg-surface px-3 py-1.5 text-sm text-text-primary"
        >
          {PERIOD_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>

        {/* Search */}
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            placeholder="Buscar nome ou telefone..."
            value={search}
            onChange={(e) => handleFilterChange(setSearch, e.target.value)}
            className="rounded-[var(--radius-md)] border border-border bg-surface py-1.5 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-tertiary"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg-tertiary">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-tertiary">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-tertiary">
                  Loja
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-tertiary">
                  Valor
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-text-tertiary">
                  Itens
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-tertiary">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-tertiary">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-text-tertiary">
                  Tentativas
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-tertiary">
                  Tempo
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-tertiary">
                  Acoes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-12 text-center"
                  >
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-accent" />
                    <p className="mt-2 text-sm text-text-tertiary">Carregando carrinhos...</p>
                  </td>
                </tr>
              ) : (
                <>
                  {carts.map((cart) => {
                    const statusCfg = STATUS_CONFIG[cart.status] ?? STATUS_CONFIG.PENDING
                    const typeCfg = TYPE_CONFIG[cart.type] ?? TYPE_CONFIG.ABANDONED_CART

                    return (
                      <tr
                        key={cart.id}
                        className="transition-colors hover:bg-surface-hover"
                      >
                        {/* Cliente */}
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-text-primary">
                              {cart.customerName ?? 'Desconhecido'}
                            </p>
                            <p className="text-xs text-text-tertiary">
                              {cart.customerPhone ?? '-'}
                            </p>
                          </div>
                        </td>

                        {/* Loja */}
                        <td className="px-4 py-3">
                          <p className="text-sm text-text-secondary">
                            {cart.storeName ?? '-'}
                          </p>
                        </td>

                        {/* Valor */}
                        <td className="px-4 py-3 text-right">
                          <p className="text-sm font-medium text-text-primary">
                            {formatCurrency(cart.cartTotal)}
                          </p>
                        </td>

                        {/* Itens */}
                        <td className="px-4 py-3 text-center">
                          <p className="text-sm text-text-secondary">
                            {cart.itemCount}
                          </p>
                        </td>

                        {/* Tipo */}
                        <td className="px-4 py-3">
                          <span className="text-xs text-text-secondary">
                            {typeCfg.short}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-[var(--radius-full)] px-2.5 py-0.5 text-xs font-medium',
                              statusCfg.bg,
                              statusCfg.color
                            )}
                          >
                            {statusCfg.label}
                          </span>
                        </td>

                        {/* Tentativas */}
                        <td className="px-4 py-3 text-center">
                          <p className="text-sm text-text-secondary">
                            {cart.recoveryAttempts}
                          </p>
                        </td>

                        {/* Tempo */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
                            <Clock className="h-3.5 w-3.5" />
                            {formatRelativeTime(new Date(cart.abandonedAt))}
                          </div>
                        </td>

                        {/* Acoes */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {cart.conversationId && (
                              <Link
                                href={`/conversas?id=${cart.conversationId}`}
                                className="inline-flex items-center gap-1 rounded-[var(--radius-md)] bg-accent-light px-2.5 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent hover:text-text-inverse"
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                                Conversa
                              </Link>
                            )}
                            {cart.checkoutUrl && (
                              <a
                                href={cart.checkoutUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center rounded-[var(--radius-md)] p-1 text-text-tertiary transition-colors hover:bg-surface-active hover:text-text-primary"
                                title="Abrir checkout"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {carts.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-12 text-center text-sm text-text-tertiary"
                      >
                        Nenhum carrinho encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-sm text-text-tertiary">
              Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} a{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, total)} de{' '}
              {total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-[var(--radius-md)] p-1.5 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-primary disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      'rounded-[var(--radius-md)] px-3 py-1 text-sm font-medium transition-colors',
                      page === currentPage
                        ? 'bg-accent text-text-inverse'
                        : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                    )}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="rounded-[var(--radius-md)] p-1.5 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-primary disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
