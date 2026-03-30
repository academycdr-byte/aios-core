'use client'

import { ShoppingCart, CreditCard, QrCode } from 'lucide-react'
import type { RecentCart } from '@/types/charts'
import type { CartStatus, CartType } from '@/generated/prisma/enums'
import { formatCurrency, formatRelativeTime } from '@/lib/format'

interface RecentCartsTableProps {
  carts: RecentCart[]
  limit?: number
}

const statusConfig: Record<CartStatus, { label: string; bg: string; text: string }> = {
  PENDING: {
    label: 'Pendente',
    bg: 'var(--warning-surface)',
    text: 'var(--warning)',
  },
  CONTACTING: {
    label: 'Contatando',
    bg: 'var(--info-surface)',
    text: 'var(--info)',
  },
  RECOVERED: {
    label: 'Recuperado',
    bg: 'var(--success-surface)',
    text: 'var(--success)',
  },
  PAID: {
    label: 'Pago',
    bg: 'var(--success-surface)',
    text: 'var(--success)',
  },
  LOST: {
    label: 'Perdido',
    bg: 'var(--danger-surface)',
    text: 'var(--danger)',
  },
  EXPIRED: {
    label: 'Expirado',
    bg: 'var(--bg-hover)',
    text: 'var(--text-secondary)',
  },
}

const typeConfig: Record<CartType, { icon: typeof ShoppingCart; label: string }> = {
  ABANDONED_CART: { icon: ShoppingCart, label: 'Carrinho' },
  PIX_PENDING: { icon: QrCode, label: 'PIX' },
  CARD_DECLINED: { icon: CreditCard, label: 'Cartão' },
}

function StatusBadge({ status }: { status: CartStatus }) {
  const config = statusConfig[status]
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 text-[12px] font-semibold"
      style={{
        borderRadius: '6px',
        background: config.bg,
        color: config.text,
      }}
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
      className="inline-flex items-center gap-1 px-2 py-0.5 text-[12px] font-medium"
      style={{
        borderRadius: '6px',
        background: 'var(--accent-surface)',
        color: 'var(--accent)',
      }}
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
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-7 py-5"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <h3
          className="text-[20px] font-bold"
          style={{
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
          }}
        >
          Carrinhos Recentes
        </h3>
        <span
          className="text-[14px]"
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
              style={{
                background: 'var(--bg-primary)',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <th
                className="px-4 py-3 text-left text-[13px] font-medium uppercase tracking-wider"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Cliente
              </th>
              <th
                className="px-4 py-3 text-left text-[13px] font-medium uppercase tracking-wider"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Valor
              </th>
              <th
                className="hidden px-4 py-3 text-left text-[13px] font-medium uppercase tracking-wider md:table-cell"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Produtos
              </th>
              <th
                className="px-4 py-3 text-left text-[13px] font-medium uppercase tracking-wider"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Tipo
              </th>
              <th
                className="px-4 py-3 text-left text-[13px] font-medium uppercase tracking-wider"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Status
              </th>
              <th
                className="hidden px-4 py-3 text-right text-[13px] font-medium uppercase tracking-wider sm:table-cell"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Tempo
              </th>
            </tr>
          </thead>
          <tbody>
            {displayCarts.map((cart) => (
              <tr
                key={cart.id}
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
                  <p
                    className="text-[14px] font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {cart.customerName}
                  </p>
                  <p
                    className="mt-0.5 text-[12px]"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {cart.customerPhone}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="text-[14px] font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {formatCurrency(cart.cartTotal)}
                  </span>
                </td>
                <td
                  className="hidden max-w-[200px] truncate px-4 py-3 text-[14px] md:table-cell"
                  style={{ color: 'var(--text-secondary)' }}
                  title={cart.cartItems.map((item) => item.name).join(', ')}
                >
                  {cart.cartItems.map((item) => item.name).join(', ')}
                </td>
                <td className="px-4 py-3">
                  <TypeBadge type={cart.type} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={cart.status} />
                </td>
                <td
                  className="hidden px-4 py-3 text-right text-[12px] sm:table-cell"
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
