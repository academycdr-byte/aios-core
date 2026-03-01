'use client'

interface TooltipPayloadItem {
  dataKey: string
  name: string
  value: number
  color: string
}

interface ChartTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
  formatter?: (value: number, name: string) => string
  labelFormatter?: (label: string) => string
}

export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null

  const displayLabel = labelFormatter ? labelFormatter(label ?? '') : label

  return (
    <div
      className="rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2"
      style={{
        background: 'var(--bg-elevated)',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      {displayLabel && (
        <p
          className="mb-1.5 text-xs font-medium"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {displayLabel}
        </p>
      )}
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: entry.color }}
          />
          <span style={{ color: 'var(--text-secondary)' }}>{entry.name}:</span>
          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
            {formatter ? formatter(entry.value, entry.name) : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}
