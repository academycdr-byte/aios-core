'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  BarChart3,
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
  Unplug,
  Download,
  Send,
  Eye,
  Link2,
  AlertTriangle,
  ShieldAlert,
  Plus,
  X,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { useTheme } from '@/lib/theme-context'
import { cn } from '@/lib/utils'
import { StoreSettingsForm } from '@/components/store-settings-form'
import { RecoveryConfigForm } from '@/components/recovery-config-form'
import { StageConfigPanel } from '@/components/stage-config-panel'
import { FollowUpConfigPanel } from '@/components/follow-up-config-panel'
import { KnowledgeBaseForm } from '@/components/knowledge-base-form'
import { ImageLibraryPanel } from '@/components/image-library-panel'
import { WhatsappConnectModal } from '@/components/whatsapp-connect-modal'
import { Button, Badge, Input, Spinner, PageSpinner } from '@/components/ui'
import type { MockStoreSettings, MockRecoveryConfig } from '@/lib/mock-stores'

type TabId = 'overview' | 'knowledge' | 'recovery' | 'whatsapp'

interface Tab {
  id: TabId
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const TABS: Tab[] = [
  { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
  { id: 'knowledge', label: 'Conhecimento', icon: BookOpen },
  { id: 'recovery', label: 'Recuperação', icon: GitBranch },
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
  testMode: boolean
  testPhones: string[]
  _count?: {
    abandonedCarts: number
    conversations: number
  }
}

function OverviewStatCard({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  color: 'accent' | 'warning' | 'info' | 'success'
}) {
  const colorMap = {
    accent: { bg: 'bg-accent-light', text: 'text-accent', border: 'border-accent' },
    warning: { bg: 'bg-warning-light', text: 'text-warning', border: 'border-warning' },
    info: { bg: 'bg-info-light', text: 'text-info', border: 'border-info' },
    success: { bg: 'bg-success-light', text: 'text-success', border: 'border-success' },
  } as const

  const c = colorMap[color]

  return (
    <div className={cn(
      'rounded-[var(--radius-lg)] border border-border bg-surface p-4',
      'transition-all duration-200 hover:border-border-hover hover:shadow-[var(--shadow-sm)] hover:-translate-y-[1px]',
      `border-l-[3px] ${c.border}`
    )}>
      <div className="flex items-center gap-3">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-[var(--radius-lg)]', c.bg)}>
          <Icon className={cn('h-5 w-5', c.text)} />
        </div>
        <div>
          <p className="text-xs font-medium text-text-tertiary">{label}</p>
          <p className="text-xl font-bold text-text-primary">{value}</p>
        </div>
      </div>
    </div>
  )
}

function SimpleBarChart({ data }: { data: ChartDataPoint[] }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const tickColor = isDark ? '#8B8B8B' : '#6B7280'

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barCategoryGap="25%">
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis dataKey="day" tick={{ fill: tickColor, fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: tickColor, fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: isDark ? '#1A1A1A' : '#FFFFFF',
              border: `1px solid ${isDark ? '#2E2E2E' : '#E5E7EB'}`,
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              fontSize: 12,
            }}
            labelStyle={{ color: isDark ? '#F5F5F5' : '#1A1A1A', fontWeight: 600, marginBottom: 4 }}
          />
          <Legend
            wrapperStyle={{ paddingTop: 12 }}
            iconType="circle"
            iconSize={8}
            formatter={(value: string) => (
              <span style={{ color: isDark ? '#8B8B8B' : '#9CA3AF', fontSize: 12 }}>{value}</span>
            )}
          />
          <Bar dataKey="abandoned" name="Abandonados" fill="#F59E0B" radius={[4, 4, 0, 0]} opacity={0.8} />
          <Bar dataKey="recovered" name="Recuperados" fill="#10B981" radius={[4, 4, 0, 0]} opacity={0.9} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function OverviewTab({ store }: { store: StoreData }) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [chartLoading, setChartLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{
    totalFetched: number; imported: number; updated: number; skipped: number
  } | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [domainStatus, setDomainStatus] = useState<'checking' | 'valid' | 'invalid' | 'unknown'>('checking')
  const cartCount = store._count?.abandonedCarts ?? 0
  const convCount = store._count?.conversations ?? 0

  async function handleSync() {
    setSyncing(true)
    setSyncError(null)
    setSyncResult(null)
    try {
      const res = await fetch(`/api/stores/${store.id}/sync`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        setSyncError(json.message || 'Erro ao sincronizar')
      } else {
        setSyncResult(json.data)
      }
    } catch {
      setSyncError('Erro de conexão')
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await fetch(`/api/dashboard?period=7d&storeId=${store.id}`)
        if (!res.ok) return
        const json = await res.json()
        const metrics = json.data?.dailyMetrics ?? []
        if (metrics.length > 0) {
          const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
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

  // Checkout URL domain validation (AC4)
  useEffect(() => {
    if (!store.domain) {
      setDomainStatus('unknown')
      return
    }
    // Validate domain format
    try {
      const url = store.domain.startsWith('http') ? store.domain : `https://${store.domain}`
      new URL(url)
      setDomainStatus('valid')
    } catch {
      setDomainStatus('invalid')
    }
  }, [store.domain])

  return (
    <div className="animate-fade-in space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewStatCard icon={ShoppingCart} label="Carrinhos Total" value={cartCount} color="warning" />
        <OverviewStatCard icon={RefreshCcw} label="Conversas Total" value={convCount} color="success" />
        <OverviewStatCard icon={TrendingUp} label="Plataforma" value={store.platform === 'SHOPIFY' ? 'Shopify' : 'Nuvemshop'} color="accent" />
        <OverviewStatCard icon={DollarSign} label="Status" value={store.isActive ? 'Ativa' : 'Inativa'} color="info" />
      </div>

      {/* Checkout URL Validation — AC4 */}
      <div className={cn(
        'rounded-[var(--radius-lg)] border p-4',
        domainStatus === 'valid' ? 'border-success/30 bg-success/5' : domainStatus === 'invalid' ? 'border-error/30 bg-error/5' : 'border-warning/30 bg-warning/5'
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)]',
            domainStatus === 'valid' ? 'bg-success/10' : domainStatus === 'invalid' ? 'bg-error/10' : 'bg-warning/10'
          )}>
            {domainStatus === 'valid' ? (
              <Link2 className="h-4 w-4 text-success" />
            ) : domainStatus === 'invalid' ? (
              <AlertTriangle className="h-4 w-4 text-error" />
            ) : domainStatus === 'checking' ? (
              <Spinner size="sm" className="text-text-tertiary" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-warning" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Link de Checkout</h3>
            {domainStatus === 'valid' && (
              <p className="text-xs text-success">
                Domínio válido: {store.domain} — links de checkout funcionarão corretamente
              </p>
            )}
            {domainStatus === 'invalid' && (
              <p className="text-xs text-error">
                Domínio inválido: &quot;{store.domain}&quot; — verifique nas configurações da plataforma
              </p>
            )}
            {domainStatus === 'unknown' && (
              <p className="text-xs text-warning">
                Domínio não configurado — os links de checkout virão da plataforma automaticamente
              </p>
            )}
            {domainStatus === 'checking' && (
              <p className="text-xs text-text-tertiary">Verificando domínio...</p>
            )}
          </div>
        </div>
      </div>

      {/* Sync (Shopify only) */}
      {store.platform === 'SHOPIFY' && (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Sincronizar Carrinhos</h3>
              <p className="text-xs text-text-tertiary">Importar carrinhos abandonados do Shopify</p>
            </div>
            <Button onClick={handleSync} loading={syncing}>
              <Download className="h-4 w-4" />
              {syncing ? 'Sincronizando...' : 'Sincronizar'}
            </Button>
          </div>
          {syncResult && (
            <div className="mt-3 rounded-[var(--radius-md)] bg-success/10 p-3">
              <p className="text-sm font-medium text-success">Sincronização concluída!</p>
              <p className="mt-1 text-xs text-text-secondary">
                {syncResult.totalFetched} encontrados · {syncResult.imported} importados · {syncResult.updated} atualizados · {syncResult.skipped} ignorados
              </p>
            </div>
          )}
          {syncError && (
            <div className="mt-3 rounded-[var(--radius-md)] bg-error/10 p-3">
              <p className="text-sm font-medium text-error">{syncError}</p>
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h3 className="mb-4 text-sm font-semibold text-text-primary">
          Recuperação dos Últimos 7 Dias
        </h3>
        {chartLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner size="sm" className="text-text-tertiary" />
          </div>
        ) : chartData.length > 0 ? (
          <SimpleBarChart data={chartData} />
        ) : (
          <p className="py-8 text-center text-sm text-text-tertiary">Sem dados no período</p>
        )}
      </div>

      {/* Store Info */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <h3 className="mb-3 text-sm font-semibold text-text-primary">Informações</h3>
          <dl className="space-y-3">
            <div className="flex items-center justify-between">
              <dt className="text-sm text-text-secondary">Plataforma</dt>
              <dd className="flex items-center gap-1.5 text-sm font-medium text-text-primary">
                {store.platform === 'SHOPIFY' ? (
                  <><ShoppingBag className="h-4 w-4 text-purple-400" /> Shopify</>
                ) : (
                  <><Cloud className="h-4 w-4 text-blue-400" /> Nuvemshop</>
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm text-text-secondary">Domínio</dt>
              <dd className="text-sm font-medium text-text-primary">{store.domain ?? '-'}</dd>
            </div>
            {store.shopifyDomain && (
              <div className="flex items-center justify-between">
                <dt className="text-sm text-text-secondary">Domínio Shopify</dt>
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
                  <><CheckCircle2 className="h-4 w-4" /> Conectado</>
                ) : (
                  <><XCircle className="h-4 w-4" /> Desconectado</>
                )}
              </dd>
            </div>
            {store.whatsappPhone && (
              <div className="flex items-center justify-between">
                <dt className="text-sm text-text-secondary">Número</dt>
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

  // Test message state
  const [testPhone, setTestPhone] = useState('')
  const [testCartId, setTestCartId] = useState('')
  const [testCarts, setTestCarts] = useState<Array<{ id: string; customerName: string | null; cartTotal: number; platformCartId: string | null }>>([])
  const [generatedMessage, setGeneratedMessage] = useState<string | null>(null)
  const [testLoading, setTestLoading] = useState(false)
  const [testSent, setTestSent] = useState(false)
  const [testError, setTestError] = useState<string | null>(null)
  const [testTokens, setTestTokens] = useState(0)
  const [testCost, setTestCost] = useState(0)

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

  useEffect(() => {
    async function fetchCarts() {
      try {
        const res = await fetch(`/api/carts?storeId=${store.id}&limit=50`)
        const json = await res.json()
        if (json.data) setTestCarts(json.data)
      } catch { /* noop */ }
    }
    fetchCarts()
  }, [store.id])

  async function handleTestPreview() {
    setTestLoading(true)
    setTestError(null)
    setGeneratedMessage(null)
    setTestSent(false)
    try {
      const res = await fetch(`/api/stores/${store.id}/test-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testPhone, cartId: testCartId || undefined, sendWhatsApp: false }),
      })
      const json = await res.json()
      if (!res.ok) {
        setTestError(json.message || 'Erro ao gerar mensagem')
      } else {
        setGeneratedMessage(json.data.message)
        setTestTokens(json.data.tokensUsed)
        setTestCost(json.data.estimatedCost)
      }
    } catch {
      setTestError('Erro de conexão')
    } finally {
      setTestLoading(false)
    }
  }

  async function handleTestSend() {
    setTestLoading(true)
    setTestError(null)
    setTestSent(false)
    try {
      const res = await fetch(`/api/stores/${store.id}/test-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testPhone, cartId: testCartId || undefined, sendWhatsApp: true }),
      })
      const json = await res.json()
      if (!res.ok) {
        setTestError(json.message || 'Erro ao enviar')
      } else {
        setGeneratedMessage(json.data.message)
        setTestSent(json.data.whatsAppSent)
        setTestTokens(json.data.tokensUsed)
        setTestCost(json.data.estimatedCost)
        if (json.data.whatsAppError) {
          setTestError(`WhatsApp: ${json.data.whatsAppError}`)
        }
      }
    } catch {
      setTestError('Erro de conexão')
    } finally {
      setTestLoading(false)
    }
  }

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
    <div className="animate-fade-in space-y-6">
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
              <Spinner size="md" className="text-text-tertiary" />
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
                ? `Conectado ao número ${store.whatsappPhone ?? '(número não registrado)'}`
                : 'Conecte o WhatsApp para começar a recuperar carrinhos'
              }
            </p>
            {liveState && (
              <p className="mt-1 text-xs text-text-tertiary">
                Estado da instância: {liveState}
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
              Abra o WhatsApp Business {'>'} Configurações {'>'} Dispositivos Conectados {'>'} Conectar Dispositivo
            </p>
            <Button onClick={() => setShowModal(true)}>
              Gerar QR Code
            </Button>
          </div>
        </div>
      )}

      {/* WhatsApp Details (when connected) */}
      {liveConnected && (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <h3 className="mb-3 text-sm font-semibold text-text-primary">Detalhes da Conexão</h3>
          <dl className="space-y-3">
            <div className="flex items-center justify-between">
              <dt className="text-sm text-text-secondary">Número</dt>
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
              <dt className="text-sm text-text-secondary">Instância</dt>
              <dd className="text-sm font-medium text-text-primary">recupera-{store.id}</dd>
            </div>
          </dl>
          <div className="mt-4 border-t border-border pt-4">
            <Button variant="danger" loading={statusLoading} onClick={handleDisconnect}>
              <Unplug className="h-4 w-4" />
              Desconectar WhatsApp
            </Button>
          </div>
        </div>
      )}

      {/* Test Recovery */}
      {liveConnected && (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <h3 className="mb-2 text-sm font-semibold text-text-primary">Testar Recuperação</h3>
          <p className="mb-4 text-xs text-text-tertiary">
            Gere uma mensagem de recuperação via IA e envie por WhatsApp para testar o fluxo completo.
          </p>

          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-text-secondary">Número do WhatsApp *</label>
            <Input
              type="text"
              placeholder="5511999999999"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              className="bg-bg-primary"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium text-text-secondary">Carrinho (opcional)</label>
            <select
              value={testCartId}
              onChange={(e) => setTestCartId(e.target.value)}
              className="w-full rounded-[var(--radius-md)] border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
            >
              <option value="">Usar carrinho de teste (R$ 299,90)</option>
              {testCarts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.customerName || c.platformCartId || c.id} — R$ {c.cartTotal.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" loading={testLoading} disabled={!testPhone.trim()} onClick={handleTestPreview}>
              <Eye className="h-4 w-4" />
              Visualizar
            </Button>
            <Button loading={testLoading} disabled={!testPhone.trim()} onClick={handleTestSend}>
              <Send className="h-4 w-4" />
              Enviar Teste
            </Button>
          </div>

          {generatedMessage && (
            <div className="mt-4 rounded-[var(--radius-md)] border border-border bg-bg-tertiary p-3">
              <p className="mb-1 text-xs font-medium text-text-secondary">Mensagem gerada:</p>
              <p className="whitespace-pre-wrap text-sm text-text-primary">{generatedMessage}</p>
              <div className="mt-2 flex items-center gap-3 text-xs text-text-tertiary">
                {testTokens > 0 && <span>Tokens: {testTokens}</span>}
                {testCost > 0 && <span>Custo: ${testCost.toFixed(6)}</span>}
              </div>
            </div>
          )}

          {testSent && (
            <div className="mt-3 rounded-[var(--radius-md)] bg-success/10 p-3">
              <p className="text-sm font-medium text-success">Mensagem enviada com sucesso!</p>
            </div>
          )}

          {testError && (
            <div className="mt-3 rounded-[var(--radius-md)] bg-error/10 p-3">
              <p className="text-sm font-medium text-error">{testError}</p>
            </div>
          )}
        </div>
      )}

      <WhatsappConnectModal
        storeId={store.id}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onStatusChange={handleModalStatusChange}
      />
    </div>
  )
}

function TestModePanel({ store, onUpdate }: { store: StoreData; onUpdate: (s: StoreData) => void }) {
  const [newPhone, setNewPhone] = useState('')
  const [saving, setSaving] = useState(false)

  async function toggleTestMode() {
    setSaving(true)
    try {
      const res = await fetch(`/api/stores/${store.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testMode: !store.testMode }),
      })
      const json = await res.json()
      if (json.data) onUpdate({ ...store, testMode: json.data.testMode })
    } catch { /* noop */ }
    finally { setSaving(false) }
  }

  async function addPhone() {
    const clean = newPhone.replace(/\D/g, '')
    if (!clean || clean.length < 10) return
    const phones = [...(store.testPhones ?? []), clean]
    setSaving(true)
    try {
      const res = await fetch(`/api/stores/${store.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testPhones: phones }),
      })
      const json = await res.json()
      if (json.data) {
        onUpdate({ ...store, testPhones: json.data.testPhones })
        setNewPhone('')
      }
    } catch { /* noop */ }
    finally { setSaving(false) }
  }

  async function removePhone(phone: string) {
    const phones = (store.testPhones ?? []).filter((p: string) => p !== phone)
    setSaving(true)
    try {
      const res = await fetch(`/api/stores/${store.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testPhones: phones }),
      })
      const json = await res.json()
      if (json.data) onUpdate({ ...store, testPhones: json.data.testPhones })
    } catch { /* noop */ }
    finally { setSaving(false) }
  }

  return (
    <section className={cn(
      'rounded-[var(--radius-lg)] border p-5',
      store.testMode
        ? 'border-warning/40 bg-warning/5'
        : 'border-border bg-surface'
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)]',
            store.testMode ? 'bg-warning/10' : 'bg-bg-tertiary'
          )}>
            <ShieldAlert className={cn('h-5 w-5', store.testMode ? 'text-warning' : 'text-text-tertiary')} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Modo de Teste</h3>
            <p className="text-xs text-text-tertiary">
              {store.testMode
                ? 'Ativo — mensagens só são enviadas para números da whitelist'
                : 'Desativado — mensagens podem ser enviadas para qualquer número'
              }
            </p>
          </div>
        </div>
        <Button
          variant={store.testMode ? 'danger' : 'secondary'}
          size="sm"
          loading={saving}
          onClick={toggleTestMode}
        >
          {store.testMode ? 'Desativar' : 'Ativar'}
        </Button>
      </div>

      {store.testMode && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="5535998717592"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="max-w-xs"
            />
            <Button size="sm" variant="secondary" onClick={addPhone} disabled={saving}>
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          </div>

          {(store.testPhones ?? []).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {(store.testPhones ?? []).map((phone: string) => (
                <div
                  key={phone}
                  className="flex items-center gap-1.5 rounded-[var(--radius-md)] border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-text-primary"
                >
                  {phone}
                  <button
                    type="button"
                    onClick={() => removePhone(phone)}
                    className="text-text-tertiary hover:text-error transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-warning">
              Nenhum número adicionado. Adicione pelo menos um número para testar.
            </p>
          )}
        </div>
      )}
    </section>
  )
}

export default function StoreDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlTab = searchParams.get('tab') as TabId | null
  const storeId = params.id as string
  const [activeTab, setActiveTab] = useState<TabId>(urlTab || 'overview')
  const [store, setStore] = useState<StoreData | null>(null)
  const [settings, setSettings] = useState<MockStoreSettings | null>(null)
  const [recoveryConfig, setRecoveryConfig] = useState<MockRecoveryConfig | null>(null)
  const [loading, setLoading] = useState(true)

  const handleWhatsappStatusChange = useCallback((connected: boolean) => {
    setStore((prev) => prev ? { ...prev, whatsappConnected: connected } : prev)
  }, [])

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
    return <PageSpinner message="Carregando loja..." />
  }

  if (!store) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-text-secondary">Loja não encontrada</p>
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

  function handleTabChange(tabId: TabId) {
    setActiveTab(tabId)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', tabId)
    window.history.replaceState({}, '', url.toString())
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Back Button + Store Header */}
      <div>
        <Button variant="ghost" size="sm" onClick={() => router.push('/lojas')} className="mb-3">
          <ArrowLeft className="h-4 w-4" />
          Voltar para Lojas
        </Button>
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
            <Badge variant={store.isActive ? 'success' : 'neutral'} dot>
              {store.isActive ? 'Ativa' : 'Inativa'}
            </Badge>
            <Badge variant={store.whatsappConnected ? 'success' : 'error'} dot>
              <MessageCircle className="h-3 w-3" />
              {store.whatsappConnected ? 'WhatsApp OK' : 'WhatsApp Off'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-0.5 overflow-x-auto px-1" aria-label="Tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
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
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <OverviewTab store={store} />
            <TestModePanel store={store} onUpdate={setStore} />
          </div>
        )}
        {activeTab === 'knowledge' && settings && (
          <div className="space-y-8">
            <StoreSettingsForm settings={settings} onSave={handleSaveSettings} />
            <KnowledgeBaseForm settings={settings} onSave={handleSaveSettings} />
            <ImageLibraryPanel storeId={store.id} />
          </div>
        )}
        {activeTab === 'recovery' && (
          <div className="space-y-6">
            <StageConfigPanel storeId={store.id} />
            <FollowUpConfigPanel storeId={store.id} />
            {recoveryConfig && (
              <RecoveryConfigForm config={recoveryConfig} onSave={handleSaveRecovery} />
            )}
          </div>
        )}
        {activeTab === 'whatsapp' && <WhatsAppTab store={store} onStatusChange={handleWhatsappStatusChange} />}
      </div>
    </div>
  )
}
