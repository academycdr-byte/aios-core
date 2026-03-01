import { cn } from '@/lib/utils'

export interface SectionHeaderProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  className?: string
}

export function SectionHeader({ icon: Icon, title, description, className }: SectionHeaderProps) {
  return (
    <div className={cn('mb-4 flex items-center gap-3', className)}>
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
