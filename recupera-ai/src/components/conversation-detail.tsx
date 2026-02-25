'use client'

import { useState, useEffect } from 'react'
import {
  Phone,
  Store,
  ExternalLink,
  DollarSign,
  Bot,
  Check,
  CheckCheck,
  X,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import type { Conversation, Message, AbandonedCart } from '@/types'

// ============================================================
// STATUS CONFIG
// ============================================================

const CONV_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: 'Ativa', color: 'text-info', bg: 'bg-info-light' },
  RECOVERED: { label: 'Recuperada', color: 'text-success', bg: 'bg-success-light' },
  LOST: { label: 'Perdida', color: 'text-error', bg: 'bg-error-light' },
  ESCALATED: { label: 'Escalada', color: 'text-warning', bg: 'bg-warning-light' },
  EXPIRED: { label: 'Expirada', color: 'text-text-tertiary', bg: 'bg-surface-active' },
}

// ============================================================
// MESSAGE STATUS ICON
// ============================================================

function MessageStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'SENT':
      return <Check className="h-3 w-3 text-text-tertiary" />
    case 'DELIVERED':
      return <CheckCheck className="h-3 w-3 text-text-tertiary" />
    case 'READ':
      return <CheckCheck className="h-3 w-3 text-info" />
    case 'FAILED':
      return <X className="h-3 w-3 text-error" />
    default:
      return null
  }
}

// ============================================================
// MESSAGE BUBBLE
// ============================================================

function MessageBubble({ message }: { message: Message }) {
  const time = new Date(message.sentAt).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  if (message.role === 'SYSTEM') {
    return (
      <div className="flex justify-center py-2">
        <div className="rounded-[var(--radius-full)] bg-surface-active px-4 py-1.5">
          <p className="text-xs text-text-tertiary">{message.content}</p>
        </div>
      </div>
    )
  }

  const isAI = message.role === 'AI'

  return (
    <div
      className={cn('flex', isAI ? 'justify-start' : 'justify-end')}
    >
      <div
        className={cn(
          'max-w-[75%] rounded-[var(--radius-lg)] px-4 py-2.5',
          isAI
            ? 'rounded-bl-[var(--radius-sm)] bg-surface-active'
            : 'rounded-br-[var(--radius-sm)] bg-accent text-text-inverse'
        )}
      >
        {isAI && (
          <div className="mb-1 flex items-center gap-1">
            <Bot className="h-3 w-3 text-accent" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-accent">
              IA
            </span>
          </div>
        )}
        <p
          className={cn(
            'whitespace-pre-wrap text-sm leading-relaxed',
            isAI ? 'text-text-primary' : 'text-text-inverse'
          )}
        >
          {message.content}
        </p>
        <div
          className={cn(
            'mt-1 flex items-center gap-1',
            isAI ? 'justify-start' : 'justify-end'
          )}
        >
          <span
            className={cn(
              'text-[10px]',
              isAI ? 'text-text-tertiary' : 'text-text-inverse/70'
            )}
          >
            {time}
          </span>
          {isAI && <MessageStatusIcon status={message.messageStatus} />}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// CONVERSATION DETAIL
// ============================================================

interface ConversationDetailProps {
  conversation: Conversation
  onClose?: () => void
}

export function ConversationDetail({ conversation, onClose }: ConversationDetailProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [cart, setCart] = useState<AbandonedCart | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch conversation detail with messages and cart from API
  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false

    fetch(`/api/conversations/${conversation.id}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json.data) {
          setMessages(json.data.messages ?? [])
          setCart(json.data.cart ?? null)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMessages([])
          setCart(null)
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [conversation.id])

  const statusCfg = CONV_STATUS_CONFIG[conversation.status] ?? CONV_STATUS_CONFIG.ACTIVE

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-full)] bg-accent text-sm font-semibold text-text-inverse">
            {conversation.customerName?.charAt(0) ?? '?'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-text-primary">
                {conversation.customerName ?? 'Desconhecido'}
              </h3>
              <span
                className={cn(
                  'rounded-[var(--radius-full)] px-2 py-0.5 text-[10px] font-medium',
                  statusCfg.bg,
                  statusCfg.color
                )}
              >
                {statusCfg.label}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-text-tertiary">
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {conversation.customerPhone}
              </span>
              {conversation.storeName && (
                <span className="flex items-center gap-1">
                  <Store className="h-3 w-3" />
                  {conversation.storeName}
                </span>
              )}
            </div>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-[var(--radius-md)] p-1.5 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-primary lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {messages.length === 0 && (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-text-tertiary">
                  Nenhuma mensagem nesta conversa.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Cart Info Panel */}
      {cart && (
        <div className="border-t border-border bg-bg-tertiary p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* Products */}
            <div>
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
                Produtos
              </p>
              <div className="space-y-0.5">
                {(Array.isArray(cart.cartItems) ? cart.cartItems : []).slice(0, 2).map((item, idx) => (
                  <p key={item.id ?? idx} className="truncate text-xs text-text-secondary">
                    {item.quantity}x {item.name}
                  </p>
                ))}
                {Array.isArray(cart.cartItems) && cart.cartItems.length > 2 && (
                  <p className="text-xs text-text-tertiary">
                    +{cart.cartItems.length - 2} mais
                  </p>
                )}
              </div>
            </div>

            {/* Value */}
            <div>
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
                Valor
              </p>
              <p className="flex items-center gap-1 text-sm font-semibold text-text-primary">
                <DollarSign className="h-3.5 w-3.5 text-accent" />
                {formatCurrency(cart.cartTotal)}
              </p>
            </div>

            {/* Checkout */}
            <div>
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
                Checkout
              </p>
              {cart.checkoutUrl ? (
                <a
                  href={cart.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Abrir link
                </a>
              ) : (
                <p className="text-xs text-text-tertiary">-</p>
              )}
            </div>

            {/* AI Cost */}
            <div>
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
                Custo IA
              </p>
              <p className="flex items-center gap-1 text-xs text-text-secondary">
                <Bot className="h-3 w-3" />
                {formatCurrency(conversation.estimatedCost)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
