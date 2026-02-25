'use client'

import { ShoppingCart, CreditCard, QrCode } from 'lucide-react'
import type { RecentCart } from '@/types/charts'
import type { CartStatus, CartType } from '@/generated/prisma/enums'
import { formatCurrency, formatRelativeTime } from '@/lib/format'

interface RecentCartsTableProps {
  carts: RecentCart[]
  limit?: number
}

// ============================================================
// Status badge configuration
// ============================================================

const statusConfig: Record<CartStatus, { label: string; bg: string; text: string }> = {
  PENDING: {
    label: 'Pendente',
    bg: 'rgba(245, 158, 11, 0.12)',
    text: '#F59E0B',
  },
  CONTACTING: {
    label: 'Contatando',
    bg: 'rgba(59, 130, 246, 0.12)',
    text: '#3B82F6',
  },
  RECOVERED: {
    label: 'Recuperado',
    bg: 'rgba(16, 185, 129, 0.12)',
    text: '#10B981',
  },
  PAID: {
    label: 'Pago',
    bg: 'rgba(5, 150, 105, 0.15)',
    text: '#059669',
  },
  LOST: {
    label: 'Perdido',
    bg: 'rgba(239, 68, 68, 0.12)',
    text: '#EF4444',
  },
  EXPIRED: {
    label: 'Expirado',
    bg: 'rgba(107, 114, 128, 0.12)',
    text: '#6B7280',
  },
}

// ============================================================
// Type icon configuration
// ============================================================

const typeConfig: Record<CartType, { icon: typeof ShoppingCart; label: string; color: string }> = {
  ABANDONED_CART: {
    icon: ShoppingCart,
    label: 'Carrinho',
    color: '#F59E0B',
  },
  PIX_PENDING: {
    icon: QrCode,
    label: 'PIX',
    color: '#3B82F6',
  },
  CARD_DECLINED: {
    icon: CreditCard,
    label: 'Cartao',
    color: '#EF4444',
  },
}

function StatusBadge({ status }: { status: CartStatus }) {
  const config = statusConfig[status]

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: config.bg, color: config.text }}
    >
      {config.label}
    </span>
  )
}

function TypeBadge({ type }: { type: CartType }) {
  const config = typeConfig[type]
  const Icon = config.icon

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: `${config.color}15`, color: config.color }}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  )
}

export function RecentCartsTable({ carts, limit = 10 }: RecentCartsTableProps) {
  const displayCarts = carts.slice(0, limit)

  return (
    <div
      className="rounded-[var(--radius-lg)] border border-[var(--border)]"
      style={{ background: 'var(--surface)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
        <h3
          className="text-sm font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          Carrinhos Recentes
        </h3>
        <span
          className="text-xs"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {carts.length} total
        </span>
      </div>

      {/* Table */}
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
              <th className="px-5 py-3">Cliente</th>
              <th className="px-5 py-3">Valor</th>
              <th className="hidden px-5 py-3 md:table-cell">Produtos</th>
              <th className="px-5 py-3">Tipo</th>
              <th className="px-5 py-3">Status</th>
              <th className="hidden px-5 py-3 text-right sm:table-cell">Tempo</th>
            </tr>
          </thead>
          <tbody>
            {displayCarts.map((cart) => (
              <tr
                key={cart.id}
                className="border-b transition-colors last:border-b-0"
                style={{
                  borderColor: 'var(--border)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--surface-hover)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                {/* Cliente */}
                <td className="px-5 py-3.5">
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {cart.customerName}
                    </p>
                    <p
                      className="mt-0.5 text-xs"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      {cart.customerPhone}
                    </p>
                  </div>
                </td>

                {/* Valor */}
                <td className="px-5 py-3.5">
                  <span
                    className="text-sm font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {formatCurrency(cart.cartTotal)}
                  </span>
                </td>

                {/* Produtos */}
                <td
                  className="hidden max-w-[200px] truncate px-5 py-3.5 text-sm md:table-cell"
                  style={{ color: 'var(--text-secondary)' }}
                  title={cart.cartItems.map((item) => item.name).join(', ')}
                >
                  {cart.cartItems.map((item) => item.name).join(', ')}
                </td>

                {/* Tipo */}
                <td className="px-5 py-3.5">
                  <TypeBadge type={cart.type} />
                </td>

                {/* Status */}
                <td className="px-5 py-3.5">
                  <StatusBadge status={cart.status} />
                </td>

                {/* Tempo */}
                <td
                  className="hidden px-5 py-3.5 text-right text-xs sm:table-cell"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {formatRelativeTime(cart.abandonedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
