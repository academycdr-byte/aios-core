import { cn } from '@/lib/utils'

export interface AvatarProps {
  name?: string
  src?: string
  size?: 'sm' | 'md' | 'lg'
  status?: 'online' | 'offline'
  className?: string
}

const sizeStyles: Record<string, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
}

const statusSizeStyles: Record<string, string> = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function Avatar({ name, src, size = 'md', status, className }: AvatarProps) {
  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      {src ? (
        <img
          src={src}
          alt={name ?? ''}
          className={cn(
            'rounded-[var(--radius-full)] object-cover',
            sizeStyles[size]
          )}
        />
      ) : (
        <div
          className={cn(
            'flex items-center justify-center rounded-[var(--radius-full)] bg-accent font-semibold text-text-inverse',
            sizeStyles[size]
          )}
        >
          {name ? getInitials(name) : '?'}
        </div>
      )}
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-bg-secondary',
            statusSizeStyles[size],
            status === 'online' ? 'bg-success' : 'bg-text-tertiary'
          )}
        />
      )}
    </div>
  )
}
