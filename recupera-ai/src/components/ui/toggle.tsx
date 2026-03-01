'use client'

import { cn } from '@/lib/utils'

export interface ToggleProps {
  checked: boolean
  onChange: (value: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
  className?: string
}

export function Toggle({ checked, onChange, label, description, disabled, className }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
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
      {(label || description) && (
        <div className="text-left">
          {label && <span className="text-sm text-text-primary">{label}</span>}
          {description && <p className="text-xs text-text-tertiary">{description}</p>}
        </div>
      )}
    </button>
  )
}
