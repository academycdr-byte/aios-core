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
        'flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4',
        className
      )}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)]"
        style={{ background: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm text-text-secondary">{label}</p>
        <p className="text-xl font-semibold text-text-primary">{value}</p>
      </div>
    </div>
  )
}
