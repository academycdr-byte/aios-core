/**
 * Formatting utilities for RecuperaAI
 * Currency, dates, percentages, and relative time
 */

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const compactCurrencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const percentFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const numberFormatter = new Intl.NumberFormat('pt-BR')

/**
 * Format value as BRL currency: R$ 1.234,56
 */
export function formatCurrency(value: number): string {
  return currencyFormatter.format(value)
}

/**
 * Format value as compact BRL: R$ 1.235
 */
export function formatCurrencyCompact(value: number): string {
  return compactCurrencyFormatter.format(value)
}

/**
 * Format value as BRL with K/M suffix: R$ 45,2K
 */
export function formatCurrencyShort(value: number): string {
  if (value >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(1).replace('.', ',')}M`
  }
  if (value >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(1).replace('.', ',')}K`
  }
  return formatCurrency(value)
}

/**
 * Format as percentage: 18,5%
 */
export function formatPercent(value: number): string {
  return percentFormatter.format(value / 100)
}

/**
 * Format number with locale: 1.234
 */
export function formatNumber(value: number): string {
  return numberFormatter.format(value)
}

/**
 * Format relative time: "há 5 min", "há 2h", "há 1 dia"
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) {
    return 'agora'
  }
  if (diffMinutes < 60) {
    return `há ${diffMinutes} min`
  }
  if (diffHours < 24) {
    return `há ${diffHours}h`
  }
  if (diffDays === 1) {
    return 'há 1 dia'
  }
  if (diffDays < 30) {
    return `há ${diffDays} dias`
  }
  return date.toLocaleDateString('pt-BR')
}

/**
 * Format date as short: "24 fev"
 */
export function formatDateShort(date: Date): string {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

/**
 * Format date as chart label: "24/02"
 */
export function formatDateChart(date: Date): string {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}
