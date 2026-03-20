import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative">
          {icon && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full rounded-[var(--radius-md)] border bg-surface px-3 py-2.5 text-sm text-text-primary',
              'placeholder:text-text-tertiary/60',
              'transition-all duration-200',
              'focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-light focus:shadow-[0_0_0_3px_var(--accent-lighter)]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error ? 'border-error' : 'border-border',
              icon && 'pl-9',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-xs text-error">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
