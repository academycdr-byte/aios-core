'use client'

import { useState } from 'react'
import { Save, Bot, Clock } from 'lucide-react'
import type { MockStoreSettings } from '@/lib/mock-stores'
import { Button, Input, Select, Toggle } from '@/components/ui'
import { SectionHeader } from '@/components/patterns'

interface StoreSettingsFormProps {
  settings: MockStoreSettings
  onSave: (settings: MockStoreSettings) => void
}

const AI_TONES: { value: string; label: string }[] = [
  { value: 'profissional', label: 'Profissional' },
  { value: 'amigavel', label: 'Amigavel' },
  { value: 'casual', label: 'Casual' },
  { value: 'persuasivo', label: 'Persuasivo' },
]

const TIMEZONES: { value: string; label: string }[] = [
  { value: 'America/Sao_Paulo', label: 'Brasilia (GMT-3)' },
  { value: 'America/Manaus', label: 'Manaus (GMT-4)' },
  { value: 'America/Belem', label: 'Belem (GMT-3)' },
  { value: 'America/Recife', label: 'Recife (GMT-3)' },
  { value: 'America/Fortaleza', label: 'Fortaleza (GMT-3)' },
  { value: 'America/Cuiaba', label: 'Cuiaba (GMT-4)' },
  { value: 'America/Rio_Branco', label: 'Rio Branco (GMT-5)' },
]

export function StoreSettingsForm({ settings: initial, onSave }: StoreSettingsFormProps) {
  const [form, setForm] = useState<MockStoreSettings>({ ...initial })
  const [saving, setSaving] = useState(false)

  function update<K extends keyof MockStoreSettings>(key: K, value: MockStoreSettings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    setSaving(true)
    setTimeout(() => {
      onSave(form)
      setSaving(false)
    }, 600)
  }

  return (
    <div className="space-y-8">
      {/* AI Behavior */}
      <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <SectionHeader
          icon={Bot}
          title="Comportamento da IA"
          description="Personalize como a IA se comunica com seus clientes"
        />
        <div className="space-y-4">
          <div className="max-w-xs">
            <label htmlFor="aiTone" className="mb-1.5 block text-sm font-medium text-text-primary">
              Tom da IA
            </label>
            <Select
              id="aiTone"
              value={form.aiTone}
              onChange={(e) => update('aiTone', e.target.value)}
              options={AI_TONES}
            />
          </div>
          <div className="max-w-xs">
            <label htmlFor="aiName" className="mb-1.5 block text-sm font-medium text-text-primary">
              Nome da IA
            </label>
            <Input
              id="aiName"
              type="text"
              value={form.aiName}
              onChange={(e) => update('aiName', e.target.value)}
              placeholder="Assistente"
            />
            <p className="mt-1 text-xs text-text-tertiary">
              Nome que a IA usara ao se apresentar
            </p>
          </div>
        </div>
      </section>

      {/* Business Hours */}
      <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <SectionHeader
          icon={Clock}
          title="Horario de Funcionamento"
          description="Defina quando a IA pode enviar mensagens"
        />
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label htmlFor="businessHoursStart" className="mb-1.5 block text-sm font-medium text-text-primary">
                Inicio
              </label>
              <Input
                id="businessHoursStart"
                type="time"
                value={form.businessHoursStart ?? ''}
                onChange={(e) => update('businessHoursStart', e.target.value)}
                className="w-auto"
              />
            </div>
            <div>
              <label htmlFor="businessHoursEnd" className="mb-1.5 block text-sm font-medium text-text-primary">
                Fim
              </label>
              <Input
                id="businessHoursEnd"
                type="time"
                value={form.businessHoursEnd ?? ''}
                onChange={(e) => update('businessHoursEnd', e.target.value)}
                className="w-auto"
              />
            </div>
          </div>
          <Toggle
            checked={form.sendOutsideHours}
            onChange={(v) => update('sendOutsideHours', v)}
            label="Enviar fora do horario?"
          />
          <div className="max-w-xs">
            <label htmlFor="timezone" className="mb-1.5 block text-sm font-medium text-text-primary">
              Timezone
            </label>
            <Select
              id="timezone"
              value={form.timezone}
              onChange={(e) => update('timezone', e.target.value)}
              options={TIMEZONES}
            />
          </div>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button loading={saving} onClick={handleSave}>
          {!saving && <Save className="h-4 w-4" />}
          {saving ? 'Salvando...' : 'Salvar Configuracoes'}
        </Button>
      </div>
    </div>
  )
}
