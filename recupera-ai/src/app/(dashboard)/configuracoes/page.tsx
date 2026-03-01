'use client'

import { useState, useEffect } from 'react'
import {
  Settings,
  Bell,
  Palette,
  Shield,
  CreditCard,
  Webhook,
  User,
  Store,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { Badge, Button, Spinner } from '@/components/ui'
import { cn } from '@/lib/utils'

interface UserData {
  name: string
  email: string
}

interface StoreStatus {
  id: string
  name: string
  whatsappConnected: boolean
  hasSettings: boolean
  hasRecoveryConfig: boolean
  platform: string
}

const COMING_SOON_CARDS = [
  { icon: Bell, title: 'Notificacoes', desc: 'Configure alertas de novas recuperacoes e vendas' },
  { icon: Palette, title: 'Aparencia', desc: 'Tema escuro/claro e personalizacao visual' },
  { icon: Shield, title: 'Seguranca', desc: 'Alterar senha, 2FA e sessoes ativas' },
  { icon: CreditCard, title: 'Plano e Cobranca', desc: 'Gerencie seu plano, faturas e metodos de pagamento' },
  { icon: Webhook, title: 'API & Webhooks', desc: 'Chaves de API e configuracao de webhooks' },
]

export default function ConfiguracoesPage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [stores, setStores] = useState<StoreStatus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [userRes, storesRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/stores'),
        ])

        if (userRes.ok) {
          const json = await userRes.json()
          setUser(json.data ?? json.user ?? null)
        }

        if (storesRes.ok) {
          const json = await storesRes.json()
          const storeList = json.data ?? []
          setStores(storeList.map((s: Record<string, unknown>) => ({
            id: s.id,
            name: s.name,
            whatsappConnected: s.whatsappConnected ?? false,
            hasSettings: true,
            hasRecoveryConfig: true,
            platform: s.platform,
          })))
        }
      } catch (error) {
        console.error('Failed to fetch settings data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-text-primary">Configuracoes</h2>
        <p className="mt-1 text-text-secondary">
          Configuracoes gerais da sua conta RecuperaAI
        </p>
      </div>

      {/* Account Info */}
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-accent-light">
            <User className="h-5 w-5 text-accent" />
          </div>
          <h3 className="font-semibold text-text-primary">Conta</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <div>
            <span className="text-text-tertiary text-xs uppercase tracking-wider">Nome</span>
            <p className="mt-0.5 font-medium text-text-primary">{user?.name ?? 'Nao configurado'}</p>
          </div>
          <div>
            <span className="text-text-tertiary text-xs uppercase tracking-wider">Email</span>
            <p className="mt-0.5 font-medium text-text-primary">{user?.email ?? '-'}</p>
          </div>
          <div>
            <span className="text-text-tertiary text-xs uppercase tracking-wider">Plano atual</span>
            <p className="mt-0.5 font-medium text-text-primary">
              Beta (Gratuito)
              <Badge variant="info" size="sm" className="ml-2">Ativo</Badge>
            </p>
          </div>
          <div>
            <span className="text-text-tertiary text-xs uppercase tracking-wider">Versao</span>
            <p className="mt-0.5 font-medium text-text-primary">RecuperaAI v0.2.0</p>
          </div>
        </div>
      </div>

      {/* Store Setup Status */}
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-accent-light">
            <Store className="h-5 w-5 text-accent" />
          </div>
          <h3 className="font-semibold text-text-primary">Status das Lojas</h3>
          <Badge variant="neutral" size="sm">{stores.length} lojas</Badge>
        </div>

        {stores.length === 0 ? (
          <p className="text-sm text-text-secondary">Nenhuma loja cadastrada ainda.</p>
        ) : (
          <div className="space-y-3">
            {stores.map((store) => {
              const checks = [
                { label: 'Plataforma', ok: true },
                { label: 'WhatsApp', ok: store.whatsappConnected },
                { label: 'Conhecimento', ok: store.hasSettings },
                { label: 'Recuperacao', ok: store.hasRecoveryConfig },
              ]
              const completedChecks = checks.filter((c) => c.ok).length
              const totalChecks = checks.length
              const isReady = completedChecks === totalChecks

              return (
                <div
                  key={store.id}
                  className={cn(
                    'rounded-[var(--radius-md)] border p-3',
                    isReady ? 'border-success/30 bg-success/5' : 'border-border bg-bg-tertiary'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">{store.name}</span>
                      <Badge variant="neutral" size="sm">{store.platform}</Badge>
                    </div>
                    <span className={cn(
                      'text-xs font-medium',
                      isReady ? 'text-success' : 'text-warning'
                    )}>
                      {completedChecks}/{totalChecks} configurado
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {checks.map((check) => (
                      <div key={check.label} className="flex items-center gap-1">
                        {check.ok ? (
                          <CheckCircle className="h-3 w-3 text-success" />
                        ) : (
                          <AlertCircle className="h-3 w-3 text-warning" />
                        )}
                        <span className="text-[11px] text-text-secondary">{check.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Coming Soon Cards */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-text-secondary">Em desenvolvimento</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {COMING_SOON_CARDS.map((item) => (
            <div
              key={item.title}
              className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 opacity-60 transition-colors"
            >
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-bg-tertiary">
                  <item.icon className="h-5 w-5 text-text-tertiary" />
                </div>
                <h3 className="text-sm font-semibold text-text-primary">{item.title}</h3>
                <Badge variant="info" size="sm">Em breve</Badge>
              </div>
              <p className="text-xs text-text-secondary">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
