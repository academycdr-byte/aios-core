import { cn } from '@/lib/utils'

export interface FieldGroupProps {
  label: string
  htmlFor?: string
  helper?: string
  error?: string
  children: React.ReactNode
  className?: string
}

export function FieldGroup({ label, htmlFor, helper, error, children, className }: FieldGroupProps) {
  return (
    <div className={cn('w-full', className)}>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-medium text-text-primary"
      >
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
      {!error && helper && <p className="mt-1 text-xs text-text-tertiary">{helper}</p>}
    </div>
  )
}
