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
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center"
        style={{
          background: 'var(--accent-surface)',
          borderRadius: '12px',
        }}
      >
        <div style={{ color: 'var(--accent)' }}><Icon className="h-5 w-5" /></div>
      </div>
      <div>
        <h3
          className="text-[20px] font-bold"
          style={{
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </h3>
        {description && (
          <p
            className="text-[14px]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  )
}
