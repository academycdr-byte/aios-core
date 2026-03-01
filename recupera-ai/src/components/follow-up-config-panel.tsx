'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Clock,
  Plus,
  Trash2,
  Save,
  MessageSquare,
  Zap,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'

interface FollowUpStepData {
  stepNumber: number
  delayMinutes: number
  strategy: string
  isActive: boolean
}

interface FollowUpConfigPanelProps {
  storeId: string
}

type CartTypeTab = 'ABANDONED_CART' | 'PIX_PENDING' | 'CARD_DECLINED'

const CART_TYPE_LABELS: Record<CartTypeTab, string> = {
  ABANDONED_CART: 'Carrinho Abandonado',
  PIX_PENDING: 'PIX Pendente',
  CARD_DECLINED: 'Cartao Recusado',
}

function formatDelay(minutes: number): string {
  if (minutes >= 1440) {
    const days = Math.floor(minutes / 1440)
    const remaining = minutes % 1440
    const hours = Math.floor(remaining / 60)
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`
  }
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }
  return `${minutes}min`
}

export function FollowUpConfigPanel({ storeId }: FollowUpConfigPanelProps) {
  const [allSteps, setAllSteps] = useState<Record<CartTypeTab, FollowUpStepData[]>>({
    ABANDONED_CART: [],
    PIX_PENDING: [],
    CARD_DECLINED: [],
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<CartTypeTab>('ABANDONED_CART')

  const fetchSteps = useCallback(async () => {
    try {
      const res = await fetch(`/api/stores/${storeId}/follow-up-steps`)
      if (res.ok) {
        const json = await res.json()
        const data = json.data ?? []

        const grouped: Record<CartTypeTab, FollowUpStepData[]> = {
          ABANDONED_CART: [],
          PIX_PENDING: [],
          CARD_DECLINED: [],
        }

        for (const step of data) {
          const type = step.cartType as CartTypeTab
          if (grouped[type]) {
            grouped[type].push({
              stepNumber: step.stepNumber,
              delayMinutes: step.delayMinutes,
              strategy: step.strategy,
              isActive: step.isActive,
            })
          }
        }

        // Sort each by stepNumber
        for (const type of Object.keys(grouped) as CartTypeTab[]) {
          grouped[type].sort((a, b) => a.stepNumber - b.stepNumber)
        }

        setAllSteps(grouped)
      }
    } catch (error) {
      console.error('Failed to fetch follow-up steps:', error)
    } finally {
      setLoading(false)
    }
  }, [storeId])

  useEffect(() => {
    fetchSteps()
  }, [fetchSteps])

  const steps = allSteps[activeTab]

  function updateStep(index: number, updates: Partial<FollowUpStepData>) {
    setAllSteps((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab].map((s, i) =>
        i === index ? { ...s, ...updates } : s
      ),
    }))
  }

  function addStep() {
    if (steps.length >= 8) return
    setAllSteps((prev) => ({
      ...prev,
      [activeTab]: [
        ...prev[activeTab],
        {
          stepNumber: steps.length,
          delayMinutes: steps.length === 0 ? 30 : 360,
          strategy: '',
          isActive: true,
        },
      ],
    }))
  }

  function removeStep(index: number) {
    if (steps.length <= 1) return
    setAllSteps((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab]
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, stepNumber: i })),
    }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/stores/${storeId}/follow-up-steps`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartType: activeTab, steps }),
      })
      if (!res.ok) {
        console.error('Failed to save follow-up steps')
      }
    } catch (error) {
      console.error('Failed to save follow-up steps:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  // Calculate cumulative timeline
  let cumulativeMinutes = 0
  const timeline = steps.map((step) => {
    cumulativeMinutes += step.delayMinutes
    return { ...step, cumulativeMinutes }
  })

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-text-primary">Follow-ups por Tipo</h3>
        <p className="text-xs text-text-tertiary">
          Configure a cadencia e estrategia de cada follow-up
        </p>
      </div>

      {/* Cart Type Tabs */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(CART_TYPE_LABELS) as CartTypeTab[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setActiveTab(type)}
            className={cn(
              'rounded-[var(--radius-md)] border px-3 py-1.5 text-xs font-medium transition-colors',
              activeTab === type
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border bg-surface text-text-secondary hover:bg-surface-hover'
            )}
          >
            {CART_TYPE_LABELS[type]}
            <span className="ml-1.5 text-[10px] text-text-tertiary">
              ({allSteps[type].length})
            </span>
          </button>
        ))}
      </div>

      {/* Timeline Preview */}
      <div className="rounded-[var(--radius-lg)] border border-dashed border-border bg-bg-tertiary p-4">
        <p className="mb-3 text-xs font-medium text-text-secondary">Timeline de Envio</p>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          <div className="flex shrink-0 items-center gap-1">
            <Zap className="h-3.5 w-3.5 text-purple-400" />
            <span className="text-[10px] text-text-tertiary">Evento</span>
          </div>
          {timeline.map((step, i) => (
            <div key={i} className="flex shrink-0 items-center gap-1">
              <div className="h-px w-6 bg-border" />
              <Clock className="h-3 w-3 text-blue-400" />
              <span className="text-[10px] font-medium text-text-secondary">
                +{formatDelay(step.delayMinutes)}
              </span>
              <div className="h-px w-3 bg-border" />
              <div className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-medium',
                i === 0
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-blue-500/10 text-blue-400'
              )}>
                {i === 0 ? '1a Msg' : `FU ${i}`}
              </div>
              <span className="text-[9px] text-text-tertiary">
                ({formatDelay(step.cumulativeMinutes)})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Steps Configuration */}
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div
            key={index}
            className={cn(
              'rounded-[var(--radius-lg)] border p-3 transition-colors',
              step.isActive
                ? 'border-border bg-surface'
                : 'border-border/50 bg-surface/50 opacity-60'
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                index === 0
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-blue-500/15 text-blue-400'
              )}>
                {index === 0 ? <MessageSquare className="h-3.5 w-3.5" /> : index}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-text-primary">
                    {index === 0 ? 'Primeira Mensagem' : `Follow-up ${index}`}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateStep(index, { isActive: !step.isActive })}
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors',
                        step.isActive
                          ? 'bg-success/10 text-success'
                          : 'bg-text-tertiary/10 text-text-tertiary'
                      )}
                    >
                      {step.isActive ? 'Ativo' : 'Inativo'}
                    </button>
                    {steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStep(index)}
                        className="rounded p-1 text-error/60 hover:text-error"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Delay */}
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-text-tertiary" />
                  <span className="text-[11px] text-text-tertiary">Aguardar:</span>
                  <input
                    type="number"
                    min={1}
                    value={step.delayMinutes}
                    onChange={(e) => updateStep(index, { delayMinutes: Number(e.target.value) || 1 })}
                    className="w-20 rounded-[var(--radius-md)] border border-border bg-bg-tertiary px-2 py-1 text-xs text-text-primary"
                  />
                  <span className="text-[11px] text-text-tertiary">min</span>
                  <span className="text-[10px] text-text-tertiary">
                    ({formatDelay(step.delayMinutes)})
                  </span>
                </div>

                {/* Strategy */}
                <div>
                  <details className="group">
                    <summary className="flex cursor-pointer items-center gap-1 text-[11px] text-text-tertiary hover:text-text-secondary">
                      <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
                      {step.strategy ? `Estrategia: "${step.strategy.slice(0, 50)}..."` : 'Definir estrategia (opcional)'}
                    </summary>
                    <textarea
                      value={step.strategy}
                      onChange={(e) => updateStep(index, { strategy: e.target.value })}
                      rows={2}
                      placeholder="Ex: Reforcar beneficios, criar urgencia leve..."
                      className="mt-2 w-full rounded-[var(--radius-md)] border border-border bg-bg-tertiary px-3 py-2 text-xs text-text-primary placeholder:text-text-tertiary"
                    />
                  </details>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Step */}
      {steps.length < 8 && (
        <button
          type="button"
          onClick={addStep}
          className="flex w-full items-center justify-center gap-1.5 rounded-[var(--radius-lg)] border border-dashed border-border py-2 text-xs text-text-tertiary hover:border-accent hover:text-accent"
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar Follow-up ({steps.length}/8)
        </button>
      )}

      {/* Save */}
      <div className="flex justify-end">
        <Button size="sm" loading={saving} onClick={handleSave}>
          {!saving && <Save className="h-3.5 w-3.5" />}
          {saving ? 'Salvando...' : 'Salvar Follow-ups'}
        </Button>
      </div>
    </div>
  )
}
