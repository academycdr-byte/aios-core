import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const sizeStyles: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-sm gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, style, ...props }, ref) => {
    const variantStyle: React.CSSProperties =
      variant === 'primary'
        ? {
            background: 'var(--accent)',
            color: 'var(--text-inverse)',
          }
        : variant === 'secondary'
          ? {
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
            }
          : variant === 'danger'
            ? {
                background: 'transparent',
                color: 'var(--danger)',
                border: '1px solid var(--danger)',
              }
            : {
                background: 'transparent',
                color: 'var(--text-secondary)',
              }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-semibold transition-all',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'focus:outline-none',
          sizeStyles[size],
          className
        )}
        style={{
          borderRadius: '10px',
          ...variantStyle,
          ...style,
        }}
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
