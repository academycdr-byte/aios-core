'use client'

import { useState, useEffect } from 'react'
import {
  Bell,
  Palette,
  Shield,
  CreditCard,
  Webhook,
  User,
  Store,
  CheckCircle,
  AlertCircle,
  Moon,
  Sun,
  Copy,
  Check,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react'
import { Badge, Button, Input, Spinner, Toggle } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useTheme } from '@/lib/theme-context'

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

/* ─── Notificações ─── */
function NotificationsSection() {
  const [prefs, setPrefs] = useState(() => {
    if (typeof window === 'undefined') return { recovered: true, abandoned: false, disconnected: true, dailyReport: false }
    try {
      const stored = localStorage.getItem('recupera-notifications')
      return stored ? JSON.parse(stored) : { recovered: true, abandoned: false, disconnected: true, dailyReport: false }
    } catch {
      return { recovered: true, abandoned: false, disconnected: true, dailyReport: false }
    }
  })

  function updatePref(key: string, value: boolean) {
    const next = { ...prefs, [key]: value }
    setPrefs(next)
    localStorage.setItem('recupera-notifications', JSON.stringify(next))
  }

  return (
    <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-warning-light">
          <Bell className="h-5 w-5 text-warning" />
        </div>
        <div>
          <h3 className="font-semibold text-text-primary">Notificações</h3>
          <p className="text-xs text-text-tertiary">Configure alertas de recuperações e vendas</p>
        </div>
      </div>
      <div className="space-y-3">
        <Toggle checked={prefs.recovered} onChange={(v) => updatePref('recovered', v)} label="Carrinho recuperado" />
        <Toggle checked={prefs.abandoned} onChange={(v) => updatePref('abandoned', v)} label="Novo carrinho abandonado" />
        <Toggle checked={prefs.disconnected} onChange={(v) => updatePref('disconnected', v)} label="WhatsApp desconectado" />
        <Toggle checked={prefs.dailyReport} onChange={(v) => updatePref('dailyReport', v)} label="Relatório diário por e-mail" />
      </div>
    </section>
  )
}

/* ─── Aparência ─── */
function AppearanceSection() {
  const { theme, toggleTheme } = useTheme()

  return (
    <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-purple-500/10">
          <Palette className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <h3 className="font-semibold text-text-primary">Aparência</h3>
          <p className="text-xs text-text-tertiary">Tema escuro/claro e personalização visual</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={theme === 'dark' ? undefined : toggleTheme}
          className={cn(
            'flex items-center gap-2 rounded-[var(--radius-lg)] border px-4 py-3 transition-all',
            theme === 'dark' ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-secondary hover:border-border-hover'
          )}
        >
          <Moon className="h-4 w-4" />
          <span className="text-sm font-medium">Escuro</span>
        </button>
        <button
          onClick={theme === 'light' ? undefined : toggleTheme}
          className={cn(
            'flex items-center gap-2 rounded-[var(--radius-lg)] border px-4 py-3 transition-all',
            theme === 'light' ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-secondary hover:border-border-hover'
          )}
        >
          <Sun className="h-4 w-4" />
          <span className="text-sm font-medium">Claro</span>
        </button>
      </div>
    </section>
  )
}

