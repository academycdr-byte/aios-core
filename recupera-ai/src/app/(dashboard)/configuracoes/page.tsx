'use client'

import { Settings, Bell, Palette, Shield, CreditCard, Webhook } from 'lucide-react'
import { Badge } from '@/components/ui'

const SETTINGS_CARDS = [
  { icon: Bell, title: 'Notificacoes', desc: 'Configure alertas de novas recuperacoes e vendas', soon: true },
  { icon: Palette, title: 'Aparencia', desc: 'Tema escuro/claro e personalizacao visual', soon: true },
  { icon: Shield, title: 'Seguranca', desc: 'Alterar senha, 2FA e sessoes ativas', soon: true },
  { icon: CreditCard, title: 'Plano e Cobranca', desc: 'Gerencie seu plano, faturas e metodos de pagamento', soon: true },
  { icon: Webhook, title: 'API & Webhooks', desc: 'Chaves de API e configuracao de webhooks', soon: true },
  { icon: Settings, title: 'Conta', desc: 'Dados pessoais, email e preferencias', soon: true },
]

export default function ConfiguracoesPage() {
  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-text-primary">Configuracoes</h2>
        <p className="mt-1 text-text-secondary">
          Configuracoes gerais da sua conta RecuperaAI
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {SETTINGS_CARDS.map((item) => (
          <div
            key={item.title}
            className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 transition-colors hover:border-border-hover"
          >
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-accent-light">
                <item.icon className="h-5 w-5 text-accent" />
              </div>
              <h3 className="font-semibold text-text-primary">{item.title}</h3>
              {item.soon && (
                <Badge variant="info" size="sm">Em breve</Badge>
              )}
            </div>
            <p className="text-sm text-text-secondary">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
        <h3 className="mb-4 font-semibold text-text-primary">Informacoes da Conta</h3>
        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <div>
            <span className="text-text-secondary">Plano atual</span>
            <p className="font-medium text-text-primary">Beta (Gratuito)</p>
          </div>
          <div>
            <span className="text-text-secondary">Lojas conectadas</span>
            <p className="font-medium text-text-primary">2 de 5</p>
          </div>
          <div>
            <span className="text-text-secondary">Mensagens este mes</span>
            <p className="font-medium text-text-primary">0 / 1.000</p>
          </div>
          <div>
            <span className="text-text-secondary">Versao</span>
            <p className="font-medium text-text-primary">RecuperaAI v0.1.0 (MVP)</p>
          </div>
        </div>
      </div>
    </div>
  )
}
