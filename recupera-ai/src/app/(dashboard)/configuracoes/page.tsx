'use client'

import { Settings, Bell, Palette, Shield, CreditCard, Webhook } from 'lucide-react'

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">Configuracoes</h2>
        <p className="text-[var(--text-secondary)] mt-1">
          Configuracoes gerais da sua conta RecuperaAI
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { icon: Bell, title: 'Notificacoes', desc: 'Configure alertas de novas recuperacoes e vendas', soon: true },
          { icon: Palette, title: 'Aparencia', desc: 'Tema escuro/claro e personalizacao visual', soon: true },
          { icon: Shield, title: 'Seguranca', desc: 'Alterar senha, 2FA e sessoes ativas', soon: true },
          { icon: CreditCard, title: 'Plano e Cobranca', desc: 'Gerencie seu plano, faturas e metodos de pagamento', soon: true },
          { icon: Webhook, title: 'API & Webhooks', desc: 'Chaves de API e configuracao de webhooks', soon: true },
          { icon: Settings, title: 'Conta', desc: 'Dados pessoais, email e preferencias', soon: true },
        ].map((item) => (
          <div
            key={item.title}
            className="p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)]/30 transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-[var(--accent)]/10">
                <item.icon className="w-5 h-5 text-[var(--accent)]" />
              </div>
              <h3 className="font-semibold text-[var(--text-primary)]">{item.title}</h3>
              {item.soon && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
                  Em breve
                </span>
              )}
            </div>
            <p className="text-sm text-[var(--text-secondary)]">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
        <h3 className="font-semibold text-[var(--text-primary)] mb-4">Informacoes da Conta</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-[var(--text-secondary)]">Plano atual</span>
            <p className="font-medium text-[var(--text-primary)]">Beta (Gratuito)</p>
          </div>
          <div>
            <span className="text-[var(--text-secondary)]">Lojas conectadas</span>
            <p className="font-medium text-[var(--text-primary)]">2 de 5</p>
          </div>
          <div>
            <span className="text-[var(--text-secondary)]">Mensagens este mes</span>
            <p className="font-medium text-[var(--text-primary)]">0 / 1.000</p>
          </div>
          <div>
            <span className="text-[var(--text-secondary)]">Versao</span>
            <p className="font-medium text-[var(--text-primary)]">RecuperaAI v0.1.0 (MVP)</p>
          </div>
        </div>
      </div>
    </div>
  )
}
