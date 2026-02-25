'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  MessageSquare,
  Search,
  Bot,
  ArrowLeft,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency, formatRelativeTime } from '@/lib/format'
import { ConversationDetail } from '@/components/conversation-detail'
import type { Conversation, Store } from '@/types'

// ============================================================
// STATUS CONFIG
// ============================================================

const CONV_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  ACTIVE: { label: 'Ativa', color: 'text-info', bg: 'bg-info-light', dot: 'bg-info' },
  RECOVERED: { label: 'Recuperada', color: 'text-success', bg: 'bg-success-light', dot: 'bg-success' },
  LOST: { label: 'Perdida', color: 'text-error', bg: 'bg-error-light', dot: 'bg-error' },
  ESCALATED: { label: 'Escalada', color: 'text-warning', bg: 'bg-warning-light', dot: 'bg-warning' },
  EXPIRED: { label: 'Expirada', color: 'text-text-tertiary', bg: 'bg-surface-active', dot: 'bg-text-tertiary' },
}

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'Todas' },
  { value: 'ACTIVE', label: 'Ativas' },
  { value: 'RECOVERED', label: 'Recuperadas' },
  { value: 'LOST', label: 'Perdidas' },
  { value: 'ESCALATED', label: 'Escaladas' },
]

// ============================================================
// CONVERSATION LIST ITEM
// ============================================================

interface ConversationItemProps {
  conversation: Conversation
  isSelected: boolean
  onClick: () => void
}

function ConversationItem({ conversation, isSelected, onClick }: ConversationItemProps) {
  const statusCfg = CONV_STATUS_CONFIG[conversation.status] ?? CONV_STATUS_CONFIG.ACTIVE

  const timeStr = conversation.lastMessageAt
    ? formatRelativeTime(new Date(conversation.lastMessageAt))
    : '-'

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors',
        isSelected
          ? 'bg-accent-light'
          : 'hover:bg-surface-hover'
      )}
    >
      {/* Avatar */}
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-full)] bg-accent text-sm font-semibold text-text-inverse">
        {conversation.customerName?.charAt(0) ?? '?'}
        {/* Status dot */}
        <div
          className={cn(
            'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-[var(--radius-full)] border-2 border-bg-secondary',
            statusCfg.dot
          )}
        />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <h4 className="truncate text-sm font-medium text-text-primary">
            {conversation.customerName ?? 'Desconhecido'}
          </h4>
          <span className="ml-2 shrink-0 text-[10px] text-text-tertiary">
            {timeStr}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-text-tertiary">
          {conversation.lastMessage ?? 'Sem mensagens'}
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <span
            className={cn(
              'rounded-[var(--radius-full)] px-2 py-0.5 text-[10px] font-medium',
              statusCfg.bg,
              statusCfg.color
            )}
          >
            {statusCfg.label}
          </span>
          {conversation.cartTotal != null && conversation.cartTotal > 0 && (
            <span className="text-[10px] font-medium text-text-secondary">
              {formatCurrency(conversation.cartTotal)}
            </span>
          )}
          {conversation.storeName && (
            <span className="truncate text-[10px] text-text-tertiary">
              {conversation.storeName}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

// ============================================================
// EMPTY STATE
// ============================================================

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8">
      <div className="rounded-[var(--radius-xl)] bg-accent-light p-4">
        <MessageSquare className="h-8 w-8 text-accent" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-text-primary">
        Selecione uma conversa
      </h3>
      <p className="mt-1 max-w-sm text-center text-sm text-text-tertiary">
        Escolha uma conversa na lista ao lado para ver os detalhes e o historico
        de mensagens.
      </p>
    </div>
  )
}

// ============================================================
// PAGE
// ============================================================

export default function ConversasPage() {
  return (
    <Suspense fallback={<ConversasLoading />}>
      <ConversasContent />
    </Suspense>
  )
}

function ConversasLoading() {
  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold text-text-primary">Conversas</h2>
        <p className="mt-1 text-text-secondary">
          Carregando conversas...
        </p>
      </div>
      <div className="flex h-[calc(100vh-220px)] items-center justify-center rounded-[var(--radius-lg)] border border-border bg-surface">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    </div>
  )
}

