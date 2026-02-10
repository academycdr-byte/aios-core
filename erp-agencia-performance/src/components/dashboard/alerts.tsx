"use client"

import { AlertTriangle } from "lucide-react"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface AlertItem {
  tipo: string
  mensagem: string
  clienteNome: string
}

interface AlertsProps {
  alerts: AlertItem[]
}

function getAlertStyles(tipo: string) {
  switch (tipo) {
    case "ROAS_BAIXO":
      return {
        border: "border-l-red-500",
        icon: "text-red-400",
        bg: "bg-red-500/5",
      }
    case "BUDGET_ESTOURANDO":
      return {
        border: "border-l-amber-500",
        icon: "text-amber-400",
        bg: "bg-amber-500/5",
      }
    default:
      return {
        border: "border-l-zinc-500",
        icon: "text-zinc-400",
        bg: "bg-zinc-500/5",
      }
  }
}

export function Alerts({ alerts }: AlertsProps) {
  if (alerts.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertas</CardTitle>
      </CardHeader>
      <div className="space-y-2">
        {alerts.map((alert, index) => {
          const styles = getAlertStyles(alert.tipo)
          return (
            <div
              key={`${alert.tipo}-${alert.clienteNome}-${index}`}
              className={cn(
                "flex items-start gap-3 rounded-lg border-l-4 px-4 py-3",
                styles.border,
                styles.bg
              )}
            >
              <AlertTriangle className={cn("mt-0.5 h-4 w-4 shrink-0", styles.icon)} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary">
                  {alert.clienteNome}
                </p>
                <p className="text-xs text-text-muted">{alert.mensagem}</p>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
