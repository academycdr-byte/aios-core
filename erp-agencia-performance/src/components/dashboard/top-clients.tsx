"use client"

import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"

interface TopClientsProps {
  clientes: Array<{ id: string; nome: string; receita: number; roas: number }>
}

function getRoasBadgeColor(roas: number): string {
  if (roas >= 3) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
  if (roas >= 2) return "bg-amber-500/10 text-amber-400 border-amber-500/20"
  return "bg-red-500/10 text-red-400 border-red-500/20"
}

export function TopClients({ clientes }: TopClientsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 5 Clientes</CardTitle>
      </CardHeader>
      <div className="space-y-3">
        {clientes.length === 0 && (
          <p className="text-sm text-text-muted">Nenhum cliente encontrado.</p>
        )}
        {clientes.map((cliente, index) => (
          <div
            key={cliente.id}
            className="flex items-center gap-4 rounded-lg bg-bg-secondary px-4 py-3"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text-primary">
                {cliente.nome}
              </p>
              <p className="text-xs text-text-muted">
                {formatCurrency(cliente.receita)}
              </p>
            </div>
            <Badge className={getRoasBadgeColor(cliente.roas)}>
              ROAS {cliente.roas.toFixed(2)}x
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  )
}