function ConversasContent() {
  const searchParams = useSearchParams()
  const urlConvId = searchParams.get('id')

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedId, setSelectedId] = useState<string | null>(urlConvId)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [storeFilter, setStoreFilter] = useState<string>('ALL')
  const [search, setSearch] = useState('')
  const [mobileShowDetail, setMobileShowDetail] = useState(urlConvId !== null)

  // Fetch stores for filter dropdown
  useEffect(() => {
    fetch('/api/stores')
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setStores(json.data)
      })
      .catch(() => { /* silently ignore */ })
  }, [])

  // Fetch conversations from API
  useEffect(() => {
    const params = new URLSearchParams()
    if (statusFilter !== 'ALL') params.set('status', statusFilter)
    if (storeFilter !== 'ALL') params.set('storeId', storeFilter)
    params.set('limit', '100')

    const controller = new AbortController()
    let cancelled = false

    fetch(`/api/conversations?${params.toString()}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) {
          setConversations(json.data ?? [])
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setConversations([])
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [statusFilter, storeFilter])

  // Client-side search filter (since we already have all conversations loaded)
  const filteredConversations = search.trim()
    ? conversations.filter((c) => {
        const q = search.toLowerCase()
        return (
          c.customerName?.toLowerCase().includes(q) ||
          c.customerPhone?.includes(q)
        )
      })
    : conversations

  const selectedConversation = selectedId
    ? conversations.find((c) => c.id === selectedId) ?? null
    : null

  const handleSelect = (conv: Conversation) => {
    setSelectedId(conv.id)
    setMobileShowDetail(true)
  }

  const handleBack = () => {
    setMobileShowDetail(false)
  }

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-semibold text-text-primary">Conversas</h2>
        <p className="mt-1 text-text-secondary">
          Acompanhe as conversas da IA com seus clientes em tempo real.
        </p>
      </div>

      {/* Main Layout */}
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface" style={{ height: 'calc(100vh - 220px)' }}>
        <div className="flex h-full">
          {/* Left: Conversation List */}
          <div
            className={cn(
              'flex h-full w-full flex-col border-r border-border lg:w-[380px] lg:shrink-0',
              mobileShowDetail && 'hidden lg:flex'
            )}
          >
            {/* Filters */}
            <div className="space-y-2 border-b border-border p-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Buscar conversa..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-[var(--radius-md)] border border-border bg-bg-tertiary py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-tertiary"
                />
              </div>

              {/* Status tabs */}
              <div className="flex gap-1 overflow-x-auto">
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setStatusFilter(f.value)}
                    className={cn(
                      'shrink-0 rounded-[var(--radius-sm)] px-2.5 py-1 text-xs font-medium transition-colors',
                      statusFilter === f.value
                        ? 'bg-accent text-text-inverse'
                        : 'text-text-secondary hover:text-text-primary'
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Store filter */}
              <select
                value={storeFilter}
                onChange={(e) => setStoreFilter(e.target.value)}
                className="w-full rounded-[var(--radius-md)] border border-border bg-bg-tertiary px-3 py-1.5 text-xs text-text-primary"
              >
                <option value="ALL">Todas as lojas</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Conversation list */}
            <div className="flex-1 divide-y divide-border overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-accent" />
                  <p className="mt-2 text-sm text-text-tertiary">Carregando...</p>
                </div>
              ) : (
                <>
                  {filteredConversations.map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      conversation={conv}
                      isSelected={selectedId === conv.id}
                      onClick={() => handleSelect(conv)}
                    />
                  ))}
                  {filteredConversations.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Bot className="h-8 w-8 text-text-tertiary" />
                      <p className="mt-2 text-sm text-text-tertiary">
                        Nenhuma conversa encontrada.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Count */}
            <div className="border-t border-border px-4 py-2">
              <p className="text-xs text-text-tertiary">
                {filteredConversations.length} conversa{filteredConversations.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Right: Conversation Detail */}
          <div
            className={cn(
              'hidden flex-1 lg:flex lg:flex-col',
              mobileShowDetail && '!flex'
            )}
          >
            {/* Mobile back button */}
            {mobileShowDetail && (
              <div className="border-b border-border p-2 lg:hidden">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1 rounded-[var(--radius-md)] px-2 py-1 text-sm text-text-secondary hover:text-text-primary"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </button>
              </div>
            )}

            {selectedConversation ? (
              <ConversationDetail
                conversation={selectedConversation}
                onClose={handleBack}
              />
            ) : (
              <EmptyState />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
