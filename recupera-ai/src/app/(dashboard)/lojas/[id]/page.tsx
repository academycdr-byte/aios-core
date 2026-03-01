'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  BarChart3,
  Settings,
  GitBranch,
  MessageCircle,
  BookOpen,
  ShoppingCart,
  RefreshCcw,
  DollarSign,
  TrendingUp,
  Smartphone,
  ShoppingBag,
  Cloud,
  Power,
  PowerOff,
  CheckCircle2,
  XCircle,
  Loader2,
  Unplug,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { StoreSettingsForm } from '@/components/store-settings-form'
import { RecoveryConfigForm } from '@/components/recovery-config-form'
import { KnowledgeBaseForm } from '@/components/knowledge-base-form'
import { WhatsappConnectModal } from '@/components/whatsapp-connect-modal'
import type { MockStoreSettings, MockRecoveryConfig } from '@/lib/mock-stores'

type TabId = 'overview' | 'knowledge' | 'settings' | 'recovery' | 'whatsapp'

interface Tab {
  id: TabId
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const TABS: Tab[] = [
  { id: 'overview', label: 'Visao Geral', icon: BarChart3 },
  { id: 'knowledge', label: 'Conhecimento', icon: BookOpen },
  { id: 'recovery', label: 'Fluxo de Recuperacao', icon: GitBranch },
  { id: 'settings', label: 'Configuracoes', icon: Settings },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
]

interface ChartDataPoint {
  day: string
  abandoned: number
  recovered: number
}

interface StoreData {
  id: string
  name: string
  platform: string
  domain: string | null
  shopifyDomain: string | null
  nuvemshopStoreId: string | null
  whatsappPhone: string | null
  whatsappConnected: boolean
  isActive: boolean
  _count?: {
    abandonedCarts: number
    conversations: number
  }
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  color: 'accent' | 'warning' | 'info' | 'success'
}) {
  const colorMap = {
    accent: 'bg-accent-light text-accent',
    warning: 'bg-warning-light text-warning',
    info: 'bg-info-light text-info',
    success: 'bg-success-light text-success',
  } as const

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
      <div className="flex items-center gap-3">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)]', colorMap[color])}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-text-tertiary">{label}</p>
          <p className="text-lg font-bold text-text-primary">{value}</p>
        </div>
      </div>
    </div>
  )
}

function SimpleBarChart({ data }: { data: ChartDataPoint[] }) {
  const maxValue = Math.max(...data.map((d) => d.abandoned))

  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.day} className="flex items-center gap-3">
          <span className="w-8 shrink-0 text-xs font-medium text-text-tertiary">{d.day}</span>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <div
                className="h-4 rounded-sm bg-warning/30"
                style={{ width: `${(d.abandoned / maxValue) * 100}%` }}
              />
              <span className="text-xs text-text-tertiary">{d.abandoned}</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="h-4 rounded-sm bg-accent/40"
                style={{ width: `${(d.recovered / maxValue) * 100}%` }}
              />
              <span className="text-xs text-accent">{d.recovered}</span>
            </div>
          </div>
        </div>
      ))}
      <div className="flex items-center gap-4 pt-2">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-warning/30" />
          <span className="text-xs text-text-tertiary">Abandonados</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-accent/40" />
          <span className="text-xs text-text-tertiary">Recuperados</span>
        </div>
      </div>
    </div>
  )
}

