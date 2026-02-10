"use client"

import { AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface AlertItem {
  tipo: string
  mensagem: string
  clienteNome?: string
}

interface AlertsProps {
  alerts: AlertItem[]
}

export function Alerts({ alerts }: AlertsProps) {
  if (alerts.length === 0) return null

  return (
    <div className="rounded-xl border border-border bg-bg-card p-5 ring-1 ring-white/[0.03]">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-secondary">Alertas</h3>
        <span className="text-[11px] text-text-muted">{alerts.length} items</span>
      </div>
      <div className="max-h-[240px] space-y-1.5 overflow-y-auto">
        {alerts.map((alert, index) => {
          const isWarning = alert.tipo === "BUDGET_ESTOURANDO" || alert.tipo === "BUDGET_ALTO"
          return (
            <div
              key={`${alert.tipo}-${index}`}
              className={cn(
                "flex items-start gap-2.5 rounded-md px-3 py-2.5",
                isWarning ? "bg-amber-500/5" : "bg-red-500/5"
              )}
            >
              <AlertTriangle size={14} className={cn(
                "mt-0.5 shrink-0",
                isWarning ? "text-amber-400" : "text-red-400"
              )} />
              <p className="text-[13px] text-text-secondary leading-relaxed">
                {alert.mensagem}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
