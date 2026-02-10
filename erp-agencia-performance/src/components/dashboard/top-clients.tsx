"use client"

import { formatCurrency } from "@/lib/utils"

interface TopClientsProps {
  clientes: Array<{ id: string; nome: string; receita: number; roas: number }>
}

export function TopClients({ clientes }: TopClientsProps) {
  return (
    <div className="rounded-xl border border-border bg-bg-card p-5 h-full ring-1 ring-white/[0.03]">
      <h3 className="mb-4 text-sm font-medium text-text-secondary">Top Clientes</h3>
      {clientes.length === 0 ? (
        <p className="py-8 text-center text-xs text-text-muted">Nenhum cliente encontrado</p>
      ) : (
        <div className="space-y-1">
          {clientes.map((cliente, index) => (
            <div
              key={cliente.id}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-bg-hover"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[11px] font-medium text-text-muted bg-bg-secondary">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-text-primary">{cliente.nome}</p>
                <p className="text-[11px] text-text-muted">{formatCurrency(cliente.receita)}</p>
              </div>
              <span className={`text-[11px] font-medium ${
                cliente.roas >= 3 ? "text-emerald-400" : cliente.roas >= 2 ? "text-amber-400" : "text-red-400"
              }`}>
                {cliente.roas.toFixed(1)}x
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
