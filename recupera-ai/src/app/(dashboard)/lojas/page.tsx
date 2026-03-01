'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Plus,
  ShoppingBag,
  Cloud,
  MessageCircle,
  ShoppingCart,
  RefreshCcw,
  ExternalLink,
  Power,
  PowerOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ConnectStoreModal } from '@/components/connect-store-modal'
import type { ConnectStoreData } from '@/components/connect-store-modal'
import { Button, Badge } from '@/components/ui'
import { PageSpinner } from '@/components/ui'
import { EmptyState } from '@/components/patterns'
import type { Store } from '@/types'

function PlatformBadge({ platform }: { platform: string }) {
  const isShopify = platform === 'SHOPIFY'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[var(--radius-full)] px-2.5 py-1 text-xs font-semibold',
        isShopify
          ? 'bg-purple-500/10 text-purple-400'
          : 'bg-blue-500/10 text-blue-400'
      )}
    >
      {isShopify ? (
        <ShoppingBag className="h-3 w-3" />
      ) : (
        <Cloud className="h-3 w-3" />
      )}
      {isShopify ? 'Shopify' : 'Nuvemshop'}
    </span>
  )
}

function WhatsAppStatus({ connected }: { connected: boolean }) {
  return (
    <Badge variant={connected ? 'success' : 'error'} dot>
      <MessageCircle className="h-3 w-3" />
      {connected ? 'WhatsApp Conectado' : 'WhatsApp Desconectado'}
    </Badge>
  )
}

function StoreStatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium',
        active ? 'text-success' : 'text-text-tertiary'
      )}
    >
      {active ? (
        <Power className="h-3.5 w-3.5" />
      ) : (
        <PowerOff className="h-3.5 w-3.5" />
      )}
      {active ? 'Ativa' : 'Inativa'}
    </span>
  )
}

export default function LojasPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stores')
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setStores(json.data)
      })
      .catch(() => { /* silently ignore */ })
      .finally(() => setLoading(false))
  }, [])

  async function handleConnect(data: ConnectStoreData) {
    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (json.data) {
        if (data.platform === 'SHOPIFY' && json.data.id) {
          window.location.href = `/api/integrations/shopify?storeId=${json.data.id}`
          return
        }
        setStores((prev) => [json.data, ...prev])
      }
    } catch {
      // Handle error silently
    }
    setModalOpen(false)
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Lojas</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Gerencie suas lojas conectadas e configuracoes de recuperacao
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Conectar Nova Loja
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
          <p className="text-sm text-text-secondary">Total de Lojas</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">{stores.length}</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
          <p className="text-sm text-text-secondary">Lojas Ativas</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">
            {stores.filter((s) => s.isActive).length}
          </p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
          <p className="text-sm text-text-secondary">WhatsApp Conectado</p>
          <p className="mt-1 text-2xl font-bold text-accent">
            {stores.filter((s) => s.whatsappConnected).length}
          </p>
        </div>
      </div>

      {/* Store Cards */}
      {loading ? (
        <PageSpinner message="Carregando lojas..." />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {stores.map((store) => (
            <Link
              key={store.id}
              href={`/lojas/${store.id}`}
              className="group rounded-[var(--radius-lg)] border border-border bg-surface p-5 transition-all hover:border-border-hover hover:shadow-[var(--shadow-md)]"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-semibold text-text-primary group-hover:text-accent">
                    {store.name}
                  </h3>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-text-tertiary">
                    {store.domain ?? '-'}
                    {store.domain && <ExternalLink className="h-3 w-3" />}
                  </p>
                </div>
                <StoreStatusBadge active={store.isActive} />
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-2">
                <PlatformBadge platform={store.platform} />
                <WhatsAppStatus connected={store.whatsappConnected} />
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-[var(--radius-md)] bg-bg-tertiary p-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-warning-light">
                    <ShoppingCart className="h-4 w-4 text-warning" />
                  </div>
                  <div>
                    <p className="text-xs text-text-tertiary">Plataforma</p>
                    <p className="text-sm font-semibold text-text-primary">
                      {store.platform === 'SHOPIFY' ? 'Shopify' : 'Nuvemshop'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-success-light">
                    <RefreshCcw className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-text-tertiary">WhatsApp</p>
                    <p className="text-sm font-semibold text-accent">
                      {store.whatsappConnected ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          {stores.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                icon={<ShoppingBag className="h-12 w-12" />}
                title="Nenhuma loja conectada"
                description="Conecte sua primeira loja para comecar a recuperar carrinhos abandonados."
                action={{
                  label: 'Conectar Primeira Loja',
                  onClick: () => setModalOpen(true),
                }}
              />
            </div>
          )}
        </div>
      )}

      <ConnectStoreModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConnect={handleConnect}
      />
    </div>
  )
}
