'use client'

import { useState } from 'react'
import {
  Zap,
  Clock,
  MessageSquare,
  GitBranch,
  Bot,
  XCircle,
  ChevronDown,
  Filter,
  UserCheck,
  PhoneOff,
  Edit3,
  Save,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, Toggle } from '@/components/ui'
import type { MockRecoveryConfig } from '@/lib/mock-stores'

// ============================================================
// Flow Node Types
// ============================================================

type NodeVariant = 'trigger' | 'condition' | 'delay' | 'message' | 'ai' | 'end'

interface FlowNodeProps {
  variant: NodeVariant
  icon: React.ComponentType<{ className?: string }>
  title: string
  subtitle?: string
  children?: React.ReactNode
  active?: boolean
}

const VARIANT_STYLES: Record<NodeVariant, { bg: string; border: string; iconBg: string; iconColor: string }> = {
  trigger: { bg: 'bg-purple-500/5', border: 'border-purple-500/30', iconBg: 'bg-purple-500/15', iconColor: 'text-purple-400' },
  condition: { bg: 'bg-amber-500/5', border: 'border-amber-500/30', iconBg: 'bg-amber-500/15', iconColor: 'text-amber-400' },
  delay: { bg: 'bg-blue-500/5', border: 'border-blue-500/30', iconBg: 'bg-blue-500/15', iconColor: 'text-blue-400' },
  message: { bg: 'bg-emerald-500/5', border: 'border-emerald-500/30', iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-400' },
  ai: { bg: 'bg-cyan-500/5', border: 'border-cyan-500/30', iconBg: 'bg-cyan-500/15', iconColor: 'text-cyan-400' },
  end: { bg: 'bg-gray-500/5', border: 'border-gray-500/30', iconBg: 'bg-gray-500/15', iconColor: 'text-gray-400' },
}

function FlowNode({ variant, icon: Icon, title, subtitle, children, active = true }: FlowNodeProps) {
  const style = VARIANT_STYLES[variant]

  return (
    <div className={cn(
      'rounded-[var(--radius-lg)] border px-4 py-3 transition-opacity',
      style.bg,
      style.border,
      !active && 'opacity-50'
    )}>
      <div className="flex items-center gap-3">
        <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)]', style.iconBg)}>
          <Icon className={cn('h-4 w-4', style.iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary">{title}</p>
          {subtitle && <p className="text-xs text-text-tertiary">{subtitle}</p>}
        </div>
      </div>
      {children && <div className="mt-3 pl-11">{children}</div>}
    </div>
  )
}

// ============================================================
// Flow Connector
// ============================================================

function FlowConnector({ label, dashed }: { label?: string; dashed?: boolean }) {
  return (
    <div className="flex flex-col items-center py-1">
      <div className={cn('h-4 w-0.5', dashed ? 'border-l border-dashed border-border' : 'bg-border')} />
      {label && (
        <span className="my-0.5 rounded-full bg-bg-tertiary px-2 py-0.5 text-[10px] font-medium text-text-tertiary">
          {label}
        </span>
      )}
      <div className="flex flex-col items-center">
        <div className={cn('h-3 w-0.5', dashed ? 'border-l border-dashed border-border' : 'bg-border')} />
        <div className="h-0 w-0 border-l-[4px] border-r-[4px] border-t-[5px] border-transparent border-t-border" />
      </div>
    </div>
  )
}

// ============================================================
// Editable Delay
// ============================================================

function EditableDelay({ value, onChange, label }: {
  value: number
  onChange: (v: number) => void
  label: string
}) {
  const [editing, setEditing] = useState(false)

  const displayText = value >= 1440
    ? `${Math.floor(value / 1440)}d ${value % 1440 > 0 ? `${Math.floor((value % 1440) / 60)}h` : ''}`
    : value >= 60
      ? `${Math.floor(value / 60)}h ${value % 60 > 0 ? `${value % 60}min` : ''}`
      : `${value}min`

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 1)}
          autoFocus
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => e.key === 'Enter' && setEditing(false)}
          className="w-20 rounded-[var(--radius-md)] border border-accent bg-bg-tertiary px-2 py-1 text-xs text-text-primary"
        />
        <span className="text-xs text-text-tertiary">min</span>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="group inline-flex items-center gap-1.5 rounded-[var(--radius-full)] bg-bg-tertiary px-2.5 py-1 text-xs text-text-secondary hover:bg-surface-hover"
    >
      <Clock className="h-3 w-3" />
      {label}: {displayText}
      <Edit3 className="h-3 w-3 opacity-0 group-hover:opacity-100 text-text-tertiary" />
    </button>
  )
}