function OverviewTab({ store }: { store: StoreData }) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [chartLoading, setChartLoading] = useState(true)
  const cartCount = store._count?.abandonedCarts ?? 0
  const convCount = store._count?.conversations ?? 0

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await fetch(`/api/dashboard?period=7d&storeId=${store.id}`)
        if (!res.ok) return
        const json = await res.json()
        const metrics = json.data?.dailyMetrics ?? []
        if (metrics.length > 0) {
          const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
          setChartData(
            metrics.map((m: { date: string; abandonedCount: number; recoveredCount: number }) => ({
              day: dayNames[new Date(m.date).getUTCDay()],
              abandoned: m.abandonedCount,
              recovered: m.recoveredCount,
            }))
          )
        }
      } catch {
        // No data available
      } finally {
        setChartLoading(false)
      }
    }
    fetchMetrics()
  }, [store.id])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={ShoppingCart}
          label="Carrinhos Total"
          value={cartCount}
          color="warning"
        />
        <StatCard
          icon={RefreshCcw}
          label="Conversas Total"
          value={convCount}
          color="success"
        />
        <StatCard
          icon={TrendingUp}
          label="Plataforma"
          value={store.platform === 'SHOPIFY' ? 'Shopify' : 'Nuvemshop'}
          color="accent"
        />
        <StatCard
          icon={DollarSign}
          label="Status"
          value={store.isActive ? 'Ativa' : 'Inativa'}
          color="info"
        />
      </div>

      {/* Chart */}
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h3 className="mb-4 text-sm font-semibold text-text-primary">
          Recuperacao dos Ultimos 7 Dias
        </h3>
        {chartLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-text-tertiary" />
          </div>
        ) : chartData.length > 0 ? (
          <SimpleBarChart data={chartData} />
        ) : (
          <p className="py-8 text-center text-sm text-text-tertiary">Sem dados no periodo</p>
        )}
      </div>

      {/* Store Info */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <h3 className="mb-3 text-sm font-semibold text-text-primary">Informacoes</h3>
          <dl className="space-y-3">
            <div className="flex items-center justify-between">
              <dt className="text-sm text-text-secondary">Plataforma</dt>
              <dd className="flex items-center gap-1.5 text-sm font-medium text-text-primary">
                {store.platform === 'SHOPIFY' ? (
                  <>
                    <ShoppingBag className="h-4 w-4 text-purple-400" />
                    Shopify
                  </>
                ) : (
                  <>
                    <Cloud className="h-4 w-4 text-blue-400" />
                    Nuvemshop
                  </>
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm text-text-secondary">Dominio</dt>
              <dd className="text-sm font-medium text-text-primary">{store.domain ?? '-'}</dd>
            </div>
            {store.shopifyDomain && (
              <div className="flex items-center justify-between">
                <dt className="text-sm text-text-secondary">Dominio Shopify</dt>
                <dd className="text-sm font-medium text-text-primary">{store.shopifyDomain}</dd>
              </div>
            )}
            <div className="flex items-center justify-between">
              <dt className="text-sm text-text-secondary">Status</dt>
              <dd className={cn('flex items-center gap-1.5 text-sm font-medium', store.isActive ? 'text-success' : 'text-text-tertiary')}>
                {store.isActive ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                {store.isActive ? 'Ativa' : 'Inativa'}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <h3 className="mb-3 text-sm font-semibold text-text-primary">WhatsApp</h3>
          <dl className="space-y-3">
            <div className="flex items-center justify-between">
              <dt className="text-sm text-text-secondary">Status</dt>
              <dd className={cn('flex items-center gap-1.5 text-sm font-medium', store.whatsappConnected ? 'text-success' : 'text-error')}>
                {store.whatsappConnected ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Conectado
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    Desconectado
                  </>
                )}
              </dd>
            </div>
            {store.whatsappPhone && (
              <div className="flex items-center justify-between">
                <dt className="text-sm text-text-secondary">Numero</dt>
                <dd className="text-sm font-medium text-text-primary">{store.whatsappPhone}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  )
}

function WhatsAppTab({ store, onStatusChange }: { store: StoreData; onStatusChange: (connected: boolean) => void }) {
  const [showModal, setShowModal] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const [liveConnected, setLiveConnected] = useState(store.whatsappConnected)
  const [liveState, setLiveState] = useState<string | null>(null)

  // Check real status from Evolution API on mount
  useEffect(() => {
    let cancelled = false

    async function checkStatus() {
      setStatusLoading(true)
      try {
        const res = await fetch(`/api/whatsapp/status?storeId=${store.id}`)
        const json = await res.json()
        if (!cancelled && json.data) {
          setLiveConnected(json.data.connected)
          setLiveState(json.data.state)
          onStatusChange(json.data.connected)
        }
      } catch {
        // Fall back to DB value
      } finally {
        if (!cancelled) setStatusLoading(false)
      }
    }

    checkStatus()
    return () => { cancelled = true }
  }, [store.id, onStatusChange])

  const handleModalStatusChange = useCallback((connected: boolean) => {
    setLiveConnected(connected)
    onStatusChange(connected)
  }, [onStatusChange])

  const handleDisconnect = useCallback(async () => {
    setStatusLoading(true)
    try {
      const res = await fetch('/api/whatsapp/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: store.id }),
      })
      if (res.ok) {
        setLiveConnected(false)
        setLiveState('close')
        onStatusChange(false)
      }
    } catch {
      // Silently fail
    } finally {
      setStatusLoading(false)
    }
  }, [store.id, onStatusChange])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Connection Status */}
      <div className={cn(
        'rounded-[var(--radius-lg)] border p-6',
        liveConnected
          ? 'border-success/30 bg-success-light'
          : 'border-error/30 bg-error-light'
      )}>
        <div className="flex items-center gap-4">
          <div className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full',
            liveConnected ? 'bg-success/20' : 'bg-error/20'
          )}>
            {statusLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-text-tertiary" />
            ) : liveConnected ? (
              <CheckCircle2 className="h-6 w-6 text-success" />
            ) : (
              <XCircle className="h-6 w-6 text-error" />
            )}
          </div>
          <div>
            <h3 className={cn('text-base font-semibold', liveConnected ? 'text-success' : 'text-error')}>
              {statusLoading ? 'Verificando...' : liveConnected ? 'WhatsApp Conectado' : 'WhatsApp Desconectado'}
            </h3>
            <p className="text-sm text-text-secondary">
              {liveConnected
                ? `Conectado ao numero ${store.whatsappPhone ?? '(numero nao registrado)'}`
                : 'Conecte o WhatsApp para comecar a recuperar carrinhos'
              }
            </p>
            {liveState && (
              <p className="mt-1 text-xs text-text-tertiary">
                Estado da instancia: {liveState}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Connect Button */}
      {!liveConnected && (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
          <h3 className="mb-4 text-sm font-semibold text-text-primary">
            Conectar WhatsApp Business
          </h3>
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-48 w-48 items-center justify-center rounded-[var(--radius-lg)] bg-bg-tertiary">
              <Smartphone className="h-16 w-16 text-text-tertiary" />
            </div>
            <p className="text-center text-sm font-medium text-text-secondary">
              Escaneie o QR Code com WhatsApp Business
            </p>
            <p className="text-center text-xs text-text-tertiary">
              Abra o WhatsApp Business {'>'} Configuracoes {'>'} Dispositivos Conectados {'>'} Conectar Dispositivo
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="rounded-[var(--radius-md)] bg-accent px-6 py-2.5 text-sm font-semibold text-text-inverse hover:bg-accent-hover"
            >
              Gerar QR Code
            </button>
          </div>
        </div>
      )}

      {/* WhatsApp Details (when connected) */}
      {liveConnected && (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <h3 className="mb-3 text-sm font-semibold text-text-primary">Detalhes da Conexao</h3>
          <dl className="space-y-3">
            <div className="flex items-center justify-between">
              <dt className="text-sm text-text-secondary">Numero</dt>
              <dd className="text-sm font-medium text-text-primary">{store.whatsappPhone ?? '-'}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm text-text-secondary">Status</dt>
              <dd className="flex items-center gap-1.5 text-sm font-medium text-success">
                <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                Online
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm text-text-secondary">Instancia</dt>
              <dd className="text-sm font-medium text-text-primary">recupera-{store.id}</dd>
            </div>
          </dl>
          <div className="mt-4 border-t border-border pt-4">
            <button
              onClick={handleDisconnect}
              disabled={statusLoading}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-error/30 px-4 py-2 text-sm font-medium text-error hover:bg-error-light disabled:opacity-50"
            >
              {statusLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Unplug className="h-4 w-4" />
              )}
              Desconectar WhatsApp
            </button>
          </div>
        </div>
      )}

      {/* WhatsApp Connect Modal */}
      <WhatsappConnectModal
        storeId={store.id}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onStatusChange={handleModalStatusChange}
      />
    </div>
  )
}

