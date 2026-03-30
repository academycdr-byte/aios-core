export interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'PENDING' | 'CONTACTING' | 'RECOVERED' | 'PAID' | 'LOST' | 'EXPIRED'
  size?: 'sm' | 'md'
  dot?: boolean
  children: React.ReactNode
  className?: string
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  CONTACTING: 'Contatando',
  RECOVERED: 'Recuperado',
  PAID: 'Pago',
  LOST: 'Perdido',
  EXPIRED: 'Expirado',
}

function getVariantStyles(variant: string): { bg: string; text: string; dotColor: string } {
  switch (variant) {
    case 'success':
    case 'RECOVERED':
      return { bg: 'var(--success-surface)', text: 'var(--success)', dotColor: 'var(--success)' }
    case 'PAID':
      return { bg: 'var(--success-surface)', text: 'var(--success)', dotColor: 'var(--success)' }
    case 'warning':
    case 'PENDING':
      return { bg: 'var(--warning-surface)', text: 'var(--warning)', dotColor: 'var(--warning)' }
    case 'error':
    case 'LOST':
      return { bg: 'var(--danger-surface)', text: 'var(--danger)', dotColor: 'var(--danger)' }
    case 'info':
    case 'CONTACTING':
      return { bg: 'var(--info-surface)', text: 'var(--info)', dotColor: 'var(--info)' }
    case 'EXPIRED':
      return { bg: 'var(--bg-hover)', text: 'var(--text-tertiary)', dotColor: 'var(--text-tertiary)' }
    default:
      return { bg: 'var(--bg-hover)', text: 'var(--text-secondary)', dotColor: 'var(--text-tertiary)' }
  }
}

export function Badge({ variant = 'neutral', size = 'md', dot, children, className }: BadgeProps) {
  const styles = getVariantStyles(variant)

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size === 'sm' ? '4px' : '6px',
        padding: size === 'sm' ? '2px 8px' : '2px 10px',
        fontSize: size === 'sm' ? '10px' : '12px',
        fontWeight: 600,
        borderRadius: '6px',
        background: styles.bg,
        color: styles.text,
      }}
    >
      {dot && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: styles.dotColor,
          }}
        />
      )}
      {children}
    </span>
  )
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge variant={status as BadgeProps['variant']} className={className}>
      {STATUS_LABELS[status] ?? status}
    </Badge>
  )
}