// ============================================================
// Editable Template
// ============================================================

function EditableTemplate({ value, onChange, label }: {
  value: string | null
  onChange: (v: string) => void
  label: string
}) {
  const [expanded, setExpanded] = useState(false)
  const safeValue = value ?? ''
  const hasTemplate = safeValue.trim().length > 0

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-1 text-xs text-text-tertiary hover:text-text-secondary"
      >
        <ChevronDown className={cn('h-3 w-3 transition-transform', expanded && 'rotate-180')} />
        {hasTemplate ? `Template: "${safeValue.slice(0, 40)}..."` : `${label} (IA gera automaticamente)`}
      </button>
      {expanded && (
        <div className="mt-2 animate-fade-in">
          <textarea
            value={safeValue}
            onChange={(e) => onChange(e.target.value)}
            rows={2}
            placeholder="Deixe vazio para a IA gerar automaticamente..."
            className="w-full rounded-[var(--radius-md)] border border-border bg-bg-tertiary px-3 py-2 text-xs text-text-primary placeholder:text-text-tertiary"
          />
        </div>
      )}
    </div>
  )
}

// ============================================================
// Recovery Flow Section
// ============================================================

interface RecoveryFlowBuilderProps {
  config: MockRecoveryConfig
  onChange: (config: MockRecoveryConfig) => void
}

function AbandonedCartFlow({ config, onChange }: RecoveryFlowBuilderProps) {
  function update<K extends keyof MockRecoveryConfig>(key: K, value: MockRecoveryConfig[K]) {
    onChange({ ...config, [key]: value })
  }

  return (
    <div className="flex flex-col items-center">
      {/* Trigger */}
      <FlowNode variant="trigger" icon={Zap} title="Carrinho Abandonado Detectado" subtitle="Webhook Shopify/Nuvemshop" />
      <FlowConnector />

      {/* Condition: Min Cart Value */}
      <FlowNode variant="condition" icon={Filter} title="Valor do Carrinho" subtitle={`>= R$ ${config.minCartValue}`}>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-tertiary">Valor minimo: R$</span>
          <input
            type="number"
            min={0}
            step={10}
            value={config.minCartValue}
            onChange={(e) => update('minCartValue', Number(e.target.value))}
            className="w-20 rounded-[var(--radius-md)] border border-border bg-bg-tertiary px-2 py-1 text-xs text-text-primary"
          />
        </div>
      </FlowNode>
      <FlowConnector label="Aprovado" />

      {/* Delay 1 */}
      <FlowNode variant="delay" icon={Clock} title="Aguardar" subtitle="Tempo apos abandono">
        <EditableDelay value={config.firstMessageDelay} onChange={(v) => update('firstMessageDelay', v)} label="Apos abandono" />
      </FlowNode>
      <FlowConnector />

      {/* Message 1 */}
      <FlowNode variant="message" icon={MessageSquare} title="1a Mensagem" subtitle="Mensagem inicial de recuperacao">
        <EditableTemplate value={config.firstMessageTemplate} onChange={(v) => update('firstMessageTemplate', v)} label="Template 1a msg" />
      </FlowNode>
      <FlowConnector />

      {/* AI Response Branch */}
      <FlowNode variant="ai" icon={Bot} title="IA Analisa Respostas" subtitle={`Ate ${config.maxAttempts} interacoes`}>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-tertiary">Max interacoes:</span>
          <input
            type="number"
            min={1}
            max={10}
            value={config.maxAttempts}
            onChange={(e) => update('maxAttempts', Number(e.target.value))}
            className="w-16 rounded-[var(--radius-md)] border border-border bg-bg-tertiary px-2 py-1 text-xs text-text-primary"
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">Comprou</span>
          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">Objecao</span>
          <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400">Duvida</span>
          <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400">Irritado</span>
        </div>
      </FlowNode>
      <FlowConnector label="Sem resposta" />

      {/* Follow-up 1 */}
      <FlowNode variant="delay" icon={Clock} title="Aguardar Follow-up 1">
        <EditableDelay value={config.followUp1Delay} onChange={(v) => update('followUp1Delay', v)} label="Apos 1a msg" />
      </FlowNode>
      <FlowConnector />
      <FlowNode variant="message" icon={MessageSquare} title="Follow-up 1" subtitle="Segunda tentativa de contato">
        <EditableTemplate value={config.followUp1Template} onChange={(v) => update('followUp1Template', v)} label="Template follow-up 1" />
      </FlowNode>
      <FlowConnector label="Sem resposta" />

      {/* Follow-up 2 */}
      <FlowNode variant="delay" icon={Clock} title="Aguardar Follow-up 2">
        <EditableDelay value={config.followUp2Delay} onChange={(v) => update('followUp2Delay', v)} label="Apos follow-up 1" />
      </FlowNode>
      <FlowConnector />
      <FlowNode variant="message" icon={MessageSquare} title="Follow-up 2" subtitle="Terceira tentativa (ultima chance)">
        <EditableTemplate value={config.followUp2Template} onChange={(v) => update('followUp2Template', v)} label="Template follow-up 2" />
      </FlowNode>

      {/* Follow-up 3 (optional) */}
      {config.followUp3Delay !== null && (
        <>
          <FlowConnector label="Sem resposta" />
          <FlowNode variant="delay" icon={Clock} title="Aguardar Follow-up 3">
            <EditableDelay value={config.followUp3Delay} onChange={(v) => update('followUp3Delay', v)} label="Apos follow-up 2" />
          </FlowNode>
          <FlowConnector />
          <FlowNode variant="message" icon={MessageSquare} title="Follow-up 3" subtitle="Tentativa final">
            <EditableTemplate value={config.followUp3Template} onChange={(v) => update('followUp3Template', v)} label="Template follow-up 3" />
          </FlowNode>
        </>
      )}

      <FlowConnector />

      {/* End */}
      <FlowNode variant="end" icon={XCircle} title="Fluxo Encerrado" subtitle="Lead marcado como perdido" />

      {/* Toggle Follow-up 3 */}
      <div className="mt-3 flex justify-center">
        <button
          type="button"
          onClick={() => update('followUp3Delay', config.followUp3Delay === null ? 2880 : null)}
          className="text-xs text-accent hover:text-accent-hover"
        >
          {config.followUp3Delay === null ? '+ Adicionar Follow-up 3' : '- Remover Follow-up 3'}
        </button>
      </div>
    </div>
  )
}

