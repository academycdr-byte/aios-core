import { cn } from '@/lib/utils'

export interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center"
        style={{
          background: 'var(--accent-surface)',
          borderRadius: '50%',
        }}
      >
        <div style={{ color: 'var(--accent)' }}>{icon}</div>
      </div>
      <h3
        className="text-[20px] font-bold"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </h3>
      {description && (
        <p
          className="mt-1 max-w-sm text-[14px]"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 text-[14px] font-medium"
          style={{
            background: 'var(--accent)',
            color: 'var(--text-inverse)',
            borderRadius: '10px',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
