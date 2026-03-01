import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          ref={ref}
          className={cn(
            'w-full rounded-[var(--radius-md)] border bg-surface px-3 py-2.5 text-sm text-text-primary',
            'placeholder:text-text-tertiary resize-none',
            'focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-light',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error ? 'border-error' : 'border-border',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-error">{error}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