export default function StoreDetailPage() {
  const params = useParams()
  const router = useRouter()
  const storeId = params.id as string
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [store, setStore] = useState<StoreData | null>(null)
  const [settings, setSettings] = useState<MockStoreSettings | null>(null)
  const [recoveryConfig, setRecoveryConfig] = useState<MockRecoveryConfig | null>(null)
  const [loading, setLoading] = useState(true)

  // Callback to update whatsapp status in local store state
  const handleWhatsappStatusChange = useCallback((connected: boolean) => {
    setStore((prev) => prev ? { ...prev, whatsappConnected: connected } : prev)
  }, [])

  // Fetch store data
  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false

    Promise.all([
      fetch(`/api/stores/${storeId}`, { signal: controller.signal }).then((r) => r.json()),
      fetch(`/api/stores/${storeId}/settings`, { signal: controller.signal }).then((r) => r.json()),
      fetch(`/api/stores/${storeId}/recovery-config`, { signal: controller.signal }).then((r) => r.json()),
    ])
      .then(([storeJson, settingsJson, recoveryJson]) => {
        if (!cancelled) {
          if (storeJson.data) setStore(storeJson.data)
          if (settingsJson.data) setSettings(settingsJson.data)
          if (recoveryJson.data) setRecoveryConfig(recoveryJson.data)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [storeId])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
        <p className="ml-2 text-sm text-text-tertiary">Carregando loja...</p>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-text-secondary">Loja nao encontrada</p>
      </div>
    )
  }

  async function handleSaveSettings(updated: MockStoreSettings) {
    const res = await fetch(`/api/stores/${storeId}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    })
    const json = await res.json()
    if (json.data) setSettings(json.data)
  }

  async function handleSaveRecovery(updated: MockRecoveryConfig) {
    const res = await fetch(`/api/stores/${storeId}/recovery-config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    })
    const json = await res.json()
    if (json.data) setRecoveryConfig(json.data)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back Button + Store Header */}
      <div>
        <button
          onClick={() => router.push('/lojas')}
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Lojas
        </button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)]',
              store.platform === 'SHOPIFY' ? 'bg-purple-500/10' : 'bg-blue-500/10'
            )}>
              {store.platform === 'SHOPIFY' ? (
                <ShoppingBag className="h-5 w-5 text-purple-400" />
              ) : (
                <Cloud className="h-5 w-5 text-blue-400" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary">{store.name}</h1>
              <p className="text-sm text-text-tertiary">{store.domain ?? '-'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              'inline-flex items-center gap-1.5 rounded-[var(--radius-full)] px-3 py-1 text-xs font-medium',
              store.isActive ? 'bg-success-light text-success' : 'bg-surface-hover text-text-tertiary'
            )}>
              {store.isActive ? <Power className="h-3 w-3" /> : <PowerOff className="h-3 w-3" />}
              {store.isActive ? 'Ativa' : 'Inativa'}
            </span>
            <span className={cn(
              'inline-flex items-center gap-1.5 rounded-[var(--radius-full)] px-3 py-1 text-xs font-medium',
              store.whatsappConnected ? 'bg-success-light text-success' : 'bg-error-light text-error'
            )}>
              <MessageCircle className="h-3 w-3" />
              {store.whatsappConnected ? 'WhatsApp OK' : 'WhatsApp Off'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                  active
                    ? 'border-accent text-accent'
                    : 'border-transparent text-text-secondary hover:border-border-hover hover:text-text-primary'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && <OverviewTab store={store} />}
        {activeTab === 'knowledge' && settings && (
          <KnowledgeBaseForm settings={settings} onSave={handleSaveSettings} />
        )}
        {activeTab === 'settings' && settings && (
          <StoreSettingsForm settings={settings} onSave={handleSaveSettings} />
        )}
        {activeTab === 'recovery' && recoveryConfig && (
          <RecoveryConfigForm config={recoveryConfig} onSave={handleSaveRecovery} />
        )}
        {activeTab === 'whatsapp' && <WhatsAppTab store={store} onStatusChange={handleWhatsappStatusChange} />}
      </div>
    </div>
  )
}
