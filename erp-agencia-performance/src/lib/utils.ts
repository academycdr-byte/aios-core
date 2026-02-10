import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value)
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100)
}

export function calcCTR(cliques: number, impressoes: number): number {
  if (impressoes === 0) return 0
  return (cliques / impressoes) * 100
}

export function calcCPC(gastoReal: number, cliques: number): number {
  if (cliques === 0) return 0
  return gastoReal / cliques
}

export function calcROAS(receita: number, gastoReal: number): number {
  if (gastoReal === 0) return 0
  return receita / gastoReal
}

export function calcCPA(gastoReal: number, conversoes: number): number {
  if (conversoes === 0) return 0
  return gastoReal / conversoes
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ATIVO: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    PAUSADO: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    CHURN: "bg-red-500/10 text-red-400 border-red-500/20",
    ATIVA: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    PAUSADA: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    FINALIZADA: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    PENDENTE: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    PAGO: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    ATRASADO: "bg-red-500/10 text-red-400 border-red-500/20",
    CANCELADO: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  }
  return colors[status] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
}

export function getPrioridadeColor(prioridade: string): string {
  const colors: Record<string, string> = {
    BAIXA: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    MEDIA: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    ALTA: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    URGENTE: "bg-red-500/10 text-red-400 border-red-500/20",
  }
  return colors[prioridade] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
}
