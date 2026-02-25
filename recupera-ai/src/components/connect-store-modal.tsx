'use client'

import { useState } from 'react'
import { X, ShoppingBag, Cloud, ArrowRight, ArrowLeft, CheckCircle2, Info, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Platform } from '@/generated/prisma/enums'

interface ConnectStoreModalProps {
  open: boolean
  onClose: () => void
  onConnect: (data: ConnectStoreData) => void
}

export interface ConnectStoreData {
  platform: Platform
  name: string
  domain: string
  clientId?: string
  clientSecret?: string
  accessToken?: string
  nuvemshopStoreId?: string
}

const PLATFORMS = [
  {
    id: 'SHOPIFY' as Platform,
    name: 'Shopify',
    description: 'Conecte via OAuth com Client ID e Secret',
    icon: ShoppingBag,
    color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    colorHover: 'hover:border-purple-500/50 hover:bg-purple-500/15',
  },
  {
    id: 'NUVEMSHOP' as Platform,
    name: 'Nuvemshop',
    description: 'Conecte sua loja Nuvemshop via autorizacao',
    icon: Cloud,
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    colorHover: 'hover:border-blue-500/50 hover:bg-blue-500/15',
  },
] as const

export function ConnectStoreModal({ open, onClose, onConnect }: ConnectStoreModalProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [platform, setPlatform] = useState<Platform | null>(null)
  const [loading, setLoading] = useState(false)

  // Shopify fields
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')

  // Nuvemshop fields
  const [nuvemshopStoreId, setNuvemshopStoreId] = useState('')
  const [accessToken, setAccessToken] = useState('')

  function resetForm() {
    setStep(1)
    setPlatform(null)
    setLoading(false)
    setName('')
    setDomain('')
    setClientId('')
    setClientSecret('')
    setNuvemshopStoreId('')
    setAccessToken('')
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  function handleSelectPlatform(p: Platform) {
    setPlatform(p)
    setStep(2)
  }

  function canConnect(): boolean {
    if (!platform) return false
    if (platform === 'SHOPIFY') {
      return domain.trim().length > 0 && clientId.trim().length > 0 && clientSecret.trim().length > 0
    }
    return nuvemshopStoreId.trim().length > 0
  }

  async function handleConnect() {
    if (!platform || !canConnect()) return
    setLoading(true)

    onConnect({
      platform,
      name: name.trim() || domain.trim(),
      domain: domain.trim(),
      clientId: platform === 'SHOPIFY' ? clientId.trim() : undefined,
      clientSecret: platform === 'SHOPIFY' ? clientSecret.trim() : undefined,
      accessToken: platform === 'NUVEMSHOP' ? accessToken.trim() : undefined,
      nuvemshopStoreId: platform === 'NUVEMSHOP' ? nuvemshopStoreId.trim() : undefined,
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg animate-fade-in rounded-[var(--radius-xl)] border border-border bg-bg-secondary shadow-[var(--shadow-xl)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              Conectar Nova Loja
            </h2>
            <p className="text-sm text-text-tertiary">
              Passo {step} de 2
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-[var(--radius-md)] p-1.5 text-text-tertiary hover:bg-surface-hover hover:text-text-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 px-6 py-3">
          {[1, 2].map((s) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                  s <= step
                    ? 'bg-accent text-text-inverse'
                    : 'bg-surface-hover text-text-tertiary'
                )}
              >
                {s < step ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  s
                )}
              </div>
              {s < 2 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 rounded-full transition-colors',
                    s < step ? 'bg-accent' : 'bg-border'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Step 1: Choose Platform */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-text-secondary">
                Escolha a plataforma da sua loja:
              </p>
              {PLATFORMS.map((p) => {
                const Icon = p.icon
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPlatform(p.id)}
                    className={cn(
                      'flex w-full items-center gap-4 rounded-[var(--radius-lg)] border p-4 text-left transition-all',
                      p.color,
                      p.colorHover
                    )}
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)]">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-text-primary">{p.name}</p>
                      <p className="text-xs text-text-secondary">{p.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-text-tertiary" />
                  </button>
                )
              })}
            </div>
          )}

          {/* Step 2: Shopify OAuth Credentials */}
          {step === 2 && platform === 'SHOPIFY' && (
            <div className="space-y-4">
              {/* Instructions box */}
              <div className="flex gap-3 rounded-[var(--radius-lg)] border border-accent/20 bg-accent/5 p-4">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <div className="text-xs text-text-secondary">
                  <p className="mb-1 font-semibold text-text-primary">Como obter as credenciais:</p>
                  <ol className="list-inside list-decimal space-y-0.5">
                    <li>Acesse o Dev Dashboard da Shopify (dev.shopify.com)</li>
                    <li>Selecione ou crie um app para a loja</li>
                    <li>Va em Configuracoes do app</li>
                    <li>Copie o ID do cliente e a Chave secreta</li>
                  </ol>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">
                  Nome do Cliente
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: CDR Group, Manto Classe, Space Sports..."
                  className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary"
                />
                <p className="mt-1 text-xs text-text-tertiary">
                  Opcional. Facilita identificar a loja nas tasks e selecoes.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">
                  Dominio da loja
                </label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="minha-loja.myshopify.com"
                  className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary"
                />
                <p className="mt-1 text-xs text-text-tertiary">
                  Exemplo: minha-loja ou minha-loja.myshopify.com
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">
                  Client ID (ID do cliente)
                </label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="ID do cliente do app Shopify"
                  className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">
                  Client Secret (Chave secreta)
                </label>
                <input
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="Chave secreta do app Shopify"
                  className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary"
                />
              </div>
            </div>
          )}

          {/* Step 2: Nuvemshop */}
          {step === 2 && platform === 'NUVEMSHOP' && (
            <div className="space-y-4">
              <p className="text-sm text-text-secondary">
                Insira os dados da sua loja Nuvemshop:
              </p>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">
                  Nome do Cliente
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: FutFanatics, Nike Store..."
                  className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">
                  ID da Loja Nuvemshop
                </label>
                <input
                  type="text"
                  value={nuvemshopStoreId}
                  onChange={(e) => setNuvemshopStoreId(e.target.value)}
                  placeholder="12345"
                  className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary"
                />
                <p className="mt-1 text-xs text-text-tertiary">
                  Encontre o ID no painel da Nuvemshop
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">
                  Token de Autorizacao
                </label>
                <input
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="Token de acesso"
                  className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <div>
            {step > 1 && (
              <button
                onClick={() => setStep(1)}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-hover hover:text-text-primary disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              disabled={loading}
              className="rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-hover hover:text-text-primary disabled:opacity-50"
            >
              Cancelar
            </button>
            {step === 2 && (
              <button
                onClick={handleConnect}
                disabled={!canConnect() || loading}
                className="flex items-center gap-1.5 rounded-[var(--radius-md)] bg-accent px-5 py-2 text-sm font-semibold text-text-inverse hover:bg-accent-hover disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Conectar {platform === 'SHOPIFY' ? 'Shopify' : 'Nuvemshop'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
