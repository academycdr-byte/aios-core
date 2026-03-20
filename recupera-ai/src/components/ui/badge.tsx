import { cn } from '@/lib/utils'

type SemanticVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral'
type StatusVariant = 'PENDING' | 'CONTACTING' | 'RECOVERED' | 'PAID' | 'LOST' | 'EXPIRED'

export interface BadgeProps {
  variant?: SemanticVariant | StatusVariant
  size?: 'sm' | 'md'
  dot?: boolean
  children: React.ReactNode
  className?: string
}

const semanticStyles: Record<string, string> = {
  success: 'bg-success-light text-success border border-success/20',
  warning: 'bg-warning-light text-warning border border-warning/20',
  error: 'bg-error-light text-error border border-error/20',
  info: 'bg-info-light text-info border border-info/20',
  neutral: 'bg-surface-active text-text-secondary border border-border',
}

const statusStyles: Record<string, string> = {
  PENDING: 'bg-surface-active text-text-secondary border border-border',
  CONTACTING: 'bg-info-light text-info border border-info/20',
  RECOVERED: 'bg-success-light text-success border border-success/20',
  PAID: 'bg-accent-light text-accent border border-accent/20',
  LOST: 'bg-error-light text-error border border-error/20',
  EXPIRED: 'bg-surface-active text-text-tertiary border border-border',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  CONTACTING: 'Contatando',
  RECOVERED: 'Recuperado',
  PAID: 'Pago',
  LOST: 'Perdido',
  EXPIRED: 'Expirado',
}

const dotColors: Record<string, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  info: 'bg-info',
  neutral: 'bg-text-tertiary',
  PENDING: 'bg-text-tertiary',
  CONTACTING: 'bg-info',
  RECOVERED: 'bg-success',
  PAID: 'bg-accent',
  LOST: 'bg-error',
  EXPIRED: 'bg-text-tertiary',
}

export function Badge({ variant = 'neutral', size = 'md', dot, children, className }: BadgeProps) {
  const style = statusStyles[variant] ?? semanticStyles[variant] ?? semanticStyles.neutral

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-[var(--radius-full)]',
        size === 'sm' ? 'px-2 py-0.5 text-[10px] gap-1' : 'px-2.5 py-0.5 text-xs gap-1.5',
        style,
        className
      )}
    >
      {dot && (
        <span className={cn('h-1.5 w-1.5 rounded-full', dotColors[variant] ?? 'bg-text-tertiary')} />
      )}
      {children}
    </span>
  )
}

/** Convenience: renders a status badge with auto-label */
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge variant={status as StatusVariant} className={className}>
      {STATUS_LABELS[status] ?? status}
    </Badge>
  )
}