/* ─── Segurança ─── */
function SecuritySection() {
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  async function handleChangePassword() {
    setFeedback(null)
    if (!currentPw || !newPw || !confirmPw) {
      setFeedback({ type: 'error', message: 'Preencha todos os campos' })
      return
    }
    if (newPw.length < 6) {
      setFeedback({ type: 'error', message: 'A nova senha deve ter pelo menos 6 caracteres' })
      return
    }
    if (newPw !== confirmPw) {
      setFeedback({ type: 'error', message: 'As senhas não coincidem' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      })
      const json = await res.json()
      if (!res.ok) {
        setFeedback({ type: 'error', message: json.message || 'Erro ao alterar senha' })
      } else {
        setFeedback({ type: 'success', message: 'Senha alterada com sucesso!' })
        setCurrentPw('')
        setNewPw('')
        setConfirmPw('')
      }
    } catch {
      setFeedback({ type: 'error', message: 'Erro de conexão' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-error-light">
          <Shield className="h-5 w-5 text-error" />
        </div>
        <div>
          <h3 className="font-semibold text-text-primary">Segurança</h3>
          <p className="text-xs text-text-tertiary">Alterar senha e gerenciar sessões</p>
        </div>
      </div>
      <div className="max-w-md space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">Senha atual</label>
          <div className="relative">
            <Input
              type={showCurrent ? 'text' : 'password'}
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">Nova senha</label>
          <div className="relative">
            <Input
              type={showNew ? 'text' : 'password'}
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">Confirmar nova senha</label>
          <Input
            type="password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            placeholder="Repita a nova senha"
          />
        </div>
        {feedback && (
          <div
            className={cn(
              'rounded-[var(--radius-md)] px-3 py-2 text-sm',
              feedback.type === 'success' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
            )}
          >
            {feedback.message}
          </div>
        )}
        <Button onClick={handleChangePassword} loading={saving} variant="secondary">
          <Lock className="h-4 w-4" />
          Alterar Senha
        </Button>
      </div>
    </section>
  )
}

/* ─── Plano e Cobrança ─── */
function BillingSection() {
  return (
    <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-accent-light">
          <CreditCard className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h3 className="font-semibold text-text-primary">Plano e Cobrança</h3>
          <p className="text-xs text-text-tertiary">Gerencie seu plano, faturas e métodos de pagamento</p>
        </div>
      </div>
      <div className="rounded-[var(--radius-md)] border border-accent/30 bg-accent/5 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-text-primary">Plano Beta (Gratuito)</p>
            <p className="text-xs text-text-tertiary">Acesso completo durante o período beta</p>
          </div>
          <Badge variant="success" dot>Ativo</Badge>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-text-secondary">
            <Check className="h-3 w-3 text-success" /> Carrinhos ilimitados
          </div>
          <div className="flex items-center gap-1.5 text-text-secondary">
            <Check className="h-3 w-3 text-success" /> Recuperação por IA
          </div>
          <div className="flex items-center gap-1.5 text-text-secondary">
            <Check className="h-3 w-3 text-success" /> WhatsApp integrado
          </div>
          <div className="flex items-center gap-1.5 text-text-secondary">
            <Check className="h-3 w-3 text-success" /> Analytics completo
          </div>
          <div className="flex items-center gap-1.5 text-text-secondary">
            <Check className="h-3 w-3 text-success" /> Biblioteca de imagens
          </div>
          <div className="flex items-center gap-1.5 text-text-secondary">
            <Check className="h-3 w-3 text-success" /> Seller persona
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs text-text-tertiary">
        Planos pagos com limites maiores e funcionalidades premium serão lançados em breve.
      </p>
    </section>
  )
}

/* ─── API & Webhooks ─── */
function ApiWebhooksSection({ storeId }: { storeId: string | null }) {
  const [copied, setCopied] = useState<string | null>(null)

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const webhookUrl = 'https://recupera-ai-five.vercel.app/api/whatsapp/webhook'

  return (
    <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-info-light">
          <Webhook className="h-5 w-5 text-info" />
        </div>
        <div>
          <h3 className="font-semibold text-text-primary">API & Webhooks</h3>
          <p className="text-xs text-text-tertiary">Chaves de API e configuração de webhooks</p>
        </div>
      </div>
      <div className="space-y-3">
        <div className="rounded-[var(--radius-md)] border border-border bg-bg-tertiary p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-text-tertiary">Webhook URL (Evolution API)</p>
              <p className="mt-0.5 break-all font-mono text-sm text-text-primary">{webhookUrl}</p>
            </div>
            <button
              onClick={() => copyToClipboard(webhookUrl, 'webhook')}
              className="ml-2 shrink-0 rounded-[var(--radius-md)] p-2 text-text-tertiary hover:bg-surface-hover hover:text-text-primary"
            >
              {copied === 'webhook' ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {storeId && (
          <div className="rounded-[var(--radius-md)] border border-border bg-bg-tertiary p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-text-tertiary">Store ID</p>
                <p className="mt-0.5 font-mono text-sm text-text-primary">{storeId}</p>
              </div>
              <button
                onClick={() => copyToClipboard(storeId, 'storeId')}
                className="ml-2 shrink-0 rounded-[var(--radius-md)] p-2 text-text-tertiary hover:bg-surface-hover hover:text-text-primary"
              >
                {copied === 'storeId' ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-success" />
          <span className="text-xs text-text-secondary">API operacional</span>
        </div>
      </div>
    </section>
  )
}

/* ─── Page ─── */
export default function ConfiguracoesPage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [store, setStore] = useState<StoreStatus | null>(null)
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
          const s = json.data
          if (s) {
            setStore({
              id: s.id as string,
              name: s.name as string,
              whatsappConnected: (s.whatsappConnected ?? false) as boolean,
              hasSettings: true,
              hasRecoveryConfig: true,
              platform: s.platform as string,
            })
          }
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
        <h2 className="text-[30px] font-bold text-text-primary" style={{ letterSpacing: '-0.02em' }}>Configurações</h2>
        <p className="mt-1 text-[14px] text-text-tertiary">
          Configurações gerais da sua conta RecuperaAI
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
            <span className="text-xs uppercase tracking-wider text-text-tertiary">Nome</span>
            <p className="mt-0.5 font-medium text-text-primary">{user?.name ?? 'Não configurado'}</p>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider text-text-tertiary">Email</span>
            <p className="mt-0.5 font-medium text-text-primary">{user?.email ?? '-'}</p>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider text-text-tertiary">Plano atual</span>
            <p className="mt-0.5 font-medium text-text-primary">
              Beta (Gratuito)
              <Badge variant="info" size="sm" className="ml-2">Ativo</Badge>
            </p>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider text-text-tertiary">Versão</span>
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
          <h3 className="font-semibold text-text-primary">Minha Loja</h3>
        </div>

        {!store ? (
          <p className="text-sm text-text-secondary">Nenhuma loja conectada ainda.</p>
        ) : (
          <div className="space-y-3">
            {(() => {
              const checks = [
                { label: 'Plataforma', ok: true },
                { label: 'WhatsApp', ok: store.whatsappConnected },
                { label: 'Conhecimento', ok: store.hasSettings },
                { label: 'Recuperação', ok: store.hasRecoveryConfig },
              ]
              const completedChecks = checks.filter((c) => c.ok).length
              const totalChecks = checks.length
              const isReady = completedChecks === totalChecks

              return (
                <div
                  className={cn(
                    'rounded-[var(--radius-md)] border p-3',
                    isReady ? 'border-success/30 bg-success/5' : 'border-border bg-bg-tertiary'
                  )}
                >
                  <div className="mb-2 flex items-center justify-between">
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
            })()}
          </div>
        )}
      </div>

      {/* Functional Sections */}
      <NotificationsSection />
      <AppearanceSection />
      <SecuritySection />
      <BillingSection />
      <ApiWebhooksSection storeId={store?.id ?? null} />
    </div>
  )
}
