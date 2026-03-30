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
      style={{
        background: '#1F2937',
        borderRadius: '8px',
        padding: '8px 12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}
    >
      {displayLabel && (
        <p
          style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: '12px',
            marginBottom: '4px',
          }}
        >
          {displayLabel}
        </p>
      )}
      {payload.map((entry) => (
        <div
          key={entry.dataKey}
          className="flex items-center gap-2"
          style={{ fontSize: '14px' }}
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: entry.color }}
          />
          <span style={{ color: 'rgba(255,255,255,0.7)' }}>{entry.name}:</span>
          <span style={{ color: '#FFFFFF', fontWeight: 700 }}>
            {formatter ? formatter(entry.value, entry.name) : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}
