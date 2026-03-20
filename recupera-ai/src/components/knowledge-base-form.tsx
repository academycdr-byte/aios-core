'use client'

import { useState } from 'react'
import {
  Save,
  Store,
  Truck,
  RefreshCcw,
  CreditCard,
  Shield,
  HelpCircle,
  Tag,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Timer,
  Ruler,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, Input, Textarea, Toggle } from '@/components/ui'
import type { MockStoreSettings } from '@/lib/mock-stores'

interface KnowledgeBaseFormProps {
  settings: MockStoreSettings
  onSave: (settings: MockStoreSettings) => void
}

// ============================================================
// Knowledge sections definition
// ============================================================

interface KnowledgeField {
  key: keyof MockStoreSettings
  label: string
  placeholder: string
  tip: string
  rows: number
}

interface KnowledgeSection {
  id: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  fields: KnowledgeField[]
}

const SECTIONS: KnowledgeSection[] = [
  {
    id: 'identity',
    icon: Store,
    title: 'Identidade da Loja',
    description: 'Informações básicas sobre sua loja e produtos',
    fields: [
      {
        key: 'storeName',
        label: 'Nome da Loja',
        placeholder: 'Ex: Manto da Classe',
        tip: 'A IA se apresentará usando este nome ao falar com clientes',
        rows: 1,
      },
      {
        key: 'storeDescription',
        label: 'Descrição da Loja',
        placeholder: 'Ex: Loja especializada em camisas de futebol oficiais e retro...',
        tip: 'Ajuda a IA entender o posicionamento e tom da marca',
        rows: 3,
      },
      {
        key: 'mainProducts',
        label: 'Produtos Principais',
        placeholder: 'Ex: Camisas de futebol oficiais, retrô, seleções, personalizadas...',
        tip: 'A IA usará para sugerir alternativas e destacar diferenciais',
        rows: 2,
      },
      {
        key: 'targetAudience',
        label: 'Público-Alvo',
        placeholder: 'Ex: Homens 18-45 anos, apaixonados por futebol, classe B/C...',
        tip: 'Ajusta a linguagem e abordagem da IA',
        rows: 2,
      },
    ],
  },
  {
    id: 'shipping',
    icon: Truck,
    title: 'Política de Envio',
    description: 'Prazos de entrega e condições de frete',
    fields: [
      {
        key: 'shippingPolicy',
        label: 'Detalhes do Envio',
        placeholder: 'Ex: Frete grátis acima de R$299. Entrega em 3-7 dias úteis para todo o Brasil. Rastreamento via Correios/Jadlog...',
        tip: 'Frete é a objeção #1 em e-commerce. Quanto mais detalhado, melhor a IA responde',
        rows: 4,
      },
    ],
  },
  {
    id: 'delivery',
    icon: Timer,
    title: 'Prazos de Entrega',
    description: 'Detalhes sobre prazos por região e modalidade',
    fields: [
      {
        key: 'deliveryTimeframes' as keyof MockStoreSettings,
        label: 'Prazos de Entrega',
        placeholder: 'Ex: São Paulo capital: 1-3 dias úteis. Sudeste: 3-5 dias. Nordeste: 5-8 dias. Norte: 7-12 dias. Frete expresso: +R$ 29,90 (entrega em 24-48h)...',
        tip: 'Prazos detalhados ajudam a IA responder a principal objeção de compras online',
        rows: 4,
      },
    ],
  },
  {
    id: 'returns',
    icon: RefreshCcw,
    title: 'Política de Troca e Devolução',
    description: 'Regras para trocas e reembolsos',
    fields: [
      {
        key: 'returnPolicy',
        label: 'Detalhes de Troca/Devolução',
        placeholder: 'Ex: Troca gratuita em até 30 dias. Devolução com reembolso integral. Produto deve estar sem uso...',
        tip: 'Clientes indecisos se tranquilizam ao saber que podem trocar/devolver',
        rows: 4,
      },
    ],
  },
  {
    id: 'payment',
    icon: CreditCard,
    title: 'Formas de Pagamento',
    description: 'Métodos aceitos e condições',
    fields: [
      {
        key: 'paymentMethods',
        label: 'Métodos de Pagamento',
        placeholder: 'Ex: PIX (5% desconto), Cartão até 12x sem juros, Boleto (3 dias), Google Pay, Apple Pay...',
        tip: 'A IA pode sugerir método alternativo quando o original falha (ex: PIX se cartão recusou)',
        rows: 3,
      },
    ],
  },
  {
    id: 'warranty',
    icon: Shield,
    title: 'Garantia',
    description: 'Informações de garantia dos produtos',
    fields: [
      {
        key: 'warrantyPolicy',
        label: 'Política de Garantia',
        placeholder: 'Ex: Garantia de 90 dias contra defeitos de fabricação. Produtos oficiais com garantia do fabricante...',
        tip: 'Garantia robusta aumenta a confiança e ajuda a IA fechar vendas',
        rows: 3,
      },
    ],
  },
  {
    id: 'sizes',
    icon: Ruler,
    title: 'Tabela de Tamanhos',
    description: 'Guia de medidas para ajudar o cliente a escolher',
    fields: [
      {
        key: 'sizeGuide' as keyof MockStoreSettings,
        label: 'Guia de Tamanhos',
        placeholder: 'Ex: P: Busto 88-92cm, Cintura 68-72cm. M: Busto 92-96cm, Cintura 72-76cm. G: Busto 96-100cm. GG: Busto 100-104cm. Na dúvida entre dois tamanhos, recomendamos o maior...',
        tip: 'Tamanho errado é o principal motivo de troca. Informação clara reduz devoluções',
        rows: 5,
      },
    ],
  },
  {
    id: 'specs',
    icon: FileText,
    title: 'Especificações dos Produtos',
    description: 'Detalhes técnicos, materiais e composição',
    fields: [
      {
        key: 'productSpecs' as keyof MockStoreSettings,
        label: 'Especificações Técnicas',
        placeholder: 'Ex: Material: 100% poliéster Dri-FIT. Tecnologia: absorção de suor, secagem rápida. Escudo: bordado. Patrocinador: sublimado. Lavagem: máquina a frio, não usar alvejante...',
        tip: 'Especificações detalhadas aumentam confiança e reduzem dúvidas pré-compra',
        rows: 5,
      },
    ],
  },
  {
    id: 'faq',
    icon: HelpCircle,
    title: 'Perguntas Frequentes (FAQ)',
    description: 'Dúvidas comuns que a IA deve saber responder',
    fields: [
      {
        key: 'faqContent',
        label: 'FAQ',
        placeholder: 'Ex:\nP: Qual o prazo de entrega?\nR: 3-7 dias úteis para todo o Brasil.\n\nP: Posso trocar o tamanho?\nR: Sim, troca gratuita em até 30 dias.\n\nP: O produto é original?\nR: Sim, todos os produtos são 100% originais com nota fiscal.',
        tip: 'Use formato Pergunta/Resposta. A IA usará para responder dúvidas automaticamente',
        rows: 6,
      },
    ],
  },
  {
    id: 'offers',
    icon: Tag,
    title: 'Ofertas e Descontos',
    description: 'Promoções ativas que a IA pode oferecer',
    fields: [
      {
        key: 'currentOffers',
        label: 'Ofertas Atuais',
        placeholder: 'Ex: Frete grátis acima de R$299. Compre 2 camisas e ganhe 10% de desconto. PIX com 5% off...',
        tip: 'A IA usará estas ofertas como argumento para fechar a venda',
        rows: 3,
      },
    ],
  },
  {
    id: 'instructions',
    icon: Sparkles,
    title: 'Instruções Personalizadas',
    description: 'Regras especiais para a IA seguir',
    fields: [
      {
        key: 'customInstructions',
        label: 'Instruções para a IA',
        placeholder: 'Ex: Sempre mencionar frete grátis acima de R$299. Nunca oferecer desconto maior que 10%. Se perguntar sobre entrega internacional, informar que não fazemos...',
        tip: 'Instruções personalizadas têm prioridade máxima no comportamento da IA',
        rows: 5,
      },
    ],
  },
]

