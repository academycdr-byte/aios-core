import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const variantStyles: Record<string, string> = {
  primary:
    'bg-accent text-text-inverse shadow-sm shadow-accent/25 hover:bg-accent-hover hover:shadow-md hover:shadow-accent/30 focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary',
  secondary:
    'border border-border text-text-secondary hover:bg-surface-hover hover:text-text-primary',
  danger:
    'border border-error/30 text-error hover:bg-error-light',
  ghost:
    'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
}

const sizeStyles: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-sm gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-semibold rounded-[var(--radius-md)] transition-all',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'focus:outline-none active:scale-[0.98]',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className={cn('animate-spin', size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
            {children}
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
