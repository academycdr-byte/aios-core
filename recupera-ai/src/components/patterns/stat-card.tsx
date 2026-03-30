import { cn } from '@/lib/utils'

export interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  iconColor?: string
  iconBg?: string
  className?: string
}

export function StatCard({ label, value, icon, className }: StatCardProps) {
  return (
    <div
      className={cn('flex items-center gap-4 p-5', className)}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
      }}
    >
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center"
        style={{
          background: 'var(--accent-surface)',
          borderRadius: '12px',
          color: 'var(--accent)',
        }}
      >
        {icon}
      </div>
      <div>
        <p
          className="text-[14px] font-medium"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {label}
        </p>
        <p
          className="mt-0.5 text-[24px] font-bold"
          style={{
            color: 'var(--text-primary)',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.02em',
          }}
        >
          {value}
        </p>
      </div>
    </div>
  )
}