function PixFlow({ config, onChange }: RecoveryFlowBuilderProps) {
  function update<K extends keyof MockRecoveryConfig>(key: K, value: MockRecoveryConfig[K]) {
    onChange({ ...config, [key]: value })
  }

  return (
    <div className="flex flex-col items-center">
      <FlowNode variant="trigger" icon={Zap} title="PIX Gerado (Pendente)" subtitle="Pagamento PIX aguardando confirmacao" />
      <FlowConnector />
      <FlowNode variant="delay" icon={Clock} title="Aguardar">
        <EditableDelay value={config.pixFirstDelay} onChange={(v) => update('pixFirstDelay', v)} label="Apos geracao PIX" />
      </FlowNode>
      <FlowConnector />
      <FlowNode variant="message" icon={MessageSquare} title="Lembrete PIX" subtitle="Lembrar cliente de finalizar pagamento" />
      <FlowConnector />
      <FlowNode variant="ai" icon={Bot} title="IA Analisa Resposta" subtitle={`Ate ${config.pixMaxAttempts} tentativas`}>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-tertiary">Max tentativas:</span>
          <input
            type="number"
            min={1}
            max={5}
            value={config.pixMaxAttempts}
            onChange={(e) => update('pixMaxAttempts', Number(e.target.value))}
            className="w-16 rounded-[var(--radius-md)] border border-border bg-bg-tertiary px-2 py-1 text-xs text-text-primary"
          />
        </div>
      </FlowNode>
      <FlowConnector label="Sem resposta" />
      <FlowNode variant="delay" icon={Clock} title="Aguardar Follow-up">
        <EditableDelay value={config.pixFollowUpDelay} onChange={(v) => update('pixFollowUpDelay', v)} label="Apos lembrete" />
      </FlowNode>
      <FlowConnector />
      <FlowNode variant="message" icon={MessageSquare} title="Follow-up PIX" subtitle="Ultima tentativa" />
      <FlowConnector />
      <FlowNode variant="end" icon={XCircle} title="Fluxo Encerrado" />
    </div>
  )
}

