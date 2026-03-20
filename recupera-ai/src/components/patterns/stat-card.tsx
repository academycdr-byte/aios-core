import { cn } from '@/lib/utils'

export interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  iconColor?: string
  iconBg?: string
  className?: string
}

export function StatCard({ label, value, icon, iconColor, iconBg, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'group flex items-center gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-4',
        'transition-all duration-200 hover:border-border-hover hover:shadow-[var(--shadow-sm)] hover:-translate-y-[1px]',
        className
      )}
    >
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-lg)] transition-transform duration-200 group-hover:scale-105"
        style={{ background: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-text-tertiary">{label}</p>
        <p className="mt-0.5 text-xl font-bold text-value text-text-primary">{value}</p>
      </div>
    </div>
  )
}