// ============================================================
// Completeness score calculation
// ============================================================

const SCORED_FIELDS: (keyof MockStoreSettings)[] = [
  'storeName',
  'storeDescription',
  'mainProducts',
  'targetAudience',
  'shippingPolicy',
  'deliveryTimeframes',
  'returnPolicy',
  'paymentMethods',
  'warrantyPolicy',
  'sizeGuide',
  'productSpecs',
  'faqContent',
  'currentOffers',
  'customInstructions',
]

function computeScore(form: MockStoreSettings): { filled: number; total: number; percent: number } {
  const total = SCORED_FIELDS.length
  const filled = SCORED_FIELDS.filter((key) => {
    const val = form[key]
    return typeof val === 'string' && val.trim().length > 0
  }).length
  const percent = total > 0 ? Math.round((filled / total) * 100) : 0
  return { filled, total, percent }
}

function isSectionComplete(form: MockStoreSettings, section: KnowledgeSection): boolean {
  return section.fields.every((field) => {
    const val = form[field.key]
    return typeof val === 'string' && val.trim().length > 0
  })
}

// ============================================================
// Message Preview Generator
// ============================================================

function generatePreviewMessage(form: MockStoreSettings): string {
  const name = form.storeName || 'Sua Loja'
  const customerName = 'Maria'
  const product = form.mainProducts?.split(',')[0]?.trim() || 'um produto incrível'
  const shipping = form.shippingPolicy ? '📦 ' + form.shippingPolicy.split('.')[0] + '.' : ''
  const offer = form.currentOffers ? '🏷️ ' + form.currentOffers.split('.')[0] + '!' : ''
  const payment = form.paymentMethods ? 'Aceitamos ' + form.paymentMethods.split(',').slice(0, 2).join(' e ').trim() + '.' : ''

  const lines = [
    `Oi ${customerName}! 😊 Aqui é da ${name}.`,
    '',
    `Vi que você estava de olho em ${product} e o carrinho ficou esperando!`,
  ]

  if (offer) {
    lines.push('', offer)
  }

  if (shipping) {
    lines.push('', shipping)
  }

  if (form.canOfferDiscount && form.couponCode) {
    lines.push('', `🎁 Use o cupom ${form.couponCode} e ganhe ${form.couponDiscount ?? 10}% de desconto!`)
  }

  if (payment) {
    lines.push('', `💳 ${payment}`)
  }

  lines.push('', 'Quer que eu te ajude a finalizar? 😉')

  return lines.join('\n')
}

