'use client'

import { useState } from 'react'
import { Save, Bot, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MockStoreSettings } from '@/lib/mock-stores'

interface StoreSettingsFormProps {
  settings: MockStoreSettings
  onSave: (settings: MockStoreSettings) => void
}

const AI_TONES = [
  { value: 'profissional', label: 'Profissional' },
  { value: 'amigavel', label: 'Amigavel' },
  { value: 'casual', label: 'Casual' },
  { value: 'persuasivo', label: 'Persuasivo' },
] as const

const TIMEZONES = [
  { value: 'America/Sao_Paulo', label: 'Brasilia (GMT-3)' },
  { value: 'America/Manaus', label: 'Manaus (GMT-4)' },
  { value: 'America/Belem', label: 'Belem (GMT-3)' },
  { value: 'America/Recife', label: 'Recife (GMT-3)' },
  { value: 'America/Fortaleza', label: 'Fortaleza (GMT-3)' },
  { value: 'America/Cuiaba', label: 'Cuiaba (GMT-4)' },
  { value: 'America/Rio_Branco', label: 'Rio Branco (GMT-5)' },
] as const

function SectionHeader({ icon: Icon, title, description }: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description?: string
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-accent-light">
        <Icon className="h-4 w-4 text-accent" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        {description && (
          <p className="text-xs text-text-tertiary">{description}</p>
        )}
      </div>
    </div>
  )
}

function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-text-primary">
      {children}
    </label>
  )
}

function Toggle({ checked, onChange, label }: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3"
    >
      <div
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          checked ? 'bg-accent' : 'bg-border'
        )}
      >
        <div
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
            checked ? 'translate-x-[22px]' : 'translate-x-0.5'
          )}
        />
      </div>
      <span className="text-sm text-text-primary">{label}</span>
    </button>
  )
}

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
          <div>
            <FieldLabel htmlFor="aiTone">Tom da IA</FieldLabel>
            <select
              id="aiTone"
              value={form.aiTone}
              onChange={(e) => update('aiTone', e.target.value)}
              className="w-full max-w-xs rounded-[var(--radius-md)] border border-border bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary"
            >
              {AI_TONES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="aiName">Nome da IA</FieldLabel>
            <input
              id="aiName"
              type="text"
              value={form.aiName}
              onChange={(e) => update('aiName', e.target.value)}
              placeholder="Assistente"
              className="w-full max-w-xs rounded-[var(--radius-md)] border border-border bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary"
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
              <FieldLabel htmlFor="businessHoursStart">Inicio</FieldLabel>
              <input
                id="businessHoursStart"
                type="time"
                value={form.businessHoursStart ?? ''}
                onChange={(e) => update('businessHoursStart', e.target.value)}
                className="rounded-[var(--radius-md)] border border-border bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary"
              />
            </div>
            <div>
              <FieldLabel htmlFor="businessHoursEnd">Fim</FieldLabel>
              <input
                id="businessHoursEnd"
                type="time"
                value={form.businessHoursEnd ?? ''}
                onChange={(e) => update('businessHoursEnd', e.target.value)}
                className="rounded-[var(--radius-md)] border border-border bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary"
              />
            </div>
          </div>
          <Toggle
            checked={form.sendOutsideHours}
            onChange={(v) => update('sendOutsideHours', v)}
            label="Enviar fora do horario?"
          />
          <div>
            <FieldLabel htmlFor="timezone">Timezone</FieldLabel>
            <select
              id="timezone"
              value={form.timezone}
              onChange={(e) => update('timezone', e.target.value)}
              className="w-full max-w-xs rounded-[var(--radius-md)] border border-border bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-accent px-6 py-2.5 text-sm font-semibold text-text-inverse hover:bg-accent-hover disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Salvando...' : 'Salvar Configuracoes'}
        </button>
      </div>
    </div>
  )
}