function CardFlow({ config, onChange }: RecoveryFlowBuilderProps) {
  function update<K extends keyof MockRecoveryConfig>(key: K, value: MockRecoveryConfig[K]) {
    onChange({ ...config, [key]: value })
  }

  return (
    <div className="flex flex-col items-center">
      <FlowNode variant="trigger" icon={Zap} title="Cartao Recusado" subtitle="Tentativa de pagamento com cartao falhou" />
      <FlowConnector />
      <FlowNode variant="delay" icon={Clock} title="Aguardar">
        <EditableDelay value={config.cardFirstDelay} onChange={(v) => update('cardFirstDelay', v)} label="Apos recusa" />
      </FlowNode>
      <FlowConnector />
      <FlowNode variant="message" icon={MessageSquare} title="Notificacao" subtitle="Informar recusa e sugerir alternativa" />
      <FlowConnector />
      <FlowNode variant="ai" icon={Bot} title="IA Analisa Resposta" subtitle={`Ate ${config.cardMaxAttempts} tentativas`}>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-tertiary">Max tentativas:</span>
          <input
            type="number"
            min={1}
            max={5}
            value={config.cardMaxAttempts}
            onChange={(e) => update('cardMaxAttempts', Number(e.target.value))}
            className="w-16 rounded-[var(--radius-md)] border border-border bg-bg-tertiary px-2 py-1 text-xs text-text-primary"
          />
        </div>
      </FlowNode>
      <FlowConnector />
      <FlowNode variant="end" icon={XCircle} title="Fluxo Encerrado" />
    </div>
  )
}

// ============================================================
// Main Component
// ============================================================

type FlowTab = 'abandoned' | 'pix' | 'card'

interface FlowTabDef {
  id: FlowTab
  label: string
  icon: React.ComponentType<{ className?: string }>
  activeKey: keyof MockRecoveryConfig
}

const FLOW_TABS: FlowTabDef[] = [
  { id: 'abandoned', label: 'Carrinho Abandonado', icon: GitBranch, activeKey: 'isActive' },
  { id: 'pix', label: 'PIX Pendente', icon: UserCheck, activeKey: 'pixRecoveryEnabled' },
  { id: 'card', label: 'Cartao Recusado', icon: PhoneOff, activeKey: 'cardRecoveryEnabled' },
]

export function RecoveryFlowBuilder({ config: initial, onSave }: {
  config: MockRecoveryConfig
  onSave: (config: MockRecoveryConfig) => void
}) {
  const [form, setForm] = useState<MockRecoveryConfig>({ ...initial })
  const [activeFlow, setActiveFlow] = useState<FlowTab>('abandoned')
  const [saving, setSaving] = useState(false)

  function handleSave() {
    setSaving(true)
    setTimeout(() => {
      onSave(form)
      setSaving(false)
    }, 600)
  }

  return (
    <div className="space-y-6">
      {/* Flow Type Selector */}
      <div className="flex flex-wrap gap-2">
        {FLOW_TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = form[tab.activeKey] as boolean
          const selected = activeFlow === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFlow(tab.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-[var(--radius-lg)] border px-4 py-2.5 text-sm font-medium transition-colors',
                selected
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border bg-surface text-text-secondary hover:bg-surface-hover'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              <span className={cn(
                'ml-1 h-2 w-2 rounded-full',
                isActive ? 'bg-success' : 'bg-text-tertiary'
              )} />
            </button>
          )
        })}
      </div>

      {/* Active/Inactive Toggle */}
      {(() => {
        const isFlowActive = activeFlow === 'abandoned' ? form.isActive : activeFlow === 'pix' ? form.pixRecoveryEnabled : form.cardRecoveryEnabled
        return (
          <div className="flex items-center justify-between rounded-[var(--radius-lg)] border border-border bg-surface px-4 py-3">
            <span className="text-sm text-text-primary">
              {activeFlow === 'abandoned' ? 'Recuperacao de Carrinho' : activeFlow === 'pix' ? 'Recuperacao PIX' : 'Recuperacao Cartao'}
            </span>
            <Toggle
              checked={isFlowActive}
              onChange={() => {
                if (activeFlow === 'abandoned') setForm((p) => ({ ...p, isActive: !p.isActive }))
                else if (activeFlow === 'pix') setForm((p) => ({ ...p, pixRecoveryEnabled: !p.pixRecoveryEnabled }))
                else setForm((p) => ({ ...p, cardRecoveryEnabled: !p.cardRecoveryEnabled }))
              }}
              label={isFlowActive ? 'Ativo' : 'Inativo'}
            />
          </div>
        )
      })()}

      {/* Flow Visualization */}
      <div className="rounded-[var(--radius-lg)] border border-dashed border-border bg-bg-tertiary p-6">
        {activeFlow === 'abandoned' && (
          <AbandonedCartFlow config={form} onChange={setForm} />
        )}
        {activeFlow === 'pix' && (
          <PixFlow config={form} onChange={setForm} />
        )}
        {activeFlow === 'card' && (
          <CardFlow config={form} onChange={setForm} />
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button loading={saving} onClick={handleSave}>
          {!saving && <Save className="h-4 w-4" />}
          {saving ? 'Salvando...' : 'Salvar Fluxo'}
        </Button>
      </div>
    </div>
  )
}