// ============================================================
// Component
// ============================================================

export function KnowledgeBaseForm({ settings: initial, onSave }: KnowledgeBaseFormProps) {
  const [form, setForm] = useState<MockStoreSettings>({ ...initial })
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['identity']))

  const score = computeScore(form)

  function update<K extends keyof MockStoreSettings>(key: K, value: MockStoreSettings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function toggleSection(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function handleSave() {
    setSaving(true)
    setTimeout(() => {
      onSave(form)
      setSaving(false)
    }, 600)
  }

  return (
    <div className="space-y-6">
      {/* How AI Uses Your Data — Visual Guide */}
      <div className="rounded-[var(--radius-lg)] border border-dashed border-accent/30 bg-accent/5 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-accent">
          Como a IA usa seus dados
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 rounded-[var(--radius-md)] bg-surface px-3 py-2 border border-border">
            <BookOpen className="h-3.5 w-3.5 text-accent" />
            <span className="text-text-secondary">Seus dados</span>
          </div>
          <span className="text-text-tertiary">→</span>
          <div className="flex items-center gap-1.5 rounded-[var(--radius-md)] bg-surface px-3 py-2 border border-border">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span className="text-text-secondary">IA personaliza</span>
          </div>
          <span className="text-text-tertiary">→</span>
          <div className="flex items-center gap-1.5 rounded-[var(--radius-md)] bg-surface px-3 py-2 border border-border">
            <Store className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-text-secondary">Mensagem natural</span>
          </div>
        </div>
        <p className="mt-3 text-center text-[11px] text-text-tertiary">
          A IA combina as informações abaixo com o contexto do carrinho abandonado para criar mensagens personalizadas e naturais via WhatsApp.
        </p>
      </div>

      {/* Score Header */}
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-accent-light">
            <BookOpen className="h-4 w-4 text-accent" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-text-primary">
              Base de Conhecimento da IA
            </h3>
            <p className="text-xs text-text-tertiary">
              Quanto mais completa, melhor a IA recupera carrinhos!
            </p>
          </div>
          <div className="text-right">
            <span className={cn(
              'text-2xl font-bold',
              score.percent >= 80 ? 'text-success' : score.percent >= 50 ? 'text-warning' : 'text-error'
            )}>
              {score.percent}%
            </span>
            <p className="text-xs text-text-tertiary">
              {score.filled} de {score.total} campos
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 w-full rounded-full bg-bg-tertiary">
          <div
            className={cn(
              'h-2 rounded-full transition-all duration-500',
              score.percent >= 80 ? 'bg-success' : score.percent >= 50 ? 'bg-warning' : 'bg-error'
            )}
            style={{ width: `${score.percent}%` }}
          />
        </div>
      </div>

      {/* Sections */}
      {SECTIONS.map((section) => {
        const Icon = section.icon
        const isExpanded = expanded.has(section.id)
        const complete = isSectionComplete(form, section)

        return (
          <div
            key={section.id}
            className="rounded-[var(--radius-lg)] border border-border bg-surface overflow-hidden"
          >
            {/* Section Header (clickable) */}
            <button
              type="button"
              onClick={() => toggleSection(section.id)}
              className="flex w-full items-center gap-3 p-4 text-left hover:bg-surface-hover transition-colors"
            >
              <div className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)]',
                complete ? 'bg-success/10' : 'bg-accent-light'
              )}>
                <Icon className={cn('h-4 w-4', complete ? 'text-success' : 'text-accent')} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-text-primary">{section.title}</h3>
                  {complete ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-warning" />
                  )}
                </div>
                <p className="text-xs text-text-tertiary">{section.description}</p>
              </div>
              <ChevronDown className={cn(
                'h-4 w-4 text-text-tertiary transition-transform',
                isExpanded && 'rotate-180'
              )} />
            </button>

            {/* Section Content */}
            {isExpanded && (
              <div className="border-t border-border px-4 pb-4 pt-3 space-y-4 animate-fade-in">
                {section.fields.map((field) => {
                  const value = form[field.key] as string
                  const charCount = typeof value === 'string' ? value.length : 0

                  return (
                    <div key={field.key}>
                      <label className="mb-1.5 block text-sm font-medium text-text-primary">
                        {field.label}
                      </label>
                      {field.rows === 1 ? (
                        <Input
                          type="text"
                          value={value ?? ''}
                          onChange={(e) => update(field.key, e.target.value as MockStoreSettings[typeof field.key])}
                          placeholder={field.placeholder}
                        />
                      ) : (
                        <Textarea
                          value={value ?? ''}
                          onChange={(e) => update(field.key, e.target.value as MockStoreSettings[typeof field.key])}
                          rows={field.rows}
                          placeholder={field.placeholder}
                        />
                      )}
                      <div className="mt-1 flex items-center justify-between">
                        <p className="text-xs text-text-tertiary">{field.tip}</p>
                        {field.rows > 1 && (
                          <span className="text-xs text-text-tertiary">{charCount} caracteres</span>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Discount sub-section for offers */}
                {section.id === 'offers' && (
                  <div className="space-y-3 rounded-[var(--radius-md)] border border-dashed border-border bg-bg-tertiary p-3">
                    <Toggle
                      checked={form.canOfferDiscount}
                      onChange={(v) => update('canOfferDiscount', v)}
                      label="IA pode oferecer desconto?"
                    />

                    {form.canOfferDiscount && (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 animate-fade-in">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-text-secondary">
                            Desconto Máximo (%)
                          </label>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={form.maxDiscountPercent ?? 0}
                            onChange={(e) => update('maxDiscountPercent', Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-text-secondary">
                            Código do Cupom
                          </label>
                          <Input
                            type="text"
                            value={form.couponCode ?? ''}
                            onChange={(e) => update('couponCode', e.target.value)}
                            placeholder="VOLTA10"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-text-secondary">
                            Valor do Cupom (%)
                          </label>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={form.couponDiscount ?? 0}
                            onChange={(e) => update('couponDiscount', Number(e.target.value))}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Message Preview — AC5 */}
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-accent-light">
            <Sparkles className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Preview da Mensagem</h3>
            <p className="text-xs text-text-tertiary">
              Exemplo de como a IA usaria seus dados para recuperar um carrinho
            </p>
          </div>
        </div>

        <div className="rounded-[var(--radius-md)] bg-bg-tertiary p-4">
          <div className="flex items-start gap-2 mb-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div className="flex-1 rounded-[var(--radius-md)] bg-surface border border-border p-3">
              <p className="text-sm text-text-primary whitespace-pre-wrap">
                {generatePreviewMessage(form)}
              </p>
            </div>
          </div>
          <p className="text-[10px] text-text-tertiary ml-9">
            Esta é uma simulação. A mensagem real será personalizada pela IA com base no carrinho do cliente.
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button loading={saving} onClick={handleSave}>
          {!saving && <Save className="h-4 w-4" />}
          {saving ? 'Salvando...' : 'Salvar Base de Conhecimento'}
        </Button>
      </div>
    </div>
  )
}
