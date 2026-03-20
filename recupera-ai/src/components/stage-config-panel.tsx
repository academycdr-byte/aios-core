'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Target,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Save,
  Percent,
  Sparkles,
  GripVertical,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, Toggle } from '@/components/ui'
import type { RecoveryStage } from '@/types'

interface StageConfigPanelProps {
  storeId: string
}

interface StageFormData {
  name: string
  order: number
  objective: string
  aiInstructions: string
  discountEnabled: boolean
  discountPercent: number | null
  firstMessageTone: string | null
  firstMessageElements: string | null
}

export function StageConfigPanel({ storeId }: StageConfigPanelProps) {
  const [stages, setStages] = useState<StageFormData[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0)

  const fetchStages = useCallback(async () => {
    try {
      const res = await fetch(`/api/stores/${storeId}/stages`)
      if (res.ok) {
        const json = await res.json()
        const data = (json.data ?? []) as RecoveryStage[]
        setStages(
          data.map((s) => ({
            name: s.name,
            order: s.order,
            objective: s.objective,
            aiInstructions: s.aiInstructions,
            discountEnabled: s.discountEnabled,
            discountPercent: s.discountPercent,
            firstMessageTone: s.firstMessageTone,
            firstMessageElements: s.firstMessageElements,
          }))
        )
      }
    } catch (error) {
      console.error('Failed to fetch stages:', error)
    } finally {
      setLoading(false)
    }
  }, [storeId])

  useEffect(() => {
    fetchStages()
  }, [fetchStages])

  function updateStage(index: number, updates: Partial<StageFormData>) {
    setStages((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...updates } : s))
    )
  }

  function addStage() {
    const newOrder = stages.length + 1
    setStages((prev) => [
      ...prev,
      {
        name: `Etapa ${newOrder}`,
        order: newOrder,
        objective: '',
        aiInstructions: '',
        discountEnabled: false,
        discountPercent: null,
        firstMessageTone: null,
        firstMessageElements: null,
      },
    ])
    setExpandedIndex(stages.length)
  }

  function removeStage(index: number) {
    if (stages.length <= 1) return
    setStages((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, order: i + 1 }))
    )
    setExpandedIndex(null)
  }

  function moveStage(index: number, direction: 'up' | 'down') {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= stages.length) return
    setStages((prev) => {
      const copy = [...prev]
      const temp = copy[index]
      copy[index] = copy[newIndex]
      copy[newIndex] = temp
      return copy.map((s, i) => ({ ...s, order: i + 1 }))
    })
    setExpandedIndex(newIndex)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/stores/${storeId}/stages`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stages }),
      })
      if (!res.ok) {
        console.error('Failed to save stages')
      }
    } catch (error) {
      console.error('Failed to save stages:', error)
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Etapas de Recuperação</h3>
          <p className="text-xs text-text-tertiary">
            Configure a estratégia da IA em cada etapa da conversa
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={addStage}>
          <Plus className="h-3.5 w-3.5" />
          Adicionar Etapa
        </Button>
      </div>

      <div className="space-y-2">
        {stages.map((stage, index) => {
          const isExpanded = expandedIndex === index

          return (
            <div
              key={index}
              className={cn(
                'rounded-[var(--radius-lg)] border transition-colors',
                isExpanded
                  ? 'border-accent/40 bg-accent/5'
                  : 'border-border bg-surface'
              )}
            >
              {/* Header */}
              <button
                type="button"
                onClick={() => setExpandedIndex(isExpanded ? null : index)}
                className="flex w-full items-center gap-3 px-4 py-3"
              >
                <GripVertical className="h-4 w-4 text-text-tertiary" />
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
                  {stage.order}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-text-primary">{stage.name}</p>
                  <p className="truncate text-xs text-text-tertiary">{stage.objective || 'Sem objetivo definido'}</p>
                </div>
                {stage.discountEnabled && (
                  <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning">
                    <Percent className="mr-0.5 inline h-3 w-3" />
                    {stage.discountPercent}%
                  </span>
                )}
                <ChevronDown className={cn('h-4 w-4 text-text-tertiary transition-transform', isExpanded && 'rotate-180')} />
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="space-y-4 border-t border-border/50 px-4 pb-4 pt-3">
                  {/* Name */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-text-secondary">Nome da Etapa</label>
                    <input
                      type="text"
                      value={stage.name}
                      onChange={(e) => updateStage(index, { name: e.target.value })}
                      className="w-full rounded-[var(--radius-md)] border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary"
                    />
                  </div>

                  {/* Objective */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-text-secondary">
                      <Target className="mr-1 inline h-3.5 w-3.5" />
                      Objetivo desta etapa
                    </label>
                    <input
                      type="text"
                      value={stage.objective}
                      onChange={(e) => updateStage(index, { objective: e.target.value })}
                      placeholder="Ex: Conseguir que o cliente responda"
                      className="w-full rounded-[var(--radius-md)] border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary"
                    />
                  </div>

                  {/* AI Instructions */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-text-secondary">
                      <Sparkles className="mr-1 inline h-3.5 w-3.5" />
                      Instrucoes para a IA
                    </label>
                    <textarea
                      value={stage.aiInstructions}
                      onChange={(e) => updateStage(index, { aiInstructions: e.target.value })}
                      rows={3}
                      placeholder="Ex: Seja natural e amigavel. Gere curiosidade sobre os produtos..."
                      className="w-full rounded-[var(--radius-md)] border border-border bg-bg-tertiary px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary"
                    />
                  </div>

                  {/* First Message Config (only stage 1) */}
                  {stage.order === 1 && (
                    <div className="rounded-[var(--radius-md)] border border-dashed border-accent/30 bg-accent/5 p-3">
                      <p className="mb-2 text-xs font-medium text-accent">Configuracao da Primeira Mensagem</p>
                      <div className="space-y-2">
                        <div>
                          <label className="mb-1 block text-[11px] text-text-tertiary">Tom da abordagem</label>
                          <select
                            value={stage.firstMessageTone ?? 'amigavel'}
                            onChange={(e) => updateStage(index, { firstMessageTone: e.target.value })}
                            className="w-full rounded-[var(--radius-md)] border border-border bg-bg-tertiary px-2 py-1.5 text-xs text-text-primary"
                          >
                            <option value="amigavel">Amigavel</option>
                            <option value="profissional">Profissional</option>
                            <option value="casual">Casual</option>
                            <option value="persuasivo">Persuasivo</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] text-text-tertiary">Elementos obrigatorios</label>
                          <input
                            type="text"
                            value={stage.firstMessageElements ?? ''}
                            onChange={(e) => updateStage(index, { firstMessageElements: e.target.value })}
                            placeholder="nome do cliente, produto, pergunta aberta"
                            className="w-full rounded-[var(--radius-md)] border border-border bg-bg-tertiary px-2 py-1.5 text-xs text-text-primary placeholder:text-text-tertiary"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Discount Toggle */}
                  <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-border bg-bg-tertiary px-3 py-2">
                    <div>
                      <p className="text-xs font-medium text-text-primary">Liberar desconto nesta etapa</p>
                      <p className="text-[11px] text-text-tertiary">A IA podera ofertar desconto quando chegar nesta etapa</p>
                    </div>
                    <Toggle
                      checked={stage.discountEnabled}
                      onChange={() => updateStage(index, { discountEnabled: !stage.discountEnabled })}
                      label=""
                    />
                  </div>

                  {stage.discountEnabled && (
                    <div className="flex items-center gap-2 pl-3">
                      <Percent className="h-4 w-4 text-text-tertiary" />
                      <span className="text-xs text-text-tertiary">Desconto maximo:</span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={stage.discountPercent ?? 10}
                        onChange={(e) => updateStage(index, { discountPercent: Number(e.target.value) })}
                        className="w-16 rounded-[var(--radius-md)] border border-border bg-bg-tertiary px-2 py-1 text-xs text-text-primary"
                      />
                      <span className="text-xs text-text-tertiary">%</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => moveStage(index, 'up')}
                        disabled={index === 0}
                        className="rounded p-1 text-text-tertiary hover:bg-surface-hover disabled:opacity-30"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveStage(index, 'down')}
                        disabled={index === stages.length - 1}
                        className="rounded p-1 text-text-tertiary hover:bg-surface-hover disabled:opacity-30"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStage(index)}
                      disabled={stages.length <= 1}
                      className="rounded p-1 text-error/60 hover:text-error disabled:opacity-30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <Button loading={saving} onClick={handleSave}>
          {!saving && <Save className="h-4 w-4" />}
          {saving ? 'Salvando...' : 'Salvar Etapas'}
        </Button>
      </div>
    </div>
  )
}
