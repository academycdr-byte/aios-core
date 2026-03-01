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
import { cn } from '@/lib/utils'
import { StoreSettingsForm } from '@/components/store-settings-form'
import { RecoveryConfigForm } from '@/components/recovery-config-form'
import { StageConfigPanel } from '@/components/stage-config-panel'
import { FollowUpConfigPanel } from '@/components/follow-up-config-panel'
import { KnowledgeBaseForm } from '@/components/knowledge-base-form'
import { WhatsappConnectModal } from '@/components/whatsapp-connect-modal'
import { Button, Badge, Input, Spinner, PageSpinner } from '@/components/ui'
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
      setSyncError('Erro de conexao')
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
                Dominio valido: {store.domain} — links de checkout funcionarao corretamente
              </p>
            )}
            {domainStatus === 'invalid' && (
              <p className="text-xs text-error">
                Dominio invalido: &quot;{store.domain}&quot; — verifique nas configuracoes da plataforma
              </p>
            )}
            {domainStatus === 'unknown' && (
              <p className="text-xs text-warning">
                Dominio nao configurado — os links de checkout virao da plataforma automaticamente
              </p>
            )}
            {domainStatus === 'checking' && (
              <p className="text-xs text-text-tertiary">Verificando dominio...</p>
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
              <p className="text-sm font-medium text-success">Sincronizacao concluida!</p>
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
          Recuperacao dos Ultimos 7 Dias
        </h3>
        {chartLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner size="sm" className="text-text-tertiary" />
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
                  <><ShoppingBag className="h-4 w-4 text-purple-400" /> Shopify</>
                ) : (
                  <><Cloud className="h-4 w-4 text-blue-400" /> Nuvemshop</>
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
                  <><CheckCircle2 className="h-4 w-4" /> Conectado</>
                ) : (
                  <><XCircle className="h-4 w-4" /> Desconectado</>
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
      setTestError('Erro de conexao')
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
      setTestError('Erro de conexao')
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
            <Button onClick={() => setShowModal(true)}>
              Gerar QR Code
            </Button>
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
          <h3 className="mb-2 text-sm font-semibold text-text-primary">Testar Recuperacao</h3>
          <p className="mb-4 text-xs text-text-tertiary">
            Gere uma mensagem de recuperacao via IA e envie por WhatsApp para testar o fluxo completo.
          </p>

          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-text-secondary">Numero do WhatsApp *</label>
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
                ? 'Ativo — mensagens so sao enviadas para numeros da whitelist'
                : 'Desativado — mensagens podem ser enviadas para qualquer numero'
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
              Nenhum numero adicionado. Adicione pelo menos um numero para testar.
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
  const storeId = params.id as string
  const [activeTab, setActiveTab] = useState<TabId>('overview')
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
          <div className="space-y-6">
            <TestModePanel store={store} onUpdate={setStore} />
            <StoreSettingsForm settings={settings} onSave={handleSaveSettings} />
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
