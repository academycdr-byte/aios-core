import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'

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
      <div className="mb-4 text-text-tertiary">{icon}</div>
      <h3 className="text-base font-semibold text-text-primary">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-text-secondary">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} size="md" className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  )
}
